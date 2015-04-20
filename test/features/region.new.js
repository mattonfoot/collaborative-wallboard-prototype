var chai = require('chai');
var should = chai.should();
var fixture = require('../fixtures/BasicWall.WithOneBoard');

var storedWall, storedBoard;

function features() {
  beforeEach(function( done ) {
    var services = this.services;

    fixture( this, 'board for region' )
      .then(function( storage ) {
        storedWall = storage.wall;
        storedBoard = storage.board;

        return services.displayBoard( storedBoard.getId() );
      })
      .then(function( board ) {
        done();
      })
      .catch( done );
  });

  it('Emit a <region:new> event passing a valid board id to access an input control allowing you to enter details required to create a new Region\n', function(done) {
    var queue = this.queue;

    queue.subscribe( '#:fail', done ).once();
    queue.subscribe( '#.fail', done ).once();

    queue.when([
      'region:new',
      'regioncreator:displayed'
    ],
    function( a, b ) {
      should.exist( a );
      a.should.equal( storedBoard.getId() );

      b.should.be.instanceOf( queue.nodata );

      done();
    },
    done,
    { once: true });

    queue.trigger( 'region:new', storedBoard.getId() );
  });
}

features.title = 'Accessing the region creator input control';

module.exports = features;
