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
        
        done();
      })
      .catch( done );
  });

  it('Emit a <cardlocation.move> event passing a data object with a valid location id and coordinates within a Region on the same Board to trigger the process of moving a Card over a Region on a Board\n', function( done ) {
    var queue = this.queue;

    queue.subscribe( '#.fail', done ).once();

    queue.subscribe( 'pocket.regionenter', function( info ) {
      should.exist( info );
      info.card.should.equal( storedLocation.getPocket() );
      info.region.should.equal( storedRegion.getId() );

      done();
    })
    .catch( done )
    .once();

    var data = {
      id: storedLocation.getId(),
      x: storedRegion.x + Math.round( ( storedRegion.width - 100 ) / 2 ),
      y: storedRegion.y + Math.round( ( storedRegion.height - 65 ) / 2 )
    };

    queue.publish( 'cardlocation.move', data );
  });
}

features.title = 'Moving a displayed card over a region on the displayed board';

module.exports = features;
