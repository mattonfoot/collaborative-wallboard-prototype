var chai = require('chai');
var should = chai.should();
var fixture = require('../fixtures/BasicWall.WithMultipleBoards.FirstWithTwoRegions');

var storedName = 'display wall'
  , storedWall, storedBoard;

function features() {
  beforeEach(function( done ) {
    fixture( this, storedName )
      .then(function( storage ) {
        storedWall = storage.wall;
        storedBoard = storage.board;

        done();
      })
      .catch( done );
  });

  it('Select and display the first associated board of a Wall\n', function(done) {
    var queue = this.queue;

    queue.subscribe( '#.fail', done ).once();

    queue.when([
      'wall.displayed',
      'board.displayed',
      'controls.enabled'
    ],
    function( a, b, c ) {
      should.exist( a );
      a.should.be.a.specificWallResource( storedWall.getName() );

      should.exist( b );
      b.should.equal( storedBoard.getId() );

      done();
    },
    done,
    { once: true });

    queue.publish( 'wall.display', storedWall.getId() );

  });

}

features.title = 'Displaying a wall with multiple boards containing cards and regions';

module.exports = features;
