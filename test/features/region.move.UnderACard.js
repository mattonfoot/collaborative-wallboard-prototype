var chai = require('chai');
var should = chai.should();
var fixture = require('../fixtures/BasicWall.WithMultipleBoards.FirstWithTwoRegions');

var location, region;

function features() {
  beforeEach(function( done ) {
    var services = this.services;
    var queries = this.application.queries;

    var wall;
    fixture( this, 'Wall for moving a card on' )
      .then(function( storage ) {
        wall = storage.wall;
        region = storage.region;

        return queries.getCardLocation( storage.card.getId(), storage.board.getId() );
      })
      .then(function( resource ) {
        location = resource;

        done();
      })
      .catch( done );
  });

  it('Emit a <region.move> event passing a data object with a valid region id and coordinates which enclose a Card on the same Board to trigger the process of moving a Region under a Card on a Board\n', function( done ) {
    var queue = this.queue;
    var services = this.services;

    queue.subscribe( '#.fail', done ).once();

    queue.subscribe( 'pocket.regionenter', function( info ) {
      should.exist( info );

      info.should.have.property( 'card', location.getPocket() );
      info.should.have.property( 'region', move.id );

      done();
    })
    .catch( done )
    .once();

    var move = {
      id: region.getId(),
      x: 5,
      y: 5
    };

    services.moveRegion( move );

  });
}

features.title = 'Moving a displayed Region under a Card on the displayed Board';

module.exports = features;
