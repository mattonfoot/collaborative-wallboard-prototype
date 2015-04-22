var chai = require('chai')
  , should = chai.should();

var resourceChecked = false
  , queueChecked = false;

function features() {

  it('Emit a <wall.new> event - no data object is needed - to access an input control allowing you to enter details required to create a new Wall\n', function(done) {
    var queue = this.queue;

    queue.subscribe( '#.fail', done ).once();

    queue.subscribe( 'wallcreator.displayed', function( displayed ) {
      displayed.should.be.instanceOf( queue.nodata );

      done();
    })
    .catch( done )
    .once();

    queue.publish( 'wall.new' );
  });
}

features.title = 'Accessing the wall creator input control';

module.exports = features;
