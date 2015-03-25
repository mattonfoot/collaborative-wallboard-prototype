var chai = require('chai')
  , should = chai.should();

var storedName = 'display wall', storedWall;

function features() {

  beforeEach(function(done) {
    var services = this.services;

    services.createWall({ name: storedName })
      .then(function( wall ) {
        storedWall = wall;
        
        done();
      })
      .catch( done );
  });

  it('Emit a <wall:edit> event with a valid wall id to access an input control allowing you to enter new details for a Wall\n', function(done) {
    var queue = this.queue;

    queue.when([
      'wall:edit',
      'walleditor:displayed'
    ],
    function( a, b ) {
      should.exist( a );
      a.should.equal( storedWall.getId() );

      should.exist( b );
      b.should.be.a.specificWallResource( storedName );

      done();
    },
    done,
    { once: true });

    queue.trigger( 'wall:edit', storedWall.getId() );

  });

}

features.title = 'Accessing the wall editor input control';

module.exports = features;
