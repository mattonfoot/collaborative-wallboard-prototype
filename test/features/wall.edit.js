var chai = require('chai');
var should = chai.should();
var fixture = require('../fixtures/BasicWall');

var storedName = 'display wall'
  , storedWall;

function features() {
  beforeEach(function( done ) {
    var services = this.services;

    fixture( this, storedName )
      .then(function( storage ) {
        storedWall = storage.wall;

        return services.displayWall( storedWall.getId() );
      })
      .then(function() {
        done();
      })
      .catch( done );
  });

  it('Emit a <wall.edit> event with a valid wall id to access an input control allowing you to enter new details for a Wall\n', function(done) {
    var queue = this.queue;

    queue.subscribe( '#.fail', done ).once();

    queue.subscribe( 'walleditor.displayed', function( displayed ) {
      should.exist( displayed );
      displayed.should.be.a.specificWallResource( storedName );

      done();
    })
    .catch( done )
    .once();

    queue.publish( 'wall.edit', storedWall.getId() );
  });
}

features.title = 'Accessing the wall editor input control';

module.exports = features;
