var chai = require('chai')
  , should = chai.should();

function features() {

  it('Create a Wall by providing a name\n', function( done ) {
    var queue = this.queue;
    var services = this.services;

    queue.subscribe( '#.fail', done ).once();

    queue.subscribe( 'wall.created', function( created ) {
      should.exist( created );

      created.should.have.property( 'wall' );
      created.should.have.property( 'name', create.name );

      done();
    })
    .catch( done )
    .once();

    var create = {
      name: 'new wall'
    };

    services.createWall( create );
  });

}

features.title = 'Creating Walls';

module.exports = features;
