var chai = require('chai');
var should = chai.should();
var fixture = require('../fixtures/BasicWall.WithMultipleViews.FirstWithTwoRegions');

var wall, cards;

function features() {
  beforeEach(function( done ) {
    var services = this.services;

  fixture( this, 'Wall for new board' )
    .then(function( storage ) {
      wall = storage.wall;
      cards = storage.cards;

      done();
    })
    .catch( done );
  });

  it('Any cards that are already available to the Boards associated Wall will be automatically created and placed on the new Board\n', function( done ) {
    var queue = this.queue;
    var interface = this.interface;

    var cardids = cards.map(function( card ){ return card.getId(); });

    queue.subscribe( '#.fail', done ).once();

    var boardid;
    var subscription = queue.subscribe( 'card.added', function( added ) {
      should.exist( added );

      added.should.have.property( 'board', boardid );

      added.should.have.property( 'card' );
      var index = cards.indexOf( added.card );

      if ( index >= 0 ) {
        cards.splice( index, 1 );
      }

      if ( !cards.length ) {
        subscription.unsubscribe();

        cardsfound = true;
        if ( cardsfound ) done();
      }
    })
    .catch( done );

    queue.subscribe('board.created', function( created ) {
      should.exist( created );

      created.should.have.property( 'board' );
      created.should.have.property( 'wall', create.wall );
      created.should.have.property( 'name', create.name );

      boardid = created.board;
    })
    .catch( done )
    .once();

    var create = {
      wall: wall.getId(),
      name: 'board with cards added automatically'
    };

    interface.createBoard( create );
  });

}

features.title = 'Creating a board on a wall where cards already exist';

module.exports = features;
