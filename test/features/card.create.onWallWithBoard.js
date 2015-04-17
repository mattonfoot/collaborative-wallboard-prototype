var chai = require('chai');
var should = chai.should();
var fixture = require('../fixtures/BasicWall.WithOneBoard');

var storedName = 'new card'
  , storedWall;

function features() {
  beforeEach(function( done ) {
    fixture( this, 'Wall for board' )
      .then(function( storage ) {
        storedWall = storage.wall;
      })
      .then(function( board ) {
        done();
      })
      .catch( done );
  });

  it('The process of creating a card on a wall that already has one board set up will trigger the assignment of a card location to that board\n', function( done ) {
    var queue = this.queue;

    queue.subscribe( '#:fail', done ).once();
    queue.subscribe( '#.fail', done ).once();

    queue.when([
      'pocket:create',
      'pocket:created'
    ],
    function( a, b ) {
      should.exist( a );

      should.exist( b );
      b.should.be.a.specificCardResource( storedName, storedWall.getId() );

      done();
    },
    done,
    { once: true });

    queue.trigger( 'pocket:create', { wall: storedWall.getId(), title: storedName } );
  });
}

features.title = 'Creating a Card on a Wall that has a board already setup';

module.exports = features;
