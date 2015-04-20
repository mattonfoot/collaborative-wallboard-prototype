var chai = require('chai');
var should = chai.should();
var fixture = require('../fixtures/BasicWall.WithMultipleBoards.FirstWithTwoRegions');

var storedName = 'board with cards added automatically'
  , storedWall, storedBoard, storedCards, storedRegions;

function features() {
  beforeEach(function( done ) {
    fixture( this, 'Wall for new board' )
      .then(function( storage ) {
        storedWall = storage.wall;
        storedBoard = storage.board;

        storedCards = storage.cards;

        done();
      })
      .catch( done );
  });

  it('Any cards that are already available to the Boards associated Wall will be automatically created and placed on the new Board\n', function( done ) {
    var queue = this.queue;
    var cards = storedCards.map(function( card ){ return card.getId(); });
    var cardsfound = false;
    var queuechecked = false;

    queue.subscribe( '#:fail', done ).once();
    queue.subscribe( '#.fail', done ).once();

    var subscription = queue.subscribe( 'cardlocation:created', function( resource ) {
      var index = cards.indexOf( resource.getPocket() );

      if ( index >= 0 ) {
        cards.splice( index , 1 );
      }

      if ( !cards.length ) {
        subscription.unsubscribe();

        cardsfound = true;
        if ( cardsfound && queuechecked ) done();
      }
    })
    .catch( done );

    queue.when([
      'board:create',
      'board:created',
      'board:added'
    ],
    function( a, b, c, d, e ) {
      should.exist( c );
      c.should.be.a.specificBoardResource( storedName, storedWall.getId() );

      queuechecked = true;
      if ( cardsfound && queuechecked ) done();
    },
    done,
    { once: true });

    queue.trigger( 'board:create', { wall: storedWall.getId(), name: storedName } );
  });

}

features.title = 'Creating a board on a wall where cards already exist';

module.exports = features;
