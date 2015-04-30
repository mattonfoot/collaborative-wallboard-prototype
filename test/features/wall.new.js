var chai = require('chai')
  , should = chai.should();

var resourceChecked = false
  , queueChecked = false;

function features() {

  it('Request to create a New Wall\n', function(done) {
    var queue = this.queue;
    var interface = this.interface;
    var ui = this.ui;

    queue.subscribe( '#.fail', done ).once();

    interface.newWall()
      .then(function() {
        ui.called.should.deep.equal( [ 'displayWallCreator' ] );

        done();
      })
      .catch( done );
  });
}

features.title = 'Accessing the wall creator input control';

module.exports = features;
