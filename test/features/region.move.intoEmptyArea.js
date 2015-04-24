var chai = require('chai');
var should = chai.should();
var fixture = require('../fixtures/BasicWall.WithMultipleBoards.FirstWithTwoRegions');

var region;

function features() {
  beforeEach(function( done ) {
    var services = this.services;

    fixture( this, 'Wall for moving a region on' )
      .then(function( storage ) {
        region = storage.region;

        done();
      })
      .catch( done );
  });

  it('Emit a <region.move> event passing a data object with a valid region id and coordinates to trigger the process of moving a Region around a Board\n', function( done ) {
    var queue = this.queue;
    var services = this.services;

    queue.subscribe( '#.fail', done ).once();

    queue.subscribe( 'region.moved', function( moved ) {
      should.exist( moved );

      moved.should.have.property( 'id', move.id );
      moved.should.have.property( 'x', move.x );
      moved.should.have.property( 'y', move.y );

      var position = region.getPosition();
      position.x.should.equal( move.x );
      position.y.should.equal( move.y );

      done();
    })
    .catch( done )
    .once();

    var move = {
      id: region.getId(),
      x: 600,
      y: 600
    };

    services.moveRegion( move );
  });
}

features.title = 'Moving a displayed Region into an empty area on the displayed Board';

module.exports = features;
