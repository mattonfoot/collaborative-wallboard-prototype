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
      }).then(function( resource ) {
        location = resource;

        done();
      })
      .catch( done );
  });

  it('Emit a <card.move> event passing a data object with a valid location id and coordinates within a Region on the same Board to trigger the process of moving a Card over a Region on a Board\n', function( done ) {
    var queue = this.queue;
    var services = this.services;

    queue.subscribe( '#.fail', done ).once();

    queue.subscribe( 'pocket.regionenter', function( info ) {
      should.exist( info );
      
      info.should.have.property( 'card', move.card );
      info.should.have.property( 'region', region.getId() );

      done();
    })
    .catch( done )
    .once();

    var move = {
      id: location.getId(),
      card: location.getPocket(),
      board: location.getBoard(),
      x: region.x + Math.round( ( region.width - 100 ) / 2 ),
      y: region.y + Math.round( ( region.height - 65 ) / 2 )
    };

    services.moveCard( move );
  });
}

features.title = 'Moving a displayed card over a region on the displayed board';

module.exports = features;
