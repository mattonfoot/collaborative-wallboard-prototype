var chai = require('chai');
var should = chai.should();
var fixture = require('../fixtures/BasicWall');

var wall;

function features() {
  beforeEach(function( done ) {
    var services = this.services;

    fixture( this, 'unedited wall' )
      .then(function( storage ) {
        wall = storage.wall;

        done();
      })
      .catch( done );
  });

  it('Emit a <wall.update> event passing an updated data object with a valid wall id trigger the process of updating the stored data for an existing wall\n', function(done) {
    var queue = this.queue;
    var services = this.services;

    queue.subscribe( '#.fail', done ).once();

    queue.subscribe( 'wall.updated', function( updated ) {
      should.exist( updated );
      updated.should.have.property( 'id' );
      updated.should.have.property( 'name' );

      updated.id.should.equal( wall.getId() );
      updated.name.should.equal( update.name );

      wall.getName().should.equal( update.name );

      done();
    })
    .catch( done )
    .once();

    var update = {
      id: wall.getId(),
      name: 'edited wall'
    };

    services.updateWall( update );
  });
}

features.title = 'Updating a wall';

module.exports = features;
