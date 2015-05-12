var chai = require('chai');
var should = chai.should();
var fixture = require('../fixtures/BasicWall.WithMultipleViews.FirstWithTwoRegions');

var region;

function features() {
  beforeEach(function( done ) {
    var ui = this.ui;

    fixture( this, 'unedited region view' )
      .then(function( storage ) {
        region = storage.region;

        ui.reset();

        done();
      })
      .catch( done );
  });

  it('Pass a valid region id to enter new details for a Region\n', function(done) {
    var queue = this.queue;
    var interface = this.interface;
    var ui = this.ui;

    queue.subscribe( '#.fail', done ).once();

    interface.editRegion( region.getId() )
      .then(function() {
        ui.called.should.deep.equal( [ 'displayRegionEditor' ] );
        ui.calledWith.should.deep.equal( [ region ] );

        done();
      })
      .catch( done );
  });
}

features.title = 'Editing a Region';

module.exports = features;
