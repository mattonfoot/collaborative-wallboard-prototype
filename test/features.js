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

var featureSet = {};

var features = [
    require( './features/wall.new' )
  , require( './features/wall.create' )
  , require( './features/wall.select' )
  , require( './features/wall.select.withMultipleWalls' )
  , require( './features/wall.display' )
  , require( './features/wall.display.withCompleteBoard' )
  , require( './features/wall.edit' )
  , require( './features/wall.update' )

  , require( './features/board.new' )
  , require( './features/board.create' )
  , require( './features/board.create.withCompleteBoard' )
  , require( './features/board.display' )
  , require( './features/board.display.withCompleteBoard' )
  , require( './features/board.edit' )
  , require( './features/board.update' )

  , require( './features/card.new' )
  , require( './features/card.create' )
  , require( './features/card.create.withMultipleBoard' )
/*
  , require( './features/card.create.toDisplayedBoardOFMultipleBoards' )
  , require( './features/card.move.intoEmptyArea' )
  , require( './features/card.move.overARegion' )
  , require( './features/card.move.onABoardWithATransform' )
*/
/*
  , require( './features/region.new' )
  , require( './features/region.create' )
  , require( './features/region.move.intoEmptyArea' )
  , require( './features/region.move.UnderACard' )
*/
  /*
    CARD --> EDIT, UPDATE

    REGION --> EDIT, UPDATE, UPDATE

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
        }

        var belt = this.belt = new Belt( db );
        var queue = this.queue = new Queue({ channel: channelName, debug: debug });
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
          ExecutionTimer( belt, 'Belt' );
          ExecutionTimer( application.commands, 'Commands' );
          ExecutionTimer( application.queries, 'Queries' );
          ExecutionTimer( application.interface, 'Interface' );
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

        var promises = [];
        [ 'region', 'cardlocation', 'pocket', 'board', 'wall' ].forEach(function( schema ) {
            belt.findMany( schema )
                .then(function( resources ) {
                    resources.forEach(function( resource ) {
                        promises.push( belt.delete( schema, resource.getId() ) );
                    });
                });
        });

        RSVP.all( promises ).then(function( responses ) {
          done();
        })
        .catch( done );
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
        var storage = {}
          , promises = [];

        promises.push( belt.create('wall', { name: 'Multiple Wall Scenario One' }) );
        promises.push( belt.create('wall', { name: 'Multiple Wall Scenario two' }) );
        promises.push( belt.create('wall', { name: 'Multiple Wall Scenario Three' }) );

        RSVP.all( promises )
            .then(function( resources ) {
                storage.walls = resources;

                var promises = [];

                promises.push( belt.create('board', { wall: resources[0].getId(), name: 'Empty Board One' }) );
                promises.push( belt.create('board', { wall: resources[1].getId(), name: 'Empty Board Two' }) );
                promises.push( belt.create('board', { wall: resources[2].getId(), name: 'Empty Board Three' }) );

                return RSVP.all( promises );
            })
            .then(function( resources ) {
                storage.boards = resources;

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
        var storage = {};

        // one wall
        belt.create( 'wall', { name: 'Empty Board Scenario' })
            .then(function( resource ) {
                storage.wall = resource;

                return belt.create('board', { wall: storage.wall.getId(), name: 'Empty Board' })
            })
            .then(function( resources ) {
                storage.boards = resources;

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
        var storage = {};

        // one wall
        belt.create( 'wall', { name: 'Populated Board Scenario' })
            .then(function( resource ) {
                storage.wall = resource;

                var promises = [];

                promises.push( belt.create('board', { wall: storage.wall.getId(), name: 'Board with cards only' }) );
                promises.push( belt.create('board', { wall: storage.wall.getId(), name: 'Board with regions' }) );

                return RSVP.all( promises );
            })
            .then(function( resources ) {
                storage.boards = resources;

                var promises = [], board = storage.boards[1];

                promises.push( belt.create('region', { board: board.getId(), label: 'Red Region', value: 1, color: 'red', x: 300, y:50, width:200, height:200 }) );
                promises.push( belt.create('region', { board: board.getId(), label: 'Blue Region', value: 2, color: 'blue', x: 300, y:300, width:200, height:200 }) );

                return RSVP.all( promises );
            })
            .then(function( resources ) {
                storage.regions = resources;

                var promises = [];

                promises.push( belt.create('pocket', { wall: storage.wall.getId(), title: 'First Card' }) );
                promises.push( belt.create('pocket', { wall: storage.wall.getId(), title: 'Second Card' }) );

                return RSVP.all( promises );
            })
            .then(function( resources ) {
                storage.pockets = resources;

                var promises = [];

                promises.push( belt.create('cardlocation', { pocket: storage.pockets[0].getId(), board: storage.boards[0].getId(), x:50, y:50 }) );
                promises.push( belt.create('cardlocation', { pocket: storage.pockets[1].getId(), board: storage.boards[0].getId(), x:50, y:50 }) );
                promises.push( belt.create('cardlocation', { pocket: storage.pockets[0].getId(), board: storage.boards[1].getId(), x:400, y:50 }) );
                promises.push( belt.create('cardlocation', { pocket: storage.pockets[1].getId(), board: storage.boards[1].getId(), x:400, y:50 }) );

                return RSVP.all( promises );
            })
            .then(function( resources ) {
                storage.locations = resources;

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
            boards: [],
            pockets: [],
            locations: []
        };

        // one wall
        belt.create( 'wall', { name: 'Color Changing Board Scenario' })
            .then(function( resource ) {
                storage.wall = resource;

                return belt.create('board', { wall: storage.wall.getId(), name: 'Board with color Transform' });
            })
            .then(function( resource ) {
                storage.boards.push( resource );

                var promises = [], board = storage.boards[0];

                promises.push( belt.create('region', { board: board.getId(), label: 'Red Region', value: 1, color: 'red', x: 300, y:50, width:200, height:200 }) );
                promises.push( belt.create('region', { board: board.getId(), label: 'Blue Region', value: 2, color: 'blue', x: 300, y:300, width:200, height:200 }) );

                return RSVP.all( promises );
            })
            .then(function( resources ) {
                storage.regions = resources;

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
