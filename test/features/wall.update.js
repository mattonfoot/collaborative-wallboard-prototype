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

  it('Update a Wall by providing a wall id and a new name\n', function(done) {
    var queue = this.queue;
    var services = this.services;

    queue.subscribe( '#.fail', done ).once();

    queue.subscribe( 'wall.updated', function( updated ) {
      should.exist( updated );
      updated.should.have.property( 'wall', wall.getId() );
      updated.should.have.property( 'name', update.name );

      wall.getName().should.equal( update.name );

      done();
    })
    .catch( done )
    .once();

    var update = {
      wall: wall.getId(),
      name: 'edited wall'
    };

    services.updateWall( update );
  });
}

features.title = 'Updating Walls';

module.exports = features;
