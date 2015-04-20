var chai = require('chai');
var should = chai.should();
var fixture = require('../fixtures/BasicWall.WithMultipleBoards.FirstWithTwoRegions');

var storedName = 'new card'
  , storedWall, storedBoard, storedCard;

function features() {
  beforeEach(function( done ) {
    var services = this.services;

    fixture( this, 'Wall for displaying a board' )
      .then(function( storage ) {
        storedWall = storage.wall;
        storedBoard = storage.board;
        storedCard = storage.card[0];

        numCards = storage.cards.length;
        numRegions = storage.regions.length;

        return services.displayWall( storedWall.getId() );
      })
      .then(function() {
        done();
      })
      .catch( done );
  });

  it('Emit a <cardlocation:move> event passing a data object with a valid location id and coordinates to trigger the process of moving a Card around a Board\n', function( done ) {
    var queue = this.queue;

    queue.subscribe( '#:fail', done ).once();
    queue.subscribe( '#.fail', done ).once();

    queue.when([
        'cardlocation:move'
      , 'cardlocation:updated'
    ],
    function( a, b ) {
      should.exist( a );
      a.should.respondTo( 'getId' );
      a.should.respondTo( 'getPocket' );
      a.getPocket().should.equal( storedCard.getPocket() );

      should.exist( b );
      b.should.respondTo( 'getId' );
      b.should.respondTo( 'getPocket' );
      b.getPocket().should.equal( storedCard.getPocket() );
      b.should.respondTo( 'getBoard' );
      b.getBoard().should.equal( storedBoard.getId() );
      b.should.respondTo( 'getX' );
      b.getX().should.equal( storedCard.x );
      b.should.respondTo( 'getY' );
      b.getY().should.equal( storedCard.y );

      done();
    },
    done,
    { once: true });

    storedCard.x = 600;
    storedCard.y = 600;

    queue.trigger( 'cardlocation:move', storedCard );

  });

}

features.title = 'Moving a displayed card into an empty area on the displayed board';

module.exports = features;
