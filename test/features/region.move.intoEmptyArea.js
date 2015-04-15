var chai = require('chai')
  , should = chai.should();

var storedName = 'new Region'
  , storedWall, storedBoard, storedRegion;

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
        storedRegion = storage.regions[1];

        numBoards = storage.boards.length;
        numLocations = storage.pockets.length;

        return services.displayWall( storedWall.getId() );
      })
      .then(function() {
        done();
      })
      .catch( done );
  });

  it('Emit a <region:move> event passing a data object with a valid region id and coordinates to trigger the process of moving a Region around a Board\n', function( done ) {
    var queue = this.queue;

    queue.subscribe( '#.fail', done );

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
