var chai = require('chai');
var should = chai.should();
var fixture = require('../fixtures/BasicWall.WithOneBoard');

var wallid, board;

function features() {
  beforeEach(function( done ) {
    var services = this.services;

    fixture( this, 'unedited board' )
      .then(function( storage ) {
        wallid = storage.wall.getId();
        board = storage.board;

        done();
      })
      .catch( done );
  });

  it('Emit a <board.update> event passing an updated data object with a valid board id trigger the process of updating the stored data for an existing Board\n', function(done) {
    var queue = this.queue;
    var services = this.services;

    queue.subscribe( '#.fail', done ).once();

    queue.subscribe( 'board.updated', function( updated ) {
      should.exist( updated );
      updated.should.have.property( 'id' );
      updated.should.have.property( 'name' );

      updated.id.should.equal( board.getId() );
      updated.name.should.equal( update.name );

      board.getName().should.equal( update.name );

      done();
    })
    .catch( done )
    .once();

    var update = {
      id: board.getId(),
      name: 'edited board'
    };

    services.updateBoard( update );
  });

}

features.title = 'Updating a Board';

module.exports = features;
