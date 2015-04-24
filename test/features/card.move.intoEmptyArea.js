var chai = require('chai');
var should = chai.should();
var fixture = require('../fixtures/BasicWall.WithMultipleBoards.FirstWithTwoRegions');

var location;

function features() {
  beforeEach(function( done ) {
    var services = this.services;
    var queries = this.application.queries;

    var wall;
    fixture( this, 'Wall for moving a card on' )
      .then(function( storage ) {
        wall = storage.wall;

        return queries.getCardLocation( storage.card.getId(), storage.board.getId() );
      }).then(function( resource ) {
        location = resource;

        done();
      })
      .catch( done );
  });

  it('Emit a <card.move> event passing a data object with a valid location id and coordinates to trigger the process of moving a Card around a Board\n', function( done ) {
    var queue = this.queue;
    var services = this.services;

    queue.subscribe( '#.fail', done ).once();

    queue.subscribe( 'card.moved', function( moved ) {
      should.exist( moved );

      moved.should.have.property( 'card', move.card );
      moved.should.have.property( 'board', move.board );
      moved.should.have.property( 'x', move.x );
      moved.should.have.property( 'y', move.y );

      var position = location.getPosition();
      position.x.should.equal( move.x );
      position.y.should.equal( move.y );

      done();
    })
    .catch( done )
    .once();

    var move = {
      id: location.getId(),
      card: location.getPocket(),
      board: location.getBoard(),
      x: 600,
      y: 600
    };

    services.moveCard( move );
  });
}

features.title = 'Moving a displayed card into an empty area on the displayed board';

module.exports = features;
