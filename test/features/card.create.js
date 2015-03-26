var chai = require('chai')
  , should = chai.should();

var storedName = 'new card'
  ,  storedWall;

function features() {

  beforeEach(function(done) {
    var services = this.services;

    services.createWall({ name: 'parent wall for board' })
      .then(function( wall ) {
        storedWall = wall;

        done();
      })
      .catch( done );
  });

  it('Emit a <pocket:create> event passing a data object with a valid wall id and a title attribute to trigger the process of creating a new Card\n', function( done ) {
    var queue = this.queue;

    queue.when([
      'pocket:create',
      'pocket:created'
    ],
    function( a, b ) {
      should.exist( a );

      should.exist( b );
      b.should.be.a.specificCardResource( storedName, storedWall.getId() );

      done();
    },
    done,
    { once: true });

    queue.trigger( 'pocket:create', { wall: storedWall.getId(), title: storedName } );

  });

}

features.title = 'Creating a Card on a Board';

module.exports = features;
