var chai = require('chai')
  , should = chai.should();

var storedName = 'unedited board'
  , editedName = 'edited board'
  , storedWall
  , storedBoard
  , resourceChecked = false
  , queueChecked = false;

function features() {

  beforeEach(function( done ) {
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

  it('Emit a <board:update> event passing an updated data object with a valid board id trigger the process of updating the stored data for an existing Board\n', function(done) {
    var queue = this.queue;

    queue.when([
      'board:update',
      'board:updated'
    ],
    function( a, b ) {
      should.exist( a );
      a.should.be.a.specificBoardResource( editedName, storedWall.getId() );
      a.getId().should.equal( storedBoard.getId() );

      should.exist( b );
      b.should.be.a.specificBoardResource( editedName, storedWall.getId() );
      b.getId().should.equal( storedBoard.getId() );

      done();
    },
    done,
    { once: true });

    storedBoard.name = editedName;

    queue.trigger( 'board:update', storedBoard );

  });

}

features.title = 'Updating a Board';

module.exports = features;
