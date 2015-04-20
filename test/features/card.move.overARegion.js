var chai = require('chai');
var should = chai.should();
var fixture = require('../fixtures/BasicWall.WithMultipleBoards.FirstWithTwoRegions');

var storedName = 'new card'
  , storedWall, storedBoard, storedCard, storedRegion;

function features() {
  beforeEach(function( done ) {
    var services = this.services;

    fixture( this, 'Wall for displaying a board' )
      .then(function( storage ) {
        storedWall = storage.wall;
        storedBoard = storage.board;
        storedRegion = storage.region;
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

  it('Emit a <cardlocation:move> event passing a data object with a valid location id and coordinates within a Region on the same Board to trigger the process of moving a Card over a Region on a Board\n', function( done ) {
    var queue = this.queue;

    queue.subscribe( '#:fail', done ).once();
    queue.subscribe( '#.fail', done ).once();

    queue.subscribe( 'pocket:regionenter', function( info ) {
      should.exist( info );
      info.pocket.getId().should.equal( storedCard.getPocket() );
      info.region.getId().should.equal( storedRegion.getId() );

      done();
    })
    .catch( done )
    .once();

    storedCard.x = storedRegion.x + Math.round( ( storedRegion.width - 100 ) / 2 );
    storedCard.y = storedRegion.y + Math.round( ( storedRegion.height - 65 ) / 2 );

    queue.trigger( 'cardlocation:move', storedCard );
  });
}

features.title = 'Moving a displayed card over a region on the displayed board';

module.exports = features;
