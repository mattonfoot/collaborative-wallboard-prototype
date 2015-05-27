var chai = require('chai')
  , should = chai.should()
  , RSVP = require('rsvp')
  , Promise = RSVP.Promise
  , ExecutionTimer = require('./executionTimer')
  , Application = require('../lib/application')
  , UI = require('./fakeUI')
  , DB = require('./fakeDB')
  , Queue = require('../lib/queue');

var debug = false;
var queueDebug = false;

var featureSet = {};

var serviceFeatures = [
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

  // BasicWall.WithMultipleViews.FirstWithTwoRegions
  require( './features/card.update' ),   // BasicWall.WithMultipleViews.FirstWithTwoRegions
  require( './features/region.update' ), // BasicWall.WithMultipleViews.FirstWithTwoRegions

  // moving items on boards
  require( './features/card.move.intoEmptyArea' ),    // BasicWall.WithMultipleViews.FirstWithTwoRegions
  require( './features/region.move.intoEmptyArea' ),  // BasicWall.WithMultipleViews.FirstWithTwoRegions
  require( './features/card.move.overARegion' ),      // BasicWall.WithMultipleViews.FirstWithTwoRegions
  require( './features/region.move.UnderACard' ),     // BasicWall.WithMultipleViews.FirstWithTwoRegions

  // Transforming cards
  require( './features/card.move.onABoardWithATransform' ),
  require( './features/region.move.onABoardWithATransform' ),
  require( './features/card.move.inAndOutOfARegion' ),
  require( './features/card.move.aroundViewWithNoRegions' )

];

var interfaceFeatures = [
  /* Interface API */
  require( './features/wall.new' ),      // Nothing

  require( './features/wall.select' ),   // BasicWall

  require( './features/wall.display' ),  // BasicWall
  require( './features/wall.edit' ),     // BasicWall
  require( './features/view.new' ),      // BasicWall
  require( './features/card.new' ),      // BasicWall

  require( './features/wall.select.withMultipleWalls' ),     // MultipleWalls

  require( './features/view.edit' ),     // BasicWall.WithOneView
  require( './features/region.new' ),    // BasicWall.WithOneView

  require( './features/view.display' ), // BasicWall.WithMultipleViews
  require( './features/card.create.onWallWithMultipleBoard' ), // BasicWall.WithMultipleViews

  require( './features/card.edit' ),    // BasicWall.WithMultipleViews.FirstWithTwoRegions

  require( './features/region.edit' ),    // BasicWall.WithMultipleViews.FirstWithTwoRegions
  require( './features/wall.display.withCompleteBoard' ),    // BasicWall.WithMultipleViews.FirstWithTwoRegions
  require( './features/view.display.withCompleteBoard' ),   // BasicWall.WithMultipleViews.FirstWithTwoRegions
//  require( './features/board.create.withCompleteBoard' ),    // BasicWall.WithMultipleViews.FirstWithTwoRegions
//  require( './features/card.create.toDisplayedBoardOfMultipleBoards' ),  // BasicWall.WithMultipleViews.FirstWithTwoRegions

];

serviceFeatures.forEach(function( feature ) {
    featureSet[ feature.title ] = featureSet[ feature.title ] || [];

    feature.type = 'service';

    featureSet[ feature.title ].push( feature );
});

interfaceFeatures.forEach(function( feature ) {
    featureSet[ feature.title ] = featureSet[ feature.title ] || [];

    feature.type = 'interface';

    featureSet[ feature.title ].push( feature );
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
        var db = this.db = new DB( queue );
        var queue = this.queue = new Queue({
          federate: false,
          db: db,
          channelName: channelName,
          debug: debug || queueDebug,
          clientId: 'test_client_' + Date.now()
        });

        var ui = this.ui = feature.type === 'interface' ? new UI( queue ) : null;
        var application = this.application = new Application( queue, ui, { debug: debug } );
        var services = this.services = this.application.services;
        var interface = this.interface = this.application.interface;

        if ( debug ) {
          ExecutionTimer( this.ui, 'UI' );
          ExecutionTimer( application.repository, 'Repository' );
          ExecutionTimer( application.interface, 'Interface' );
          ExecutionTimer( application.services, 'Services' );
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
