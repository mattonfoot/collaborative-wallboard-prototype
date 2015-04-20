var chai = require('chai');
var should = chai.should();
var fixture = require('../fixtures/BasicWall');

var storedName = "display board"
  , storedWall;

function features() {
  beforeEach(function( done ) {
    fixture( this, 'Wall for board' )
      .then(function( storage ) {
        storedWall = storage.wall;

        done();
      })
      .catch( done );
  });

  it('Emit a <board:create> event passing a data object with a valid wall id and a name attribute to trigger the process of creating a new board\n', function( done ) {
    var queue = this.queue;

    queue.subscribe( '#:fail', done ).once();
    queue.subscribe( '#.fail', done ).once();

    queue.when([
      'board:create',
      'board:created',
      'board:added'
    ],
    function( a, b, c, d, e ) {
      should.exist( c );
      c.should.be.a.specificBoardResource( storedName, storedWall.getId() );

      done();
    },
    done,
    { once: true });

    queue.trigger( 'board:create', { wall: storedWall.getId(), name: storedName } );
  });
}

features.title = 'Creating a board';

module.exports = features;
