var chai = require('chai')
  , should = chai.should();

function features() {
  var storedName = 'display wall';
  var storedWall;

  beforeEach(function(done) {
    var services = this.services;

    services.createWall({ name: storedName })
        .then(function( wall ) {
            storedWall = wall;

            done();
        })
        .catch( done );
  });

  it('Emit a <wall:select> event - no data object is needed - to access an input control allowing you to select a Wall for display\n', function(done) {
    var queue = this.queue;

    var subscription = queue.subscribe( 'wallselector:displayed' );
    subscription.subscribe(function( a ) {
      should.exist( a );
      a.should.be.instanceOf( Array );
      a.length.should.equal( 1 );

      a[0].should.be.specificWallResource( storedWall.getName() );

      queue.unsubscribe( subscription );

      done();
    });

    queue.publish( 'wall:select' );
  });

}

features.title = 'Selecting a Wall';

module.exports = features;
