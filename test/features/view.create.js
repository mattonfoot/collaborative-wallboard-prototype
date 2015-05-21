var chai = require('chai');
var should = chai.should();
var fixture = require('../fixtures/BasicWall');

var wall;

function features() {
  beforeEach(function( done ) {
    fixture( this, 'Wall for view' )
      .then(function( storage ) {
        wall = storage.wall;

        done();
      })
      .catch( done );
  });

  it('Create a new View on a Wall with a wall id and a name\n', function( done ) {
    var queue = this.queue;
    var interface = this.interface;
    var repository = this.application.repository;

    queue.subscribe( '#.fail', done ).once();

    var createdWasFired = false;
    queue.subscribe('view.created', function( created ) {
      should.exist( created );

      created.should.have.property( 'view' );
      created.should.have.property( 'wall', create.wall );
      created.should.have.property( 'name', create.name );

      wall.getViews().should.include( created.view );

      done();
    })
    .catch( done )
    .once();

    var create = {
      wall: wall.getId(),
      name: 'new view'
    };

    interface.createView( create );
  });
}

features.title = 'Creating Views';

module.exports = features;
