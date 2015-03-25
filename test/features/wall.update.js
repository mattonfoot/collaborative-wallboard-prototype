var chai = require('chai')
  , should = chai.should();

var storedName = 'unedited wall'
  , editedName = 'edited wall'
  , storedWall;

function features() {

  beforeEach(function(done) {
    var services = this.services;

    services.createWall({ name: storedName })
      .then(function( wall ) {
        storedWall = wall;

        done();
      });
  });

  it('Emit a <wall:update> event passing an updated data object with a valid wall id trigger the process of updating the stored data for an existing wall\n', function(done) {
    var queue = this.queue;

    queue.when([
      'wall:update',
      'wall:updated'
    ],
    function( a, b ) {
      should.exist( a );
      a.should.be.a.specificWallResource( editedName );
      a.getId().should.equal( storedWall.getId() );

      should.exist( b );
      b.should.be.a.specificWallResource( editedName );
      b.getId().should.equal( storedWall.getId() );

      done();
    },
    done,
    { once: true });

    storedWall.name = editedName;

    queue.trigger( 'wall:update', storedWall );

  });

}

features.title = 'Updating a wall';

module.exports = features;
