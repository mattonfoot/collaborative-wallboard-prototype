var chai = require('chai')
  , should = chai.should()
  , RSVP = require('rsvp')
  , Promise = RSVP.Promise;

var storedWall, storedBoard, numCards = 0, numRegions = 0;

function features() {

  beforeEach(function(done) {
    var scenarios = this.scenarios;
    var queue = this.queue;

    queue.subscribe('controls:enabled', function( board ) {
      done();
    })
    .catch( done )
    .once();

    scenarios.TwoBoardsOneWithRegions.call( this )
      .then(function( storage ) {
        storedWall = storage.wall;
        storedBoard = storage.boards[ 1 ];

        numCards = storage.pockets.length;
        numRegions = storage.regions.length;

        queue.publish( 'wall:display', storedWall.getId() );
      })
      .catch( done );
  });

  it('Any card and regions already associated with a board will also be displayed\n', function(done) {
    var queue = this.queue;
    var cardscount = 0;
    var regionscount = 0;
    var queuechecked = false;

    var locationSubscription = queue.subscribe( 'cardlocation:displayed', function( resource ) {
      cardscount++;

      if ( cardscount === numCards ) {
        locationSubscription.unsubscribe();

        if ( regionscount === numRegions && queuechecked ) done();
      }
    })
    .catch( done )
    .distinct();

    var regionSubscription = queue.subscribe( 'region:displayed', function( resource ) {
      regionscount++;

      if ( regionscount === numRegions ) {
        regionSubscription.unsubscribe();

        if ( cardscount === numCards && queuechecked ) done();
      }
    })
    .catch( done )
    .distinct();

    queue.when([
        'board:display'
      , 'board:displayed'
      , 'controls:enabled'
    ],
    function( a, b, c ) {
      should.exist( a );

      should.exist( b );
      b.should.be.a.specificBoardResource( storedBoard.getName(), storedWall.getId() );
      b.getId().should.equal( storedBoard.getId() );

      queuechecked = true;
      if ( cardscount === numCards && regionscount === numRegions && queuechecked ) done();
    },
    done,
    { once: true });

    queue.trigger( 'board:display', storedBoard.getId() );
  });
}

features.title = 'Selecting a pre populated Board for display';

module.exports = features;
