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
        
        done();
      })
      .catch( done );
  });

  it('Emit a <board.update> event passing an updated data object with a valid board id trigger the process of updating the stored data for an existing Board\n', function(done) {
    var queue = this.queue;

    queue.subscribe( '#.fail', done ).once();

    queue.subscribe( 'board.updated', function( update ) {
      should.exist( update );
      update.should.be.a.specificBoardResource( editedName, storedWall.getId() );
      update.getId().should.equal( storedBoard.getId() );

      done();
    })
    .catch( done )
    .once();

    storedBoard.name = editedName;

    queue.publish( 'board.update', storedBoard );

  });

}

features.title = 'Updating a Board';

module.exports = features;
