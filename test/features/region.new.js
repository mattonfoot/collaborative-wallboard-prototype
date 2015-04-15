var chai = require('chai')
  , should = chai.should();

var storedWall;

function features() {

  beforeEach(function(done) {
    var services = this.services;

    services.createWall({ name: 'parent wall for board' })
      .then(function( wall ) {
        storedWall = wall;

        return services.createBoard({ wall: wall.getId(), name: 'board for region' });
      })
      .then(function( board ) {

        done();
      })
      .catch( done );
  });

  it('Emit a <region:new> event passing a valid board id to access an input control allowing you to enter details required to create a new Region\n', function(done) {
    var queue = this.queue;

    queue.subscribe( '#.fail', done );

    queue.when([
      'region:new',
      'regioncreator:displayed'
    ],
    function( a, b ) {
      should.exist( a );
      a.should.equal( storedWall.getId() );

      b.should.be.instanceOf( queue.nodata );

      done();
    },
    done,
    { once: true });

    queue.trigger( 'region:new', storedWall.getId() );
  });

}

features.title = 'Accessing the region creator input control';

module.exports = features;
