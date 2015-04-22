var chai = require('chai');
var should = chai.should();
var fixture = require('../fixtures/BasicWall.WithMultipleBoards.FirstWithTwoRegions');

var storedRegion;

function features() {
  beforeEach(function( done ) {
    var services = this.services;

    fixture( this, 'Wall for moving a region on' )
      .then(function( storage ) {
        storedRegion = storage.region;

        return services.displayWall( storage.wall.getId() );
      })
      .then(function() {
        done();
      })
      .catch( done );
  });

  it('Emit a <region.move> event passing a data object with a valid region id and coordinates to trigger the process of moving a Region around a Board\n', function( done ) {
    var queue = this.queue;

    queue.subscribe( '#.fail', done ).once();

    queue.subscribe( 'region.moved', function( updated ) {
      should.exist( updated );
      updated.should.respondTo( 'getId' );
      updated.should.respondTo( 'getBoard' );
      updated.getBoard().should.equal( storedRegion.getBoard() );
      updated.should.respondTo( 'getX' );
      updated.getX().should.equal( storedRegion.x );
      updated.should.respondTo( 'getY' );
      updated.getY().should.equal( storedRegion.y );

      done();
    })
    .catch( done )
    .once();

    storedRegion.x = 600;
    storedRegion.y = 600;

    queue.publish( 'region.move', storedRegion );
  });
}

features.title = 'Moving a displayed Region into an empty area on the displayed Board';

module.exports = features;
