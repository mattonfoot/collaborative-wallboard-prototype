var chai = require('chai');
var should = chai.should();
var fixture = require('../fixtures/BasicWall.WithOneView');

var view;

function features() {
  beforeEach(function( done ) {
    fixture( this, 'unedited view' )
      .then(function( storage ) {
        view = storage.view;
        
        done();
      })
      .catch( done );
  });

  it('Update a View by passing an existing view id and a new name\n', function(done) {
    var queue = this.queue;
    var interface = this.interface;

    queue.subscribe( '#.fail', done ).once();

    queue.subscribe( 'view.updated', function( updated ) {
      should.exist( updated );
      updated.should.have.property( 'view', view.getId() );
      updated.should.have.property( 'name', update.name );

      view.getName().should.equal( update.name );

      done();
    })
    .catch( done )
    .once();

    var update = {
      view: view.getId(),
      name: 'edited view'
    };

    interface.updateView( update );
  });

}

features.title = 'Updating Views';

module.exports = features;
