var chai = require('chai');
var should = chai.should();
var fixture = require('../fixtures/BasicWall.WithMultipleBoards.FirstWithTwoRegions');

var storedName = 'new card'
  , storedWall, storedBoard, storedRegion;

function features() {
  beforeEach(function( done ) {
    var services = this.services;

    fixture( this, 'Wall for displaying a board' )
      .then(function( storage ) {
        storedWall = storage.wall;
        storedBoard = storage.board;
        storedRegion = storage.region;

        numCards = storage.cards.length;
        numRegions = storage.regions.length;

        return services.displayWall( storedWall.getId() );
      })
      .then(function() {
        done();
      })
      .catch( done );
  });

  it('Emit a <region:move> event passing a data object with a valid region id and coordinates to trigger the process of moving a Region around a Board\n', function( done ) {
    var queue = this.queue;

    queue.subscribe( '#:fail', done ).once();
    queue.subscribe( '#.fail', done ).once();

    queue.when([
        'region:move'
      , 'region:updated'
    ],
    function( a, b ) {
      should.exist( a );
      a.should.respondTo( 'getId' );
      a.should.respondTo( 'getBoard' );
      a.getBoard().should.equal( storedBoard.getId() );

      should.exist( b );
      b.should.respondTo( 'getId' );
      b.should.respondTo( 'getBoard' );
      b.getBoard().should.equal( storedBoard.getId() );
      b.should.respondTo( 'getX' );
      b.getX().should.equal( storedRegion.x );
      b.should.respondTo( 'getY' );
      b.getY().should.equal( storedRegion.y );

      done();
    },
    done,
    { once: true });

    storedRegion.x = 600;
    storedRegion.y = 600;

    queue.trigger( 'region:move', storedRegion );
  });
}

features.title = 'Moving a displayed Region into an empty area on the displayed Board';

module.exports = features;
