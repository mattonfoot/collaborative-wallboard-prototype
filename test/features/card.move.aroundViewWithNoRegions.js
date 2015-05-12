var chai = require('chai');
var should = chai.should();
var fixture = require('../fixtures/BasicWall.WithMultipleViews.FirstWithTwoRegions');

var wall, view, card, region;

function features() {
  beforeEach(function( done ) {
    fixture( this, 'Wall for moving a card on' )
      .then(function( storage ) {
        wall = storage.wall;
        view = storage.views[1];
        card = storage.card;
        region = storage.region;

        done();
      })
      .catch( done );
  });

  it('Moving a Card within a View where Regions are on another View\n', function( done ) {
    this.timeout( 1000 );

    var queue = this.queue;

    var pos = region.getPosition();
    var size = region.getSize();

    var moves = [
      // outside bottom right corner
      {
        card: card.getId(),
        view: view.getId(),
        x: pos.x + size.width + 10,
        y: pos.y + size.height + 10
      },

      // outside to outside - outside middle right edge
      {
        card: card.getId(),
        view: view.getId(),
        x: pos.x + size.width + 10,
        y: pos.y + Math.round( ( size.height - 65 ) / 2 )
      },

      // outside to inside - center of region
      {
        card: card.getId(),
        view: view.getId(),
        x: pos.x + Math.round( ( size.width - 100 ) / 2 ),
        y: pos.y + Math.round( ( size.height - 65 ) / 2 )
      },

      // inside to inside - inside top left corner
      {
        card: card.getId(),
        view: view.getId(),
        x: pos.x + Math.round( ( size.width - 100 ) / 2 ),
        y: pos.y + Math.round( ( size.height - 65 ) / 2 )
      },

      // inside to outside - outside middle right edge
      {
        card: card.getId(),
        view: view.getId(),
        x: pos.x + size.width + 10,
        y: pos.y + Math.round( ( size.height - 65 ) / 2 )
      }
    ];

    queue.subscribe( '#.fail', done ).once();

    var cardSet = false;
    var cardUnset = false;
    queue.subscribe( 'card.transformed', function( transformed ) {
      should.not.exist( transformed, 'Card should never get transformed' );

      if ( transformed.op === 'set' ) {
        cardSet = true;
      }
      if ( transformed.op === 'unset' ) {
        cardUnset = true;
      }
    })
    .catch( done );

    var regionWasEntered = false;
    queue.subscribe( 'card.regionentered', function( entered ) {
      should.not.exist( entered, 'Card should never enter a region' );

      regionWasEntered = true;
    })
    .catch( done );

    var regionWasExited = false;
    queue.subscribe( 'card.regionexited', function( exited ) {
      should.not.exist( entered, 'Card should never exit a region' );

      regionWasExited = true;
    })
    .catch( done );

    var movedIndex = 0;
    queue.subscribe( 'card.moved', function( moved ) {
      should.exist( moved );

      move = moves[ movedIndex ];

      moved.should.have.property( 'card', move.card );
      moved.should.have.property( 'view', move.view );
      moved.should.have.property( 'x', move.x );
      moved.should.have.property( 'y', move.y );

      var position = card.getPosition( move.view );
      position.x.should.equal( move.x );
      position.y.should.equal( move.y );

      movedIndex++;

      if ( movedIndex === moves.length ) {
        cardSet.should.equal( false, 'Card should not get set' );
        cardUnset.should.equal( false, 'Card should not get unset' );
        regionWasEntered.should.equal( false, 'Card should not enter a region' );
        regionWasExited.should.equal( false, 'Card should not exit a region' );
        moveIndex.should.equal( moves.length, 'There should be 5 moves' );
        movedIndex.should.equal( moves.length, 'The card should get moved 4 times' );

        done();
      }
    })
    .catch( done );

    var moveIndex = 0;
    var cardUnderTest = card;
    function moveCardToNextLocation() {
      var ev = moves[ moveIndex ];

      moveIndex++;

      cardUnderTest.move( ev );

      if ( moveIndex < moves.length )
        setTimeout( moveCardToNextLocation, 0 );    // allow event processing to run inbetween
    }

    moveCardToNextLocation();
  });
}

features.title = 'Moving Cards around a View with no Regions';

module.exports = features;
