var chai = require('chai')
  , should = chai.should();

var storedWall, storedBoard, storedCards, storedRegions
  , storedName = 'board with cards added automatically';

function features() {

  beforeEach(function(done) {
    var scenarios = this.scenarios;

    scenarios.TwoBoardsOneWithRegions.call( this )
      .then(function( storage ) {
        storedWall = storage.wall;
        storedBoard = storage.boards[1];

        storedCards = storage.pockets;

        done();
      })
      .catch( done );
  });

  it('Any cards that are already available to the Boards associated Wall will be automatically created and placed on the new Board\n', function( done ) {
    var queue = this.queue;
    var cards = storedCards.map(function( pocket ){ return pocket.getId(); });
    var cardsfound = false;
    var queuechecked = false;

    queue.subscribe( '#.fail', done );

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
