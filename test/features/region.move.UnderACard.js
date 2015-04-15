var chai = require('chai')
  , should = chai.should();

var storedName = 'new region'
  , storedWall, storedBoard, storedPocket, storedRegion, storedLocation;

function features() {

  beforeEach(function(done) {
    var services = this.services;
    var scenarios = this.scenarios;
    var queue = this.queue;

    var locationscount = 0, numBoards = 0, numLocations = 0;

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
        storedPocket = storage.pockets[1];
        storedRegion = storage.regions[0];
        storedLocation = storage.locations[2];

        numBoards = storage.boards.length;
        numLocations = storage.pockets.length;

        return services.displayWall( storedWall.getId() );
      })
      .then(function() {
        done();
      })
      .catch( done );
  });

  it('Emit a <region:move> event passing a data object with a valid region id and coordinates which enclose a Card on the same Board to trigger the process of moving a Region under a Card on a Board\n', function( done ) {
    var queue = this.queue;

    queue.subscribe( '#.fail', done );

    queue.when([
      'region.move',
      'region.updated',
      'pocket.regionenter',
      'pocket.updated',
      'pocket.transformed'
    ],
    function( a, b, c, d, e ) {
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

      should.exist( c );
      c.pocket.getId().should.equal( storedPocket.getId() );
      c.region.getId().should.equal( storedRegion.getId() );

      should.exist( e );
      e.getColor().should.equal( storedRegion.getColor() );

      done();
    },
    done,
    { once: true });

    storedRegion.x = 400;
    storedRegion.y = 0;

    queue.trigger( 'region:move', storedRegion );

  });
}

features.title = 'Moving a displayed Region under a Card on the displayed Board';

module.exports = features;
