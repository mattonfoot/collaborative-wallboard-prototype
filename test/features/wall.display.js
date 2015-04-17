var chai = require('chai');
var should = chai.should();
var fixture = require('../fixtures/BasicWall');

var storedName = 'display wall'
  , storedWall;

function features() {
  beforeEach(function( done ) {
    fixture( this, storedName )
      .then(function( storage ) {
        storedWall = storage.wall;

        done();
      })
      .catch( done );
  });

  it('Emit a <wall:display> event with a valid wall id to open the wall\n', function(done) {
    var queue = this.queue;

    queue.subscribe( '#:fail', done ).once();
    queue.subscribe( '#.fail', done ).once();

    queue.when([
      'wall:displayed',
      'wall:firsttime',
      'boardcreator:displayed'
    ],
    function( a, b, c ) {
      should.exist( a );
      a.should.be.a.specificWallResource( storedName );

      should.exist( b );
      b.should.be.a.specificWallResource( storedName );

      done();
    },
    done,
    { once: true });

    queue.publish( 'wall:display', storedWall.getId() );
  });
}

features.title = 'Displaying a wall';

module.exports = features;
