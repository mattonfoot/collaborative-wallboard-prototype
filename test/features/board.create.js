var chai = require('chai')
  , should = chai.should();

var storedName = 'new board'
  , storedWall;

function features() {

  beforeEach(function(done) {
    var services = this.services;

    services.createWall({ name: 'wall for board' })
      .then(function( wall ) {
          storedWall = wall;

          done();
      })
      .catch( done );
  });

  it('Emit a <board:create> event passing a data object with a valid wall id and a name attribute to trigger the process of creating a new board\n', function( done ) {
    var queue = this.queue;

    queue.subscribe( '#.fail', done );

    queue.when([
      'board:create',
      'board:created',
      'board:added',
      'board:displayed',
      'controls:enabled'
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
