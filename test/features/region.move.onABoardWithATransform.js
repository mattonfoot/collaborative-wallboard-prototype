var chai = require('chai');
var should = chai.should();
var fixture = require('../fixtures/BasicWall.WithMultipleViews.FirstWithTwoRegions');

var card, region;

function features() {
  beforeEach(function( done ) {
    fixture( this, 'Wall for moving a card on' )
      .then(function( storage ) {
        card = storage.card;
        region = storage.region;

        done();
      })
      .catch( done );
  });

  it('Transforms setup on a Board will be activated when their criteria are met\n', function( done ) {
    var queue = this.queue;

    queue.subscribe( '#.fail', done ).once();

    var pos = card.getPosition( region.getView() );

    var move = {
      region: region.getId(),
      x: pos.x - 10,
      y: pos.y - 10
    };

    queue.subscribe( 'card.transformed', function( transformed ) {
      should.exist( transformed );

      transformed.should.have.property( 'op', 'set' );
      transformed.should.have.property( 'card', card.getId() );
      transformed.should.have.property( 'property', 'color' );
      transformed.should.have.property( 'value', region.getColor() );

      done();
    })
    .catch( done )
    .once();

    region.move( move );

  });
}

features.title = 'Moving Regions under a Card when a transform is set on a view';

module.exports = features;
