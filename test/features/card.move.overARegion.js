var chai = require('chai');
var should = chai.should();
var fixture = require('../fixtures/BasicWall.WithMultipleViews.FirstWithTwoRegions');

var card, region;

function features() {
  beforeEach(function( done ) {
    var wall;
    fixture( this, 'Wall for moving a card on' )
      .then(function( storage ) {
        region = storage.region;
        card = storage.card;

        done();
      })
      .catch( done );
  });

  it('Moving a card into the area of a region\n', function( done ) {
    var queue = this.queue;

    queue.subscribe( '#.fail', done ).once();

    queue.subscribe( 'card.regionentered', function( entered ) {
      should.exist( entered );

      entered.should.have.property( 'card', move.card );
      entered.should.have.property( 'region', region.getId() );

      card.getRegions().should.include( region.getId() );
      region.getCards().should.include( move.card );

      done();
    })
    .catch( done )
    .once();

    var pos = region.getPosition();
    var size = region.getSize();

    var move = {
      card: card.getId(),
      view: region.getView(),
      x: pos.x + Math.round( ( size.width - 100 ) / 2 ),
      y: pos.y + Math.round( ( size.height - 65 ) / 2 )
    };

    card.move( move );
  });
}

features.title = 'Moving Cards over regions';

module.exports = features;
