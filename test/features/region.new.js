var chai = require('chai');
var should = chai.should();
var fixture = require('../fixtures/BasicWall.WithOneView');

var view;

function features() {
  beforeEach(function( done ) {
    var ui = this.ui;
    
    fixture( this, 'Wall for region' )
      .then(function( storage ) {
        view = storage.view;

        ui.reset();

        done();
      })
      .catch( done );
  });

  it('Emit a <region.new> event passing a valid board id to access an input control allowing you to enter details required to create a new Region\n', function(done) {
    var queue = this.queue;
    var interface = this.interface;
    var ui = this.ui;

    queue.subscribe( '#.fail', done ).once();

    interface.newRegion( view.getId() )
      .then(function() {
        ui.called.should.deep.equal( [ 'displayRegionCreator' ] );
        ui.calledWith.should.deep.equal( [ view ] );

        done();
      })
      .catch( done );
  });
}

features.title = 'Accessing the region creator input control';

module.exports = features;
