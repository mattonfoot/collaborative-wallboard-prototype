var chai = require('chai')
  , should = chai.should()
  , RSVP = require('rsvp')
  , Promise = RSVP.Promise;

var storedName = 'display board'
  , storedWall, storedBoard;

function features() {

  beforeEach(function(done) {
    var services = this.services;
    var queue = this.queue;

    services.createWall({ name: 'parent wall for board' })
      .then(function( wall ) {
        storedWall = wall;

        var promises = [
          services.createBoard({ wall: wall.getId(), name: 'other board' }),
          services.createBoard({ wall: wall.getId(), name: storedName })
        ];

        return RSVP.all( promises );
      })
      .then(function( boards ) {
        storedBoard = boards[ 1 ];

        done();
      })
      .catch( done );
  });

  it('Emit a <board:display> event passing a valid board id to trigger the process of rendering an existing Board\n', function(done) {
    var queue = this.queue;

    queue.subscribe( '#.fail', done );

    queue.when([
      'board:display',
      'board:displayed',
      'controls:enabled'
    ],
    function( a, b, c ) {
      should.exist( b );

      b.should.be.a.specificBoardResource( storedName, storedWall.getId() );
      b.getId().should.equal( storedBoard.getId() );

      done();
    },
    done,
    { once: true });

    queue.trigger( 'board:display', storedBoard.getId() );
  });
}

features.title = 'Selecting a Board for display';

module.exports = features;
