var chai = require('chai')
  , should = chai.should();

var resourceChecked = false
  , queueChecked = false;

function features() {

  it('Emit a <wall:new> event - no data object is needed - to access an input control allowing you to enter details required to create a new Wall\n', function(done) {
    var queue = this.queue;

    queue.subscribe( '#.fail', done );

    queue.when([
      'wall:new',
      'wallcreator:displayed'
    ],
    function( a, b ) {
      a.should.be.instanceOf( queue.nodata );
      b.should.be.instanceOf( queue.nodata );

      done();
    },
    done,
    { once: true });

    queue.trigger( 'wall:new' );

  });

}

features.title = 'Accessing the wall creator input control';

module.exports = features;
