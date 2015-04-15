var chai = require('chai')
  , should = chai.should();

var storedName = 'new region'
  ,  storedWall, storedBoard;

function features() {

  beforeEach(function(done) {
    var services = this.services;

    services.createWall({ name: 'parent wall for board' })
      .then(function( wall ) {
        storedWall = wall;

        return services.createBoard({ wall: wall.getId(), name: 'board for region' });
      })
      .then(function( board ) {
        storedBoard = board;

        done();
      })
      .catch( done );
  });

  it('Emit a <region:create> event passing a data object with a valid board id and a label attribute to trigger the process of creating a new Region\n', function( done ) {
    var queue = this.queue;

    queue.subscribe( '#.fail', done );

    queue.when([
      'region:create',
      'region:created'
    ],
    function( a, b ) {
      should.exist( a );

      should.exist( b );
      b.should.be.a.specificRegionResource( storedName, storedBoard.getId() );

      done();
    },
    done,
    { once: true });

    queue.trigger( 'region:create', { board: storedBoard.getId(), label: storedName } );

  });

}

features.title = 'Creating a Region on a Board';

module.exports = features;
