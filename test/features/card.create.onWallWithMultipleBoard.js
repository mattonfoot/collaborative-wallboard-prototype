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

    queue.subscribe( '#.fail', done ).once();

    var cardid;

    queue.subscribe( 'card.created', function( created ) {
      should.exist( created );

      created.should.have.property( 'card' );
      cardid = created.card;
      created.card.should.equal( cardid );
      created.should.have.property( 'wall', create.wall );
      created.should.have.property( 'title', create.title );

      wall.getCards().should.contain( created.card );

      ui.called.should.deep.equal( [ 'displayCard' ] );
      ui.calledWith.should.deep.equal( [ card ] );

      done();
    })
    .catch( done )
    .once();

    var create = {
      wall: wall.getId(),
      title: 'new card on multiple views'
    };

    interface.createCard( create );
  });
}

features.title = 'Creating a Card on a wall with multiple Views';

module.exports = features;
