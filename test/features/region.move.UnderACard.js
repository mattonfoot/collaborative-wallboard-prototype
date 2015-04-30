var chai = require('chai');
var should = chai.should();
var fixture = require('../fixtures/BasicWall.WithMultipleBoards.FirstWithTwoRegions');

var region, card;

function features() {
  beforeEach(function( done ) {
    var services = this.services;
    var queries = this.application.queries;

    var wall;
    fixture( this, 'Wall for moving a card on' )
      .then(function( storage ) {
        region = storage.region;
        card = storage.card;

        done();
      })
      .catch( done );
  });

  it('Moving a Region so that a Card comes within its bounds\n', function( done ) {
    var queue = this.queue;

    queue.subscribe( '#.fail', done ).once();

    queue.subscribe( 'card.regionentered', function( entered ) {
      should.exist( entered );

      entered.should.have.property( 'card', card.getId() );
      entered.should.have.property( 'region', move.region );

      card.getRegions().should.include( move.region );
      region.getCards().should.include( card.getId() );

      done();
    })
    .catch( done )
    .once();

    var move = {
      region: region.getId(),
      x: 5,
      y: 5
    };

    region.move( move );
  });
}

features.title = 'Moving regions under cards';

module.exports = features;
