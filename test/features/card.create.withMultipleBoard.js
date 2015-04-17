var chai = require('chai')
  , should = chai.should();

var storedName = 'new card'
  , storedWall, storedBoard, storedPocket, numBoards;

function features() {

  beforeEach(function(done) {
    var scenarios = this.scenarios;
    var services = this.services;

    scenarios.multipleBoards.call( this )
      .then(function( storage ) {
        storedWall = storage.wall;
        storedBoard = storage.board;

        numBoards = storage.boards.length;

        return services.displayBoard( storedBoard.getId() );
      })
      .then(function() {
        done();
      })
      .catch( done );
  });

  it('Emit a <pocket:create> event passing a data object with a valid wall id and a title attribute to trigger the process of creating a new Card\n', function( done ) {
    var queue = this.queue;
    var locationscount = 0;

    queue.subscribe( '#:fail', done ).once();
    queue.subscribe( '#.fail', done ).once();

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
