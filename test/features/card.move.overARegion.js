var chai = require('chai')
  , should = chai.should();

var storedName = 'new card'
  , storedWall, storedBoard, storedPocket, storedRegion, storedLocation;

function features() {

  beforeEach(function(done) {
    var services = this.services;
    var scenarios = this.scenarios;
    var queue = this.queue;

    var locationscount = 0;

    var subscription = queue.subscribe('cardlocation:displayed', function() {
      subscription.unsubscribe();

      done();
    })
    .constraint(function( resource, envelope ) {
      locationscount++;

      return locationscount === numLocations;
    })
    .catch( done );

    scenarios.TwoBoardsOneWithRegions.call( this )
      .then(function( storage ) {
        storedWall = storage.wall;
        storedBoard = storage.boards[1];
        storedPocket = storage.pockets[0];
        storedRegion = storage.regions[0];
        storedLocation = storage.locations[2];

        numBoards = storage.boards.length;
        numLocations = storage.pockets.length;

        return services.displayWall( storedWall.getId() );
      })
      .catch( done );
  });

  it('Emit a <cardlocation:move> event passing a data object with a valid location id and coordinates within a Region on the same Board to trigger the process of moving a Card over a Region on a Board\n', function( done ) {
    var queue = this.queue;

    queue.subscribe( '#.fail', done );

    queue.when([
      'cardlocation:move',
      'cardlocation:updated',
      'pocket:updated',
      'pocket:regionenter',
      'pocket:transformed'
    ],
    function( a, b, c, d, e ) {
      should.exist( a );
      a.should.respondTo( 'getId' );
      a.should.respondTo( 'getPocket' );
      a.getPocket().should.equal( storedPocket.getId() );

      should.exist( b );
      b.should.respondTo( 'getId' );
      b.should.respondTo( 'getPocket' );
      b.getPocket().should.equal( storedPocket.getId() );
      b.should.respondTo( 'getBoard' );
      b.getBoard().should.equal( storedBoard.getId() );
      b.should.respondTo( 'getX' );
      b.getX().should.equal( storedLocation.x );
      b.should.respondTo( 'getY' );
      b.getY().should.equal( storedLocation.y );

      should.exist( c );
      c.getId().should.equal( storedPocket.getId() );
      c.getRegions().should.contain( storedRegion.getId() );

      should.exist( d );
      d.pocket.getId().should.equal( storedPocket.getId() );
      d.region.getId().should.equal( storedRegion.getId() );

      should.exist( e );
      e.getColor().should.equal( storedRegion.getColor() );

      done();
    },
    done,
    { once: true });

    storedLocation.x = storedRegion.x + Math.round( ( storedRegion.width - 100 ) / 2 );
    storedLocation.y = storedRegion.y + Math.round( ( storedRegion.height - 65 ) / 2 );

    queue.trigger( 'cardlocation:move', storedLocation );

  });

}

features.title = 'Moving a displayed card over a region on the displayed board';

module.exports = features;
