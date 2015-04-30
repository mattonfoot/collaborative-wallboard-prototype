var chai = require('chai');
var should = chai.should();
var fixture = require('../fixtures/BasicWall.WithMultipleBoards.FirstWithTwoRegions');

var region;

function features() {
  beforeEach(function( done ) {
    fixture( this, 'Wall for moving a region on' )
      .then(function( storage ) {
        region = storage.region;

        done();
      })
      .catch( done );
  });

  it('Moving a Region requires a valid region id along with new coordinates\n', function( done ) {
    var queue = this.queue;

    queue.subscribe( '#.fail', done ).once();

    queue.subscribe( 'region.moved', function( moved ) {
      should.exist( moved );

      moved.should.have.property( 'region', move.region );
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
      region: region.getId(),
      x: 600,
      y: 600
    };

    region.move( move );
  });
}

features.title = 'Moving Regions around a view';

module.exports = features;
