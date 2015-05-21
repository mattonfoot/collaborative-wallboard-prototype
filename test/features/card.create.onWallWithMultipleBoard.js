var chai = require('chai');
var should = chai.should();
var fixture = require('../fixtures/BasicWall.WithMultipleViews');

var wall, view;

function features() {
  beforeEach(function( done ) {
    var interface = this.interface;
    var ui = this.ui;

    fixture( this, 'display view' )
      .then(function( storage ) {
        wall = storage.wall;
        view = storage.view;

        return interface.displayWall( wall.getId() );
      })
      .then(function() {
        ui.reset();

        done();
      })
      .catch( done );
  });

  it('Emit a <card.create> event passing a data object with a valid wall id and a title attribute to trigger the process of creating a new Card\n', function( done ) {
    var queue = this.queue;
    var interface = this.interface;
    var ui = this.ui;
    var repository = this.application.repository;

    queue.subscribe( '#.fail', done ).once();

    var create = {
      wall: wall.getId(),
      title: 'new card on multiple views'
    };

    var actualDisplayCard = ui.displayCard;
    ui.displayCard = function( view, card ) {
      should.exist( view );
      should.exist( card );

      var out = actualDisplayCard.call( this, view, card );

      ui.called.should.deep.equal( [ 'displayCard' ] );
      ui.calledWith.should.deep.equal( [ card ] );

      done();

      return out;
    };

    interface.createCard( create )
      .catch( done );
  });
}

features.title = 'Creating a Card on a wall with multiple Views';

module.exports = features;
