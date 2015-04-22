var chai = require('chai');
var should = chai.should();
var fixture = require('../fixtures/BasicWall.WithOneBoard');

var storedName = 'new card'
  , storedWall;

function features() {
  beforeEach(function( done ) {
    var services = this.services;

    fixture( this, 'Wall for card' )
      .then(function( storage ) {
        storedWall = storage.wall;
        storedBoard = storage.board;

        return services.displayBoard( storedBoard.getId() );
      })
      .then(function() {
        done();
      })
      .catch( done );
  });

  it('The process of creating a card on a wall that already has one board set up will trigger the assignment of a card location to that board\n', function( done ) {
    var queue = this.queue;

    queue.subscribe( '#.fail', done ).once();

    queue.subscribe('pocket.created', function( created ) {
      should.exist( created );
      created.should.be.a.specificCardResource( storedName, storedWall.getId() );

      done();
    })
    .catch( done )
    .once();

    queue.publish( 'pocket.create', { wall: storedWall.getId(), title: storedName } );
  });
}

features.title = 'Creating a Card on a Wall that has a board already setup';

module.exports = features;
