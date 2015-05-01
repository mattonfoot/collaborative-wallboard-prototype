var chai = require('chai');
var should = chai.should();
var fixture = require('../fixtures/BasicWall.WithOneView');

var view;

function features() {
  beforeEach(function( done ) {
    var ui = this.ui;
    
    fixture( this, 'unedited view' )
      .then(function( storage ) {
        view = storage.view;

        ui.reset();

        done();
      })
      .catch( done );
  });

  it('Pass a valid view id to enter new details for a View\n', function(done) {
    var queue = this.queue;
    var interface = this.interface;
    var ui = this.ui;

    queue.subscribe( '#.fail', done ).once();

    interface.editView( view.getId() )
      .then(function() {
        ui.called.should.deep.equal( [ 'displayViewEditor' ] );
        ui.calledWith.should.deep.equal( [ view ] );

        done();
      })
      .catch( done );
  });
}

features.title = 'Editing a View';

module.exports = features;
