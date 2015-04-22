var chai = require('chai');
var should = chai.should();
var fixture = require('../fixtures/BasicWall.WithOneBoard');

var storedName = 'unedited board'
  , storedWall, storedBoard;

function features() {
  beforeEach(function( done ) {
    var services = this.services;

    fixture( this, storedName )
      .then(function( storage ) {
        storedWall = storage.wall;
        storedBoard = storage.board;

        return services.displayBoard( storedBoard.getId() );
      })
      .then(function() {
        done();
      })
      .catch( done );
  });

  it('Emit a <board.edit> event with a valid board id to access an input control allowing you to enter new details for a Board\n', function(done) {
    var queue = this.queue;

    queue.subscribe( '#.fail', done ).once();

    queue.subscribe('boardeditor.displayed', function( board ) {
      should.exist( board );
      board.should.be.a.specificBoardResource( storedName, storedWall.getId() );

      done();
    })
    .catch( done )
    .once();

    queue.publish( 'board.edit', storedBoard.getId() );
  });
}

features.title = 'Accessing the board editor input control';

module.exports = features;
