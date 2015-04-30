var chai = require('chai');
var should = chai.should();
var fixture = require('../fixtures/BasicWall.WithMultipleBoards.FirstWithTwoRegions');

var wall, view, card, region, origin;

function features() {
  beforeEach(function( done ) {
    fixture( this, 'Wall for moving a card on' )
      .then(function( storage ) {
        wall = storage.wall;
        view = storage.view;
        card = storage.card;
        region = storage.region;

        done();
      })
      .catch( done );
  });

  it('Transforms setup on a Board will be activated when their criteria are met\n', function( done ) {
    var queue = this.queue;

    queue.subscribe( '#.fail', done ).once();

    queue.subscribe( 'card.transformed', function( transformed ) {
      should.exist( transformed );

      transformed.should.have.property( 'op', 'set' );
      transformed.should.have.property( 'card', move.card );
      transformed.should.have.property( 'property', 'color' );
      transformed.should.have.property( 'value', region.getColor() );

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

features.title = 'Moving Regions under crds when a transform is set on a view';

module.exports = features;
