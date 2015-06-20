var chai = require('chai');
var should = chai.should();
var fixture = require('../fixtures/BasicWall.WithMultipleViews.FirstWithTwoRegions');

var wall, view, views, card, region;

function features() {
  beforeEach(function( done ) {
    fixture( this, 'Wall for moving a card on' )
      .then(function( storage ) {
        wall = storage.wall;
        view = storage.view;
        views = storage.views;
        card = storage.card;
        region = storage.region;

        done();
      })
      .catch( done );
  });

  it('Moving a Card in and out of the area of a Region\n', function( done ) {
    this.timeout( 1000 );

    var queue = this.queue;

    var pos = region.getPosition();
    var size = region.getSize();

    var moves = [
      // outside bottom right corner
      {
        card: card.getId(),
        view: region.getView(),
        x: pos.x + size.width + 10,
        y: pos.y + size.height + 10
      },

      // outside to outside - outside middle right edge
      {
        card: card.getId(),
        view: region.getView(),
        x: pos.x + size.width + 10,
        y: pos.y + Math.round( ( size.height - 65 ) / 2 )
      },

      // outside to inside - center of region
      {
        card: card.getId(),
        view: region.getView(),
        x: pos.x + Math.round( ( size.width - 100 ) / 2 ),
        y: pos.y + Math.round( ( size.height - 65 ) / 2 )
      },

      // inside to inside - inside top left corner
      {
        card: card.getId(),
        view: region.getView(),
        x: pos.x + Math.round( ( size.width - 100 ) / 2 ),
        y: pos.y + Math.round( ( size.height - 65 ) / 2 )
      },

      // inside to outside - outside middle right edge
      {
        card: card.getId(),
        view: region.getView(),
        x: pos.x + size.width + 10,
        y: pos.y + Math.round( ( size.height - 65 ) / 2 )
      }
    ];

    queue.subscribe( '#.fail', done ).once();

    var cardSet = false;
    queue.subscribe( 'card.transformed', function( transformed ) {
      should.exist( transformed );

      transformed.should.have.property( 'op' );

      if ( transformed.op === 'set' ) {
        transformed.should.have.property( 'view', views[1].getId() );
        transformed.should.have.property( 'op', 'set' );
        transformed.should.have.property( 'card', move.card );
        transformed.should.have.property( 'property', 'color' );
        transformed.should.have.property( 'value', region.getColor() );

        cardSet = true;
      }
      if ( transformed.op === 'unset' ) {
        transformed.should.have.property( 'view', views[1].getId() );
        transformed.should.have.property( 'op', 'unset' );
        transformed.should.have.property( 'card', move.card );
        transformed.should.have.property( 'property', 'color' );
        transformed.should.have.property( 'value', region.getColor() );

        cardSet.should.be.true;
        regionWasEntered.should.be.true;
        regionWasExited.should.be.true;
        moveIndex.should.equal( moves.length );
        movedIndex.should.equal( moves.length );

        done();
      }
    })
    .catch( done );

    var regionWasEntered = false;
    queue.subscribe( 'card.regionentered', function( entered ) {
      should.exist( entered );

      entered.should.have.property( 'card', move.card );
      entered.should.have.property( 'region', region.getId() );

      card.getRegions().should.include( region.getId() );
      region.getCards().should.include( move.card );

      regionWasEntered = true;
    })
    .catch( done );

    var regionWasExited = false;
    queue.subscribe( 'card.regionexited', function( exited ) {
      should.exist( exited );

      exited.should.have.property( 'card', move.card );
      exited.should.have.property( 'region', region.getId() );

      card.getRegions().should.not.include( region.getId() );
      region.getCards().should.not.include( move.card );

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
    })
    .catch( done );

    var moveIndex = 0;
    var cardUnderTest = card;
    function moveCardToNextLocation() {
      var ev = moves[ moveIndex ];

      cardUnderTest.move( ev );

      moveIndex++;

      if ( moveIndex < moves.length )
        setTimeout( moveCardToNextLocation, 0 );    // allow event processing to run inbetween
    }

    moveCardToNextLocation();
  });
}

features.title = 'Moving Cards in and out of regions';

module.exports = features;
