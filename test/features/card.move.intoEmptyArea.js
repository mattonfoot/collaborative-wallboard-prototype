var chai = require('chai');
var should = chai.should();
var fixture = require('../fixtures/BasicWall.WithMultipleBoards.FirstWithTwoRegions');

var storedLocation;

function features() {
  beforeEach(function( done ) {
    var services = this.services;
    var queries = this.application.queries;

    var wall;
    fixture( this, 'Wall for moving a card on' )
      .then(function( storage ) {
        wall = storage.wall;

        return queries.getCardLocation( storage.card.getCardLocations()[0] );
      }).then(function( location ) {
        storedLocation = location;

        return services.displayWall( wall.getId() );
      })
      .then(function() {
        done();
      })
      .catch( done );
  });

  it('Emit a <cardlocation.move> event passing a data object with a valid location id and coordinates to trigger the process of moving a Card around a Board\n', function( done ) {
    var queue = this.queue;

    queue.subscribe( '#.fail', done ).once();

    queue.subscribe( 'cardlocation.moved', function( moved ) {
      should.exist( moved );
      moved.card.should.equal( storedLocation.getPocket() );
      moved.board.should.equal( storedLocation.getBoard() );
      moved.x.should.equal( data.x );
      moved.y.should.equal( data.y );

      done();
    })
    .catch( done )
    .once();

    var data = {
      id: storedLocation.getId(),
      card: storedLocation.getPocket(),
      board: storedLocation.getBoard(),
      x: 600,
      y: 600
    };

    queue.publish( 'cardlocation.move', data );

  });

}

features.title = 'Moving a displayed card into an empty area on the displayed board';

module.exports = features;
