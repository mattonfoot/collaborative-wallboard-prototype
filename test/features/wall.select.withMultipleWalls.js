var chai = require('chai')
  , should = chai.should();

var queueChecked = false;

function features() {
  var storedWalls, len;

  beforeEach(function( done ) {
    var scenarios = this.scenarios;

    scenarios
      .multipleWalls.call( this )
      .then(function( resources ) {
        should.exist( resources );
        should.exist( resources.walls );
        resources.walls.should.be.instanceOf( Array );
        resources.walls.length.should.be.greaterThan( 1 );

        storedWalls = resources.walls;
        len = resources.walls.length;

        done();
      })
      .catch( done );
  });

  it('If there are several walls configured then the Wall Selector input control will display all available walls\n', function(done) {
    var queue = this.queue;

    queue.subscribe( '#.fail', done );

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
