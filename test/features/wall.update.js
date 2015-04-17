var chai = require('chai');
var should = chai.should();
var fixture = require('../fixtures/BasicWall');

var storedName = 'unedited wall'
  , editedName = 'edited wall'
  , storedWall;

function features() {
  beforeEach(function( done ) {
    fixture( this, storedName )
      .then(function( storage ) {
        storedWall = storage.wall;

        done();
      })
      .catch( done );
  });

  it('Emit a <wall:update> event passing an updated data object with a valid wall id trigger the process of updating the stored data for an existing wall\n', function(done) {
    var queue = this.queue;

    queue.subscribe( '#:fail', done ).once();
    queue.subscribe( '#.fail', done ).once();

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
