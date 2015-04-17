var chai = require('chai')
  , should = chai.should();

var storedName
  , storedWall
  , storedBoard, storedPocket, storedRegion, storedLocation;

function features() {

  beforeEach(function(done) {
    var scenarios = this.scenarios;

    scenarios.colorChangingBoard.call( this )
      .then(function( storage ) {
        storedWall = storage.wall;
        storedBoard = storage.boards[0];
        storedPocket = storage.pockets[0];
        storedRegion = storage.regions[0];
        storedLocation = storage.locations[0];

        should.not.exist( storedPocket.getColor() )
        should.exist( storedRegion.getColor() );

        done();
      })
      .catch( done );
  });

  it('Transforms setup on a Board will be activated when their criteria are met\n', function( done ) {
    var queue = this.queue;
    var checkRegionEnter = false;

    queue.subscribe( '#:fail', done ).once();
    queue.subscribe( '#.fail', done ).once();

    queue.subscribe( 'pocket:regionenter', function( data ) {
      var card = data.pocket;
      var regionEntered = data.region;

      should.exist( card );
      card.should.be.a.specificCardResource( storedPocket.getTitle(), storedWall.getId() );

      should.exist( regionEntered );
      regionEntered.should.be.a.specificRegionResource( storedRegion.getLabel(), storedBoard.getId() );

      card.getColor().should.not.contain( regionEntered.getColor() );

      checkRegionEnter = true;
    })
    .once()
    .catch( done );

    queue.when([
      "pocket.regionenter",
      "pocket.transformed"
    ],
    function( a, TransformedCard ) {
      checkRegionEnter.should.be.true;

      should.exist( TransformedCard );
      TransformedCard.should.be.a.specificCardResource( storedPocket.getTitle(), storedWall.getId() );
      TransformedCard.getColor().should.contain( storedRegion.getColor() );

      done();
    },
    done,
    { once: true });

    storedLocation.x = storedRegion.x + Math.round( ( storedRegion.width - 100 ) / 2 );
    storedLocation.y = storedRegion.y + Math.round( ( storedRegion.height - 65 ) / 2 );

    queue.trigger( 'cardlocation:move', storedLocation );
  });

}

features.title = 'Activating a Transform defined for a board';

module.exports = features;
