var chai = require('chai');
var should = chai.should();
var fixture = require('../fixtures/MultipleWalls');

var storedName = 'display wall'
  , storedWall, storedWalls, len;

function features() {
  beforeEach(function( done ) {
    fixture( this, storedName )
      .then(function( storage ) {
        storedWall = storage.wall;
        storedWalls = storage.walls;

        len = storedWalls.length;

        done();
      })
      .catch( done );
  });

  it('If there are several walls configured then the Wall Selector input control will display all available walls\n', function(done) {
    var queue = this.queue;

    queue.subscribe( '#:fail', done ).once();
    queue.subscribe( '#.fail', done ).once();

    var subscription = queue.subscribe( 'wallselector:displayed' );
    subscription.subscribe(function( resources ) {
      should.exist( resources );
      resources.should.be.instanceOf( Array );
      resources.length.should.equal( len );

      var names = storedWalls.map(function( wall ) {
        return wall.getName();
      });

      resources.forEach(function( resource ) {
        names.should.include( resource.getName() );
      });

      queue.unsubscribe( subscription );

      done();
    })
    .catch( done );

    queue.publish( 'wall:select' );
  });
}

features.title = 'Selecting a Wall from multiple';

module.exports = features;
