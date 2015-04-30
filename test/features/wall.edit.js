var chai = require('chai');
var should = chai.should();
var fixture = require('../fixtures/BasicWall');

var wall;

function features() {
  beforeEach(function( done ) {
    fixture( this, 'editable wall' )
      .then(function( storage ) {
        wall = storage.wall;

        done();
      })
      .catch( done );
  });

  it('Pass a valid wall id to enter new details for a Wall\n', function(done) {
    var queue = this.queue;
    var interface = this.interface;
    var ui = this.ui;

    queue.subscribe( '#.fail', done ).once();

    interface.editWall( wall.getId() )
      .then(function() {
        ui.called.should.deep.equal( [ 'displayWallEditor' ] );
        ui.calledWith.should.deep.equal( [ wall ] );

        done();
      })
      .catch( done );
  });
}

features.title = 'Editing a Wall';

module.exports = features;
