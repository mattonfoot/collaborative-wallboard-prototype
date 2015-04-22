var chai = require('chai');
var should = chai.should();
var fixture = require('../fixtures/BasicWall.WithOneBoard');

var storedName = 'new region'
  , storedWall, storedBoard;

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

  it('Emit a <region:create> event passing a data object with a valid board id and a label attribute to trigger the process of creating a new Region\n', function( done ) {
    var queue = this.queue;

    queue.subscribe( '#:fail', done ).once();
    queue.subscribe( '#.fail', done ).once();

    queue.when([
      'region:create',
      'region:created'
    ],
    function( a, b ) {
      should.exist( a );

      should.exist( b );
      b.should.be.a.specificRegionResource( storedName, storedBoard.getId() );

      done();
    },
    done,
    { once: true });

    queue.publish( 'region:create', { board: storedBoard.getId(), label: storedName } );
  });
}

features.title = 'Creating a Region on a Board';

module.exports = features;
