var chai = require('chai')
  , should = chai.should()
  , RSVP = require('rsvp')
  , Promise = RSVP.Promise
  , PouchDB = require('pouchdb')
  , Belt = require('belt')
  , ExecutionTimer = require('./executionTimer')
  , Application = require('../lib/application')
  , Queue = require('../lib/queue');

var debug = false;
var queueDebug = false;

var featureSet = {};

var features = [
  /* Service API */
  require( './features/wall.create' ),   // Nothing
  require( './features/wall.display' ),  // BasicWall
  require( './features/wall.update' ),   // BasicWall + display
  require( './features/board.create' ),  // BasicWall + display
  require( './features/board.display' ), // BasicWall.WithMultipleBoards
  require( './features/board.update' ),  // BasicWall.WithOneBoard + display
  require( './features/card.create' ),   // BasicWall + display
//  require( './features/card.update' ),    // BasicWall.WithMultipleBoards.FirstWithTwoRegions
  require( './features/card.create.onWallWithBoard' ),   // BasicWall.WithOneBoard + display
  require( './features/card.create.onWallWithMultipleBoard' ), // BasicWall.WithMultipleBoards + display
  require( './features/region.create' ), // BasicWall.WithOneBoard + display
//  require( './features/region.update' ),    // BasicWall.WithMultipleBoards.FirstWithTwoRegions
  require( './features/board.create.withCompleteBoard' ),    // BasicWall.WithMultipleBoards.FirstWithTwoRegions
  require( './features/card.create.toDisplayedBoardOfMultipleBoards' ),  // BasicWall.WithMultipleBoards.FirstWithTwoRegions

  /* Interface API */
//  require( './features/wall.new' ),      // Nothing
//  require( './features/wall.select' ),   // BasicWall
//  require( './features/wall.select.withMultipleWalls' ),     // MultipleWalls
//  require( './features/wall.edit' ),     // BasicWall + display
//  require( './features/board.new' ),     // BasicWall + display
//  require( './features/board.edit' ),    // BasicWall.WithOneBoard + display
//  require( './features/card.new' ),      // BasicWall + display
//  require( './features/card.edit' ),    // BasicWall.WithMultipleBoards.FirstWithTwoRegions
//  require( './features/region.new' ),    // BasicWall.WithOneBoard + display
//  require( './features/region.edit' ),    // BasicWall.WithMultipleBoards.FirstWithTwoRegions

  /* complex actions */
  require( './features/wall.display.withCompleteBoard' ),    // BasicWall.WithMultipleBoards.FirstWithTwoRegions
  require( './features/board.display.withCompleteBoard' ),   // BasicWall.WithMultipleBoards.FirstWithTwoRegions

  /* moving items on boards */
  require( './features/card.move.intoEmptyArea' ),    // BasicWall.WithMultipleBoards.FirstWithTwoRegions
  require( './features/region.move.intoEmptyArea' ),  // BasicWall.WithMultipleBoards.FirstWithTwoRegions
  require( './features/card.move.overARegion' ),      // BasicWall.WithMultipleBoards.FirstWithTwoRegions
  require( './features/region.move.UnderACard' ),  // BasicWall.WithMultipleBoards.FirstWithTwoRegions

  /* Transforming cards */
  require( './features/card.move.onABoardWithATransform' ),
  require( './features/region.move.onABoardWithATransform' ),
  /*
    TRANSFORM --> CREATE, UNLINK
  */
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

        var db = 'vuuse_features_' + dbIndex;
        var channelName = this.channelName = 'vuuse_features_channel' + dbIndex;

        if ( !process.browser ) {
          db = new PouchDB( db, { db: require('memdown') } );
        } else {
          db = new PouchDB( db );
        }

        var pouch = this.pouch = db;
        var belt = this.belt = new Belt( db );
        var queue = this.queue = new Queue({ channel: channelName, debug: debug || queueDebug });

        var application = this.application = new Application( belt, queue, null, { debug: debug } );

        var services = this.services = this.application.services;

        if ( debug ) {
          // ExecutionTimer( belt, 'Belt' );
          ExecutionTimer( application.commands, 'Commands' );
          ExecutionTimer( application.queries, 'Queries' );
          ExecutionTimer( application.interface, 'Interface' );
          ExecutionTimer( application.movementTracker, 'MovementTracker' );
          ExecutionTimer( application.transformManager, 'TransformManager' );
        }

        done();
      });

      afterEach(function( done ) {
        var belt = this.belt;
        var queue = this.queue;
        var application = this.application;

        queue.clearAll();

        this.pouch.destroy()
          .then(function () {
            done();
          }).catch( done );
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



// additional assertions

chai.Assertion.addMethod('specificWallResource', shouldBeSpecificWallResource);

function shouldBeSpecificWallResource( expectedName ) {
    var resource = this._obj;

    resource.should.respondTo( 'getId' );
    resource.should.respondTo( 'getName' );
    resource.getName().should.equal( expectedName );
}

chai.Assertion.addMethod('specificBoardResource', shouldBeSpecificBoardResource);

function shouldBeSpecificBoardResource( expectedName, expectedWallId ) {
    var resource = this._obj;

    resource.should.respondTo( 'getId' );
    resource.should.respondTo( 'getName' );
    resource.getName().should.equal( expectedName );
    resource.should.respondTo( 'getWall' );
    resource.getWall().should.equal( expectedWallId );
    resource.should.respondTo( 'getTransforms' );
    resource.should.respondTo( 'getCardLocations' );
    resource.should.respondTo( 'getRegions' );
}

chai.Assertion.addMethod('specificCardResource', shouldBeSpecificCardResource);

function shouldBeSpecificCardResource( expectedTitle, expectedWallId ) {
    var resource = this._obj;

    resource.should.respondTo( 'getId' );
    resource.should.respondTo( 'getTitle' );
    resource.getTitle().should.equal( expectedTitle );
    resource.should.respondTo( 'getWall' );
    resource.getWall().should.equal( expectedWallId );
    resource.should.respondTo( 'getContent' );
    resource.should.respondTo( 'getTags' );
    resource.should.respondTo( 'getMentions' );
    resource.should.respondTo( 'getCardnumber' );
    resource.should.respondTo( 'getCardLocations' );
    resource.should.respondTo( 'getRegions' );
}

chai.Assertion.addMethod('specificRegionResource', shouldBeSpecificRegionResource);

function shouldBeSpecificRegionResource( expectedLabel, expectedBoardId ) {
    var resource = this._obj;

    resource.should.respondTo( 'getId' );
    resource.should.respondTo( 'getLabel' );
    resource.getLabel().should.equal( expectedLabel );
    resource.should.respondTo( 'getBoard' );
    resource.getBoard().should.equal( expectedBoardId );
    resource.should.respondTo( 'getColor' );
    resource.should.respondTo( 'getValue' );
    resource.should.respondTo( 'getX' );
    resource.should.respondTo( 'getY' );
    resource.should.respondTo( 'getHeight' );
    resource.should.respondTo( 'getWidth' );
    resource.should.respondTo( 'getPockets' );
}
