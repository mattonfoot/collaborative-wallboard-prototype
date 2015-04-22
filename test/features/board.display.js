var chai = require('chai');
var should = chai.should();
var fixture = require('../fixtures/BasicWall.WithMultipleBoards');

var storedName = 'display board'
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

  it('Emit a <board.display> event passing a valid board id to trigger the process of rendering an existing Board\n', function(done) {
    var queue = this.queue;

    queue.subscribe( '#.fail', done ).once();

    queue.when([
      'board.displayed',
      'controls.enabled'
    ],
    function( displayed, enabled ) {
      should.exist( displayed );

      displayed.should.equal( storedBoard.getId() );

      done();
    },
    done,
    { once: true });

    queue.publish( 'board.display', storedBoard.getId() );
  });
}

features.title = 'Selecting a Board for display';

module.exports = features;
