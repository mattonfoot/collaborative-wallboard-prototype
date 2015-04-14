var chai = require('chai')
  , should = chai.should()
  , RSVP = require('rsvp')
  , Promise = RSVP.Promise
  , PouchDB = require('pouchdb')
  , Belt = require('belt')
  , ExecutionTimer = require('./executionTimer')
  , Application = require('../lib/application')
  , UI = require('../lib/interface')
  , Queue = require('../lib/queue');

var debug = false;
var queueDebug = false;

var featureSet = {};

var features = [

  /* Walls features */
    require( './features/wall.new' )
  , require( './features/wall.create' )
  , require( './features/wall.select' )
  , require( './features/wall.select.withMultipleWalls' )
  , require( './features/wall.display' )
  , require( './features/wall.display.withCompleteBoard' )
  , require( './features/wall.edit' )
  , require( './features/wall.update' )

  /* Board features */
  , require( './features/board.new' )
  , require( './features/board.create' )
  , require( './features/board.create.withCompleteBoard' )
  , require( './features/board.display' )
  , require( './features/board.display.withCompleteBoard' )
  , require( './features/board.edit' )
  , require( './features/board.update' )

  /* Card features */
  , require( './features/card.new' )
  , require( './features/card.create' )
  , require( './features/card.create.withMultipleBoard' )
  , require( './features/card.create.toDisplayedBoardOFMultipleBoards' )
/*
  CARD --> EDIT, UPDATE

  , require( './features/card.move.intoEmptyArea' )
  , require( './features/card.move.overARegion' )
*/

  /* Region features */
  , require( './features/region.new' )
  , require( './features/region.create' )
/*
    REGION --> EDIT, UPDATE

  , require( './features/region.move.intoEmptyArea' )
  , require( './features/region.move.UnderACard' )
*/

  /* Transforming cards */
/*
    TRANSFORM --> CREATE, UNLINK

  , require( './features/card.move.onABoardWithATransform' )
  , require( './features/region.move.onABoardWithATransform' )
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
        var ui = this.ui = new UI( queue );

        var application = this.application = new Application( belt, queue, ui, { debug: debug } );

        var services = this.services = this.application.services;

        this.scenarios = {
            TwoBoardsOneWithRegions: setupPopulatedBoardScenario
          , OneEmptyBoard: setupEmptyBoardScenario
          , multipleWalls: setupMultipleWallScenario
          , colorChangingBoard: setupColorChangingBoardScenario
        };

        if ( debug ) {
          // ExecutionTimer( belt, 'Belt' );
          ExecutionTimer( application.commands, 'Commands' );
          ExecutionTimer( application.queries, 'Queries' );
          ExecutionTimer( application.interface, 'Interface' );
          ExecutionTimer( application.movementTracker, 'MovementTracker' );
          ExecutionTimer( application.transformManager, 'TransformManager' );
        }

        application.startListening();

        done();
      });

      afterEach(function( done ) {
        var belt = this.belt;
        var queue = this.queue;
        var application = this.application;

        application.pauseListening();

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




// setup routines

function setupMultipleWallScenario() {
  var belt = this.belt;
  var queue = this.queue;
  var ui = this.ui;
  var application = this.application;
  var services = this.services;
  var scenarios = this.scenarios;

    application.pauseListening();

    return new Promise(function( resolve, reject ) {
      var storage = {
        walls: [],
        boards: [],
        regions: [],
        pockets: [],
        locations: []
      };

      belt
        .create('wall', { name: 'Multiple Wall Scenario One' })
        .then(function( wall ) {
          storage.wall = wall;
          storage.walls.push( wall );

          return belt.create('wall', { name: 'Multiple Wall Scenario two' });
        })
        .then(function( wall ) {
          storage.walls.push( wall );

          return belt.create('wall', { name: 'Multiple Wall Scenario Three' });
        })
        .then(function( wall ) {
          storage.walls.push( wall );

          return belt.create('board', { wall: storage.walls[0].getId(), name: 'Empty Board One' });
        })
        .then(function( board ){
          storage.wall = board;
          storage.boards.push( board );

          return belt.create('board', { wall: storage.walls[1].getId(), name: 'Empty Board Two' });
        })
        .then(function( board ){
          storage.boards.push( board );

          return belt.create('board', { wall: storage.walls[2].getId(), name: 'Empty Board Three' });
        })
        .then(function( board ){
          storage.boards.push( board );

          application.startListening();

          resolve( storage );
        })
        .catch( reject );
    });
}

function setupEmptyBoardScenario() {
  var belt = this.belt;
  var queue = this.queue;
  var ui = this.ui;
  var application = this.application;
  var services = this.services;
  var scenarios = this.scenarios;

  application.pauseListening();

  return new Promise(function( resolve, reject ) {
    var storage = {
      walls: [],
      boards: [],
      regions: [],
      pockets: [],
      locations: []
    };

    // one wall
    belt
      .create( 'wall', { name: 'Empty Board Scenario' })
      .then(function( wall ) {
        storage.wall = wall;
        storage.walls.push( wall );

        return belt.create('board', { wall: storage.wall.getId(), name: 'Empty Board' })
      })
      .then(function( board ) {
        storage.board = board;
        storage.boards.push( board );

        application.startListening();

        resolve( storage );
      })
      .catch( reject );
  });
}

function setupPopulatedBoardScenario() {
  var belt = this.belt;
  var queue = this.queue;
  var ui = this.ui;
  var application = this.application;
  var services = this.services;
  var scenarios = this.scenarios;

  application.pauseListening();

  return new Promise(function( resolve, reject ) {
    var storage = {
      walls: [],
      boards: [],
      regions: [],
      pockets: [],
      locations: []
    };

    // one wall
    belt
      .create( 'wall', { name: 'Populated Board Scenario' })
      .then(function( wall ) {
        storage.wall = wall;
        storage.walls.push( wall );

        return belt.create('board', { wall: storage.wall.getId(), name: 'Board with cards only' });
      })
      .then(function( board ) {
        storage.board = board;
        storage.boards.push( board );

        return belt.create('board', { wall: storage.wall.getId(), name: 'Board with regions' });
      })
      .then(function( board ) {
        storage.boards.push( board );

        return belt.create('region', { board: storage.boards[1].getId(), label: 'Red Region', value: 1, color: 'red', x: 300, y:50, width:200, height:200 });
      })
      .then(function( region ) {
        storage.regions.push( region );

        return belt.create('region', { board: storage.boards[1].getId(), label: 'Blue Region', value: 2, color: 'blue', x: 300, y:300, width:200, height:200 });
      })
      .then(function( region ) {
        storage.regions.push( region );

        return belt.create('pocket', { wall: storage.wall.getId(), title: 'First Card' });
      })
      .then(function( pocket ) {
        storage.pockets.push( pocket );

        return belt.create('pocket', { wall: storage.wall.getId(), title: 'Second Card' });
      })
      .then(function( pocket ) {
        storage.pockets.push( pocket );

        return belt.create('cardlocation', { pocket: storage.pockets[0].getId(), board: storage.boards[0].getId(), x:50, y:50 });
      })
      .then(function( location ) {
        storage.locations.push( location );

        return belt.create('cardlocation', { pocket: storage.pockets[1].getId(), board: storage.boards[0].getId(), x:50, y:50 });
      })
      .then(function( location ) {
        storage.locations.push( location );

        return belt.create('cardlocation', { pocket: storage.pockets[0].getId(), board: storage.boards[1].getId(), x:400, y:50 });
      })
      .then(function( location ) {
        storage.locations.push( location );

        return belt.create('cardlocation', { pocket: storage.pockets[1].getId(), board: storage.boards[1].getId(), x:400, y:50 });
      })
      .then(function( location ) {
        storage.locations.push( location );

        application.startListening();

        resolve( storage );
      })
      .catch( reject );
  });
}

function setupColorChangingBoardScenario() {
  var belt = this.belt;
  var queue = this.queue;
  var ui = this.ui;
  var application = this.application;
  var services = this.services;
  var scenarios = this.scenarios;

  application.pauseListening();

  return new Promise(function( resolve, reject ) {
    var storage = {
      walls: [],
      boards: [],
      regions: [],
      pockets: [],
      locations: []
    };

    // one wall
    belt
      .create( 'wall', { name: 'Color Changing Board Scenario' })
      .then(function( wall ) {
        storage.wall = wall;
        storage.walls.push( wall );

        return belt.create('board', { wall: storage.wall.getId(), name: 'Board with color Transform' });
      })
      .then(function( board ) {
        storage.board = board;
        storage.boards.push( board );

        return belt.create('region', { board: board.getId(), label: 'Red Region', value: 1, color: 'red', x: 300, y:50, width:200, height:200 });
      })
      .then(function( region ) {
        storage.region = region;
        storage.regions.push( region );

        return belt.create('region', { board: board.getId(), label: 'Blue Region', value: 2, color: 'blue', x: 300, y:300, width:200, height:200 });
      })
      .then(function( region ) {
        storage.region = region;
        storage.regions.push( region );

        return belt.create('pocket', { wall: storage.wall.getId(), title: 'First Card' });
      })
      .then(function( resource ) {
        storage.pockets.push( resource );

        return belt.create('cardlocation', { pocket: storage.pockets[0].getId(), board: storage.boards[0].getId(), x:400, y:50 });
      })
      .then(function( resource ) {
        storage.locations.push( resource );

        var boardid = storage.boards[0].getId();

        return belt.create('transform', { board: boardid, phrase: 'get color from color of region on board #' + boardid + ' when within region' });
      })
      .then(function( resources ) {
          application.startListening();

          resolve( storage );
      })
      .catch( reject );
  });
}




// additional assertions

chai.Assertion.addMethod('haveLogged', shouldHaveLogged);

function shouldHaveLogged( events ) {
    var queue = this._obj.getCalls();

    var i = 0, len = events.length;

    for (; i < len; i++) {
        queue[i].event.should.equal( events[i], 'expected queued event ' + i + ' to equal ' + events[i] + '\n' );
    }

    queue.length.should.equal( len, 'expected number of queued event to equal ' + len + '\n'  );
}

chai.Assertion.addMethod('containTheSequence', shouldContainTheSequence);

function shouldContainTheSequence( events ) {
    var queue = this._obj.getCalls();

    var i = 0, len = events.length - 1;

    for (; i < len; i++) {
      var index = queue.indexOf( events[ i ] );
      var nextIndex = queue.indexOf( events[ i + 1 ], index );

      console.log( index, nextIndex, i, i + 1 );

      nextIndex.should.be.greaterThan( index, 'expected event ' + events[ i + 1 ] + ' to be after ' + events[ i ] + '\n' );
    }
}

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
