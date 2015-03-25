var chai = require('chai')
  , should = chai.should();

var storedWall, storedBoard;

function features() {

  beforeEach(function(done) {
    var scenarios = this.scenarios;

    scenarios.TwoBoardsOneWithRegions.call( this )
      .then(function( storage ) {
        storedWall = storage.wall;
        storedBoard = storage.boards[0];

        done();
      })
      .catch( done );
  });

  it('Select and display the first associated board of a Wall\n', function(done) {
    var queue = this.queue;

    queue.when([
      'wall:displayed',
      'boardselector:displayed',
      'board:displayed',
      'controls:enabled'
    ],
    function( a, b, c, d ) {
      should.exist( a );
      a.should.be.a.specificWallResource( storedWall.getName() );

      should.exist( b );
      b.should.be.an.instanceOf( Array );
      b.length.should.equal( 2 );

      should.exist( c );
      c.should.be.a.specificBoardResource( storedBoard.getName(), storedWall.getId() );

      done();
    },
    done,
    { once: true });

    queue.trigger( 'wall:display', storedWall.getId() );

  });

}

features.title = 'Displaying a wall with multiple boards containing cards and regions';

module.exports = features;
