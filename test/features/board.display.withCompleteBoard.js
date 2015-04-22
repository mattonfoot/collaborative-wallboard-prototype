var chai = require('chai');
var should = chai.should();
var fixture = require('../fixtures/BasicWall.WithMultipleBoards.FirstWithTwoRegions');

var storedWall, storedBoard, numCards = 0, numRegions = 0;

function features() {
  beforeEach(function( done ) {
    var services = this.services;

    fixture( this, 'Wall for displaying a board' )
      .then(function( storage ) {
        storedWall = storage.wall;
        storedBoard = storage.board;

        numCards = storage.cards.length;
        numRegions = storage.regions.length;

        return services.displayWall( storedWall.getId() );
      })
      .then(function() {
        done();
      })
      .catch( done );
  });

  it('Any card and regions already associated with a board will also be displayed\n', function(done) {
    var queue = this.queue;
    var cardscount = 0;
    var regionscount = 0;
    var queuechecked = false;

    queue.subscribe( '#.fail', done ).once();

    var locationSubscription = queue.subscribe( 'cardlocation.displayed', function( resource ) {
      cardscount++;

      if ( cardscount === numCards ) {
        locationSubscription.unsubscribe();

        if ( regionscount === numRegions && queuechecked ) done();
      }
    })
    .catch( done )
    .distinct();

    var regionSubscription = queue.subscribe( 'region.displayed', function( resource ) {
      regionscount++;

      if ( regionscount === numRegions ) {
        regionSubscription.unsubscribe();

        if ( cardscount === numCards && queuechecked ) done();
      }
    })
    .catch( done )
    .distinct();

    queue.when([
      'board.displayed',
      'controls.enabled'
    ],
    function( displayed, enabled ) {
      should.exist( displayed );
      displayed.should.be.a.specificBoardResource( storedBoard.getName(), storedWall.getId() );
      displayed.getId().should.equal( storedBoard.getId() );

      queuechecked = true;
      if ( cardscount === numCards && regionscount === numRegions && queuechecked ) done();
    },
    done,
    { once: true });

    queue.publish( 'board.display', storedBoard.getId() );
  });
}

features.title = 'Selecting a pre populated Board for display';

module.exports = features;
