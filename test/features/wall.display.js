var chai = require('chai');
var should = chai.should();
var fixture = require('../fixtures/BasicWall');

var wall;

function features() {
  beforeEach(function( done ) {
    fixture( this, 'display wall' )
      .then(function( storage ) {
        wall = storage.wall;

        done();
      })
      .catch( done );
  });

  it('Pass a valid wall id to open the wall\n', function(done) {
    var queue = this.queue;
    var interface = this.interface;
    var ui = this.ui;

    queue.subscribe( '#.fail', done ).once();

    interface.displayWall( wall.getId() )
      .then(function() {
        ui.called.should.deep.equal( [ 'displayWall', 'displayViewSelector', 'displayViewCreator' ] );
        ui.calledWith.should.deep.equal( [ wall, wall, wall ] );

        done();
      })
      .catch( done );
  });
}

features.title = 'Displaying a wall';

module.exports = features;
