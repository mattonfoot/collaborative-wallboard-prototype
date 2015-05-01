var chai = require('chai');
var should = chai.should();
var fixture = require('../fixtures/MultipleWalls');

var wall, walls, len;

function features() {
  beforeEach(function( done ) {
    var ui = this.ui;
    
    fixture( this, 'display wall' )
      .then(function( storage ) {
        wall = storage.wall;
        walls = storage.walls;

        len = walls.length;

        ui.reset();

        done();
      })
      .catch( done );
  });

  it('If there are several walls configured then the Wall Selector input control will display all available walls\n', function(done) {
    var queue = this.queue;
    var interface = this.interface;
    var ui = this.ui;

    queue.subscribe( '#.fail', done ).once();

    interface.displayWallSelector()
      .then(function() {
        ui.called.should.deep.equal( [ 'displayWallSelector' ] );
        ui.calledWith.should.deep.equal( [ walls ] );

        done();
      })
      .catch( done );
  });
}

features.title = 'Selecting a Wall from multiple';

module.exports = features;
