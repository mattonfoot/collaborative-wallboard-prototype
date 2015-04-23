var chai = require('chai');
var should = chai.should();
var fixture = require('../fixtures/BasicWall');

var storedWall;

function features() {
  beforeEach(function( done ) {
    var services = this.services;

    fixture( this, 'Wall for board' )
      .then(function( storage ) {
        storedWall = storage.wall;

        return services.displayWall( storedWall.getId() );
      })
      .then(function() {
        done();
      })
      .catch( done );
  });

  it('Emit a <wall.new> event passing a valid wall id to access an input control allowing you to enter details required to create a new Board\n', function(done) {
    var queue = this.queue;

    queue.subscribe( '#.fail', done ).once();

    queue.subscribe( 'boardcreator.displayed', function( displayed ) {
      should.exist( displayed );
      displayed.should.equal( storedWall.getId() );

      done();
    })
    .catch( done )
    .once();

    queue.publish( 'board.new', storedWall.getId() );
  });
}

features.title = 'Accessing the board creator input control';

module.exports = features;
