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

  it('Emit a <wall:select> event - no data object is needed - to access an input control allowing you to select a Wall for display\n', function(done) {
    var queue = this.queue;

    queue.subscribe( '#:fail', done ).once();
    queue.subscribe( '#.fail', done ).once();

    var subscription = queue.subscribe( 'wallselector:displayed' );
    subscription.subscribe(function( a ) {
      should.exist( a );
      a.should.be.instanceOf( Array );
      a.length.should.equal( 1 );

      a[0].should.be.specificWallResource( storedWall.getName() );

      queue.unsubscribe( subscription );

      done();
    })
    .catch( done );

    queue.publish( 'wall:select' );
  });
}

features.title = 'Selecting a Wall';

module.exports = features;
