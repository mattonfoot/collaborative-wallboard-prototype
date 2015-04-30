var chai = require('chai');
var should = chai.should();
var fixture = require('../fixtures/BasicWall.WithMultipleBoards.FirstWithTwoRegions');

var view, card;

function features() {
  beforeEach(function( done ) {
    var services = this.services;
    var queries = this.application.queries;

    var wall;
    fixture( this, 'Wall for moving a card on' )
      .then(function( storage ) {
        view = storage.view;
        card = storage.card;

        done();
      })
      .catch( done );
  });

  it('Moving a card requires a valid card id and a valid view id along with new coordinates\n', function( done ) {
    var queue = this.queue;
    var services = this.services;

    queue.subscribe( '#.fail', done ).once();

    queue.subscribe( 'card.moved', function( moved ) {
      should.exist( moved );

      moved.should.have.property( 'card', move.card );
      moved.should.have.property( 'view', move.view );
      moved.should.have.property( 'x', move.x );
      moved.should.have.property( 'y', move.y );

      var position = card.getPosition( move.view );
      position.x.should.equal( move.x );
      position.y.should.equal( move.y );

      done();
    })
    .catch( done )
    .once();

    var move = {
      card: card.getId(),
      view: view.getId(),
      x: 600,
      y: 600
    };

    card.move( move );
  });
}

features.title = 'Moving Cards around a view';

module.exports = features;
