var chai = require('chai');
var should = chai.should();
var fixture = require('../fixtures/BasicWall.WithMultipleBoards.FirstWithTwoRegions');

var card;

function features() {
  beforeEach(function( done ) {
    var ui = this.ui;

    fixture( this, 'unedited card view' )
      .then(function( storage ) {
        card = storage.card;

        ui.reset();

        done();
      })
      .catch( done );
  });

  it('Pass a valid card id to enter new details for a Card\n', function(done) {
    var queue = this.queue;
    var interface = this.interface;
    var ui = this.ui;

    queue.subscribe( '#.fail', done ).once();

    interface.editCard( card.getId() )
      .then(function() {
        ui.called.should.deep.equal( [ 'displayCardEditor' ] );
        ui.calledWith.should.deep.equal( [ card ] );

        done();
      })
      .catch( done );
  });
}

features.title = 'Editing a Card';

module.exports = features;
