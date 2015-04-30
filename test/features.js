var chai = require('chai')
  , should = chai.should()
  , RSVP = require('rsvp')
  , Promise = RSVP.Promise
  , ExecutionTimer = require('./executionTimer')
  , Application = require('../lib/application')
  , Queue = require('../lib/queue');

var debug = false;
var queueDebug = false;

var featureSet = {};

var features = [
  /* Service API */

  // Nothing
  require( './features/wall.create' ),   // Nothing

  // BasicWall
  require( './features/wall.update' ),   // BasicWall
  require( './features/view.create' ),   // BasicWall
  require( './features/card.create' ),   // BasicWall

  // BasicWall.WithOneView
  require( './features/view.update' ),   // BasicWall.WithOneView
  require( './features/region.create' ), // BasicWall.WithOneView

  // BasicWall.WithMultipleBoards.FirstWithTwoRegions
  require( './features/card.update' ),   // BasicWall.WithMultipleBoards.FirstWithTwoRegions
  require( './features/region.update' ), // BasicWall.WithMultipleBoards.FirstWithTwoRegions

  /* moving items on boards */
  require( './features/card.move.intoEmptyArea' ),    // BasicWall.WithMultipleBoards.FirstWithTwoRegions
  require( './features/region.move.intoEmptyArea' ),  // BasicWall.WithMultipleBoards.FirstWithTwoRegions
  require( './features/card.move.overARegion' ),      // BasicWall.WithMultipleBoards.FirstWithTwoRegions
  require( './features/region.move.UnderACard' ),     // BasicWall.WithMultipleBoards.FirstWithTwoRegions

  /* Transforming cards */
  require( './features/card.move.onABoardWithATransform' ),
  require( './features/region.move.onABoardWithATransform' )

  /*
    TRANSFORM --> CREATE, UNLINK
  */

  /* Interface API */
//  require( './features/wall.new' ),      // Nothing

//  require( './features/wall.select' ),   // BasicWall
//  require( './features/wall.display' ),  // BasicWall
//  require( './features/wall.edit' ),     // BasicWall
//  require( './features/board.new' ),     // BasicWall
//  require( './features/card.new' ),      // BasicWall

//  require( './features/wall.select.withMultipleWalls' ),     // MultipleWalls

//  require( './features/board.edit' ),    // BasicWall.WithOneBoard
//  require( './features/region.new' ),    // BasicWall.WithOneBoard

//  require( './features/board.display' ), // BasicWall.WithMultipleBoards
//  require( './features/card.create.onWallWithMultipleBoard' ), // BasicWall.WithMultipleBoards

//  require( './features/card.edit' ),    // BasicWall.WithMultipleBoards.FirstWithTwoRegions
//  require( './features/region.edit' ),    // BasicWall.WithMultipleBoards.FirstWithTwoRegions
//  require( './features/wall.display.withCompleteBoard' ),    // BasicWall.WithMultipleBoards.FirstWithTwoRegions
//  require( './features/board.display.withCompleteBoard' ),   // BasicWall.WithMultipleBoards.FirstWithTwoRegions
//  require( './features/board.create.withCompleteBoard' ),    // BasicWall.WithMultipleBoards.FirstWithTwoRegions
//  require( './features/card.create.toDisplayedBoardOfMultipleBoards' ),  // BasicWall.WithMultipleBoards.FirstWithTwoRegions
];

features.forEach(function( features ) {
    if (!features.length) {
        features = [ features ];
    }

    features.forEach(function( feature ) {
        featureSet[feature.title] = featureSet[feature.title] || [];

        featureSet[feature.title].push( feature );
    });
});

Fixture('Application service API Features', function() {
  var dbIndex = 0;

  before(function( done ) {
    this.debug = debug;

    done();
  });

  after(function( done ) {
    ExecutionTimer.process();

    done();
  });

  for (var title in featureSet) {
    Feature( title, generateCallList( featureSet[title] ) );
  }
});

var dbIndex = 0;

function generateCallList( calls ) {
  return function() {
    calls.forEach(function( feature ) {

      beforeEach(function( done ) {
        dbIndex++;

        var channelName = this.channelName = 'vuuse_features_channel_' + dbIndex;

        var queue = this.queue = new Queue({ channel: channelName, debug: debug || queueDebug });

        var application = this.application = new Application( null, queue, null, { debug: debug } );

        var services = this.services = this.application.services;

        if ( debug ) {
          ExecutionTimer( application.queries, 'Queries' );
          ExecutionTimer( application.services, 'Services' );
          ExecutionTimer( application.interface, 'Interface' );
          ExecutionTimer( application.movementTracker, 'MovementTracker' );
          ExecutionTimer( application.transformManager, 'TransformManager' );
        }

        done();
      });

      afterEach(function( done ) {
        this.queue.clearAll();

        done();
      });

      feature();
    });
  }
}

// helpers

function Fixture( title, fn ) {
    describe( underline( title, '=', 2, '\n' ), fn );
}

function Feature( title, fn ) {
    describe( underline( title, '-', 4, '' ), fn );
}

function underline( title, format, indent, endWith ) {
    if ( process.browser ) return title;

    return title + '\n' +
        new Array( indent + 1 ).join( ' ' ) +
        new Array( title.length + 1 ).join( format ) +
        endWith;
}
