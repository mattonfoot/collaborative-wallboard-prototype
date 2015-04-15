var chai = require('chai')
  , should = chai.should();

var storedName = 'unedited board'
  , storedWall, storedBoard;



function features() {

  beforeEach(function(done) {
    var services = this.services;
    var queue = this.queue;

    services.createWall({ name: 'parent wall for board' })
      .then(function( wall ) {
        storedWall = wall;

        return services.createBoard({ wall: wall.getId(), name: storedName });
      })
      .then(function( board ) {
        storedBoard = board;

        done();
      })
      .catch( done );
  });

  it('Emit a <board:edit> event with a valid board id to access an input control allowing you to enter new details for a Board\n', function(done) {
    var queue = this.queue;

    queue.subscribe( '#.fail', done );

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
