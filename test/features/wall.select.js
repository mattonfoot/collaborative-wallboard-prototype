var chai = require('chai');
var should = chai.should();
var fixture = require('../fixtures/BasicWall');

var wall;

function features() {
  beforeEach(function( done ) {
    var ui = this.ui;
    
    fixture( this, 'display wall' )
      .then(function( storage ) {
        wall = storage.wall;

        ui.reset();

        done();
      })
      .catch( done );
  });

  it('Access a selection of Walls for display\n', function( done ) {
    var queue = this.queue;
    var interface = this.interface;
    var ui = this.ui;

    queue.subscribe( '#.fail', done ).once();

    interface.displayWallSelector()
      .then(function() {
        ui.called.should.deep.equal( [ 'displayWallSelector' ] );
        ui.calledWith.should.deep.equal( [ [ wall ] ] );

        done();
      })
      .catch( done );
  });
}

features.title = 'Selecting a Wall';

module.exports = features;
