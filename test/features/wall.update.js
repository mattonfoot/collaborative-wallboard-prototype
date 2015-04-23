var chai = require('chai');
var should = chai.should();
var fixture = require('../fixtures/BasicWall');

var storedName = 'unedited wall'
  , editedName = 'edited wall'
  , storedWall;

function features() {
  beforeEach(function( done ) {
    var services = this.services;

    fixture( this, storedName )
      .then(function( storage ) {
        storedWall = storage.wall;
        
        done();
      })
      .catch( done );
  });

  it('Emit a <wall.update> event passing an updated data object with a valid wall id trigger the process of updating the stored data for an existing wall\n', function(done) {
    var queue = this.queue;

    queue.subscribe( '#.fail', done ).once();

    queue.subscribe( 'wall.updated', function( updated ) {
      should.exist( updated );
      updated.should.be.a.specificWallResource( editedName );
      updated.getId().should.equal( storedWall.getId() );

      done();
    })
    .catch( done )
    .once();

    storedWall.name = editedName;

    queue.publish( 'wall.update', storedWall );
  });
}

features.title = 'Updating a wall';

module.exports = features;
