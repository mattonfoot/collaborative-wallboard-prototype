var chai = require('chai');
var should = chai.should();
var fixture = require('../fixtures/BasicWall.WithMultipleBoards');

var storedName = 'new card'
  , storedWall, storedBoard, storedPocket, len;

function features() {
  beforeEach(function( done ) {
    var services = this.services;

    fixture( this, 'Wall for card' )
      .then(function( storage ) {
        storedWall = storage.wall;
        storedBoard = storage.board;

        len = storage.boards.length;

        return services.displayBoard( storedBoard.getId() );
      })
      .then(function() {
        done();
      })
      .catch( done );
  });

  it('Emit a <pocket.create> event passing a data object with a valid wall id and a title attribute to trigger the process of creating a new Card\n', function( done ) {
    var queue = this.queue;
    var locationscount = 0;

    queue.subscribe( '#.fail', done ).once();

    var locationSubscription = queue.subscribe( 'cardlocation.created', function( resource ) {
      should.exist( resource );

      resource.should.respondTo( 'getId' );
      resource.should.respondTo( 'getPocket' );
      resource.should.respondTo( 'getBoard' );
      resource.getPocket().should.equal( storedPocket.getId() );

      locationscount++;

      if ( locationscount === len ) {
        locationSubscription.unsubscribe();

        done();
      }
    })
    .catch( done )
    .distinct();

    queue.subscribe( 'pocket.created', function( created ) {
      should.exist( created );
      created.should.be.a.specificCardResource( storedName, storedWall.getId() );

      storedPocket = created;
    })
    .catch( done )
    .once();

    queue.publish( 'pocket.create', { wall: storedWall.getId(), title: storedName } );
  });
}

features.title = 'Creating a Card on a wall with multiple Boards';

module.exports = features;
