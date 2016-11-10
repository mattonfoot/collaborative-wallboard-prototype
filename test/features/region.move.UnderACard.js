var chai = require('chai');
var should = chai.should();
var fixture = require('../fixtures/BasicWall.WithMultipleViews.FirstWithTwoRegions');

var region, card;

function features() {
  beforeEach(function( done ) {
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

    var pos = card.getPosition( region.getView() );

    var move = {
      region: region.getId(),
      x: pos.x - 10,
      y: pos.y - 10
    };

    queue.subscribe( 'card.regionentered', function( entered ) {
      should.exist( entered );

      entered.should.have.property( 'card', card.getId() );
      entered.should.have.property( 'region', move.region );

      region.getCards().should.include( card.getId() );
      card.getRegions().should.include( move.region );

      done();
    })
    .catch( done )
    .once();

    region.move( move );
  });
}

features.title = 'Moving regions under cards';

module.exports = features;
