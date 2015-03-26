var chai = require('chai')
  , should = chai.should();

var storedName = 'new card'
  , storedWall, storedBoard, storedPocket, numBoards;

function features() {

  beforeEach(function(done) {
    var scenarios = this.scenarios;

    scenarios.TwoBoardsOneWithRegions.call( this )
      .then(function( storage ) {
        storedWall = storage.wall;
        storedBoard = storage.boards[0];

        numBoards = storage.boards.length;

        done();
      })
      .catch( done );
  });

  it('Emit a <pocket:create> event passing a data object with a valid wall id and a title attribute to trigger the process of creating a new Card\n', function( done ) {
    var queue = this.queue;
    var locationscount = 0;

    var locationSubscription = queue.subscribe( 'cardlocation:created', function( resource ) {
      should.exist( resource );

      resource.should.respondTo( 'getId' );
      resource.should.respondTo( 'getPocket' );
      resource.should.respondTo( 'getBoard' );
      resource.getPocket().should.equal( storedPocket.getId() );

      locationscount++;

      if ( locationscount === numBoards ) {
        locationSubscription.unsubscribe();

        done();
      }
    })
    .catch( done )
    .distinct();

    queue.when([
      'pocket:create',
      'pocket:created'
    ],
    function( a, b ) {
      should.exist( a );

      should.exist( b );
      b.should.be.a.specificCardResource( storedName, storedWall.getId() );

      storedPocket = b;
    },
    done,
    { once: true });

    queue.trigger( 'pocket:create', { wall: storedWall.getId(), title: storedName } );

  });

}

features.title = 'Creating a Card on a wall with multiple Boards';

module.exports = features;
