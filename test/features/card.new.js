var chai = require('chai')
  , should = chai.should();

var storedWall;

function features() {

  beforeEach(function(done) {
    var services = this.services;

    services.createWall({ name: 'parent wall for board' })
      .then(function( wall ) {
        storedWall = wall;

        return services.createBoard({ wall: wall.getId(), name: 'board for card' });
      })
      .then(function( board ) {

        done();
      })
      .catch( done );
  });

  it('Emit a <pocket:new> event passing a valid board id to access an input control allowing you to enter details required to create a new Card\n', function(done) {
    var queue = this.queue;

    queue.when([
      'pocket:new',
      'pocketcreator:displayed'
    ],
    function( a, b ) {
      should.exist( a );
      a.should.equal( storedWall.getId() );

      b.should.be.instanceOf( queue.nodata );

      done();
    },
    done,
    { once: true });

    queue.trigger( 'pocket:new', storedWall.getId() );
  });

}

features.title = 'Accessing the card creator input control';

module.exports = features;
