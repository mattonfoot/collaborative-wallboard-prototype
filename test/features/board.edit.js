var chai = require('chai');
var should = chai.should();
var fixture = require('../fixtures/BasicWall.WithOneBoard');

var storedName = 'unedited board'
  , storedWall, storedBoard;

function features() {
  beforeEach(function( done ) {
    fixture( this, storedName )
      .then(function( storage ) {
        storedWall = storage.wall;
        storedBoard = storage.board;
      })
      .then(function( board ) {
        done();
      })
      .catch( done );
  });

  it('Emit a <board:edit> event with a valid board id to access an input control allowing you to enter new details for a Board\n', function(done) {
    var queue = this.queue;

    queue.subscribe( '#:fail', done ).once();
    queue.subscribe( '#.fail', done ).once();

    queue.when([
      'board:edit',
      'boardeditor:displayed'
    ],
    function( a, b ) {
      should.exist( a );
      a.should.equal( storedBoard.getId() );

      should.exist( b );
      b.should.be.a.specificBoardResource( storedName, storedWall.getId() );

      done();
    },
    done,
    { once: true });

    queue.trigger( 'board:edit', storedBoard.getId() );
  });
}

features.title = 'Accessing the board editor input control';

module.exports = features;
