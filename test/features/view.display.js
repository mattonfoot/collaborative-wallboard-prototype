var chai = require('chai');
var should = chai.should();
var fixture = require('../fixtures/BasicWall.WithMultipleBoards');

var wall, view;

function features() {
  beforeEach(function( done ) {
    var interface = this.interface;
    var ui = this.ui;

    fixture( this, 'display view' )
      .then(function( storage ) {
        wall = storage.wall;
        view = storage.view;

        return interface.displayWall( wall.getId() );
      })
      .then(function() {
        ui.reset();

        done();
      })
      .catch( done );
  });

  it('Pass a valid view id to view a Wall in a specific way\n', function(done) {
    var queue = this.queue;
    var interface = this.interface;
    var ui = this.ui;

    queue.subscribe( '#.fail', done ).once();

    interface.displayView( view.getId() )
      .then(function() {
        ui.called.should.deep.equal( [ 'displayView' ] );
        ui.calledWith.should.deep.equal( [ view ] );

        done();
      })
      .catch( done );
  });
}

features.title = 'Selecting a View for display';

module.exports = features;
