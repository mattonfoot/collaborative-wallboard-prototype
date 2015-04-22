var chai = require('chai');
var should = chai.should();
var fixture = require('../fixtures/BasicWall.WithMultipleBoards.FirstWithTwoRegions');

var storedLocation, storedRegion;

function features() {
  beforeEach(function( done ) {
    var services = this.services;
    var queries = this.application.queries;

    var wall;
    fixture( this, 'Wall for moving a card on' )
      .then(function( storage ) {
        wall = storage.wall;
        storedRegion = storage.region;

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

  it('Emit a <region:move> event passing a data object with a valid region id and coordinates which enclose a Card on the same Board to trigger the process of moving a Region under a Card on a Board\n', function( done ) {
    var queue = this.queue;

    queue.subscribe( '#:fail', done ).once();
    queue.subscribe( '#.fail', done ).once();

    queue.subscribe( 'pocket:regionenter', function( info ) {
      should.exist( info );
      info.card.should.equal( storedLocation.getPocket() );
      info.region.should.equal( storedRegion.getId() );

      done();
    })
    .catch( done )
    .once();

    storedRegion.x = 0;
    storedRegion.y = 0;

    queue.publish( 'region:move', storedRegion );

  });
}

features.title = 'Moving a displayed Region under a Card on the displayed Board';

module.exports = features;
