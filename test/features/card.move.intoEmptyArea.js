var chai = require('chai')
  , should = chai.should();

var storedName = 'new card'
  , storedWall, storedBoard, storedPocket, storedLocation;

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
        storedBoard = storage.boards[0];
        storedPocket = storage.pockets[0];
        storedLocation = storage.locations[0];

        numBoards = storage.boards.length;
        numLocations = storage.pockets.length;

        return services.displayWall( storedWall.getId() );
      })
      .catch( done );
  });

  it('Emit a <cardlocation:move> event passing a data object with a valid location id and coordinates to trigger the process of moving a Card around a Board\n', function( done ) {
    var queue = this.queue;

    queue.subscribe( '#.fail', done );

    queue.when([
        'cardlocation:move'
      , 'cardlocation:updated'
    ],
    function( a, b ) {
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

      done();
    },
    done,
    { once: true });

    storedLocation.x = 600;
    storedLocation.y = 600;

    queue.trigger( 'cardlocation:move', storedLocation );

  });

}

features.title = 'Moving a displayed card into an empty area on the displayed board';

module.exports = features;
