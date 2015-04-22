var chai = require('chai');
var should = chai.should();
var fixture = require('../fixtures/BasicWall.WithOneBoard');

var storedName = 'unedited board'
  , editedName = 'edited board'
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

  it('Emit a <board:update> event passing an updated data object with a valid board id trigger the process of updating the stored data for an existing Board\n', function(done) {
    var queue = this.queue;

    queue.subscribe( '#:fail', done ).once();
    queue.subscribe( '#.fail', done ).once();

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
