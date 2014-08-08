var chai = require('chai')
  , should = chai.should()
  , RSVP = require('rsvp')
  , Promise = RSVP.Promise
  , ExecutionTimer = require('./executionTimer')
  , TestQueue = require('../lib/queue.extensions')
  , Application = require('../lib/application')
  , UI = require('../lib/interface');

var debug = false;

var queue = new TestQueue({ debug: debug });
var ui = new UI( queue );
var application = new Application( queue, ui, { debug: debug } );
var belt = application.belt;
/*
ExecutionTimer( application.commands, 'Commands' );
ExecutionTimer( application.queries, 'Queries' );
ExecutionTimer( application.interface, 'Interface' );
*/

/*
  CARD --> NEW, EDIT, UPDATE

  REGION --> NEW, EDIT, UPDATE, UPDATE

  TRANSFORM --> CREATE, UNLINK
*/

var _this = this;

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

  , require( './features/card.create' )
  , require( './features/card.create.withMultipleBoard' )
  , require( './features/card.create.toDisplayedBoardOFMultipleBoards' )
  , require( './features/card.move.intoEmptyArea' )
  , require( './features/card.move.overARegion' )
  , require( './features/card.move.onABoardWithATransform' )

  , require( './features/region.create' )
  , require( './features/region.move.intoEmptyArea' )
  , require( './features/region.move.UnderACard' )
];

Fixture('Application service API Features', function() {
    var featureSet = {}
      , fixture = {
          debug: debug
        , queue: queue
        , application: application
        , scenarios: {
            TwoBoardsOneWithRegions: setupPopulatedBoardScenario
          , OneEmptyBoard: setupEmptyBoardScenario
          , multipleWalls: setupMultipleWallScenario
          , colorChangingBoard: setupColorChangingBoardScenario
        }
      };

    features.forEach(function( features ) {
        if (!features.length) {
            features = [ features ];
        }

        features.forEach(function( feature ) {
            featureSet[feature.title] = featureSet[feature.title] || [];

            featureSet[feature.title].push( feature );
        });
    });

    for (var title in featureSet) {
        Feature( title, generateCallList( featureSet[title] ) );
    }

    function generateCallList( calls ) {
        return function() {
            calls.forEach(function(feature ) {
                feature.call( fixture );
            });
        };
    }

    afterEach(function (done) {
        if (this.currentTest.state === 'failed') console.log( queue.getCalls() );

        queue.clearCalls();
        application.startListening();
/*
        var promises =[];

        [ 'region', 'cardlocation', 'pocket', 'board', 'wall' ]
            .forEach(function( schema ) {
                var promise = belt.findMany( schema )
                    .then(function( resources ) {
                        if (!resources.length) return;

                        var promises = resources.map(function( resource ) {
                            return new Promise(function(resolve, reject) {
                                belt.delete( schema, resource.getId() )
                                    .then(function() {
                                        resolve();
                                    })
                                    .catch( reject );
                            });
                        });

                        return RSVP.all( promises );
                    });

                promises.push( promise );
            });

        RSVP.all( promises )
            .then(function() {
                queue.clearCalls();
                application.startListening();

                done();
            })
            .catch( done );
        */

        done();
    });

    after(function() {
        ExecutionTimer.process();
    });
});

// helpers

function Fixture( title, fn ) {
    describe( underline( title, '=', 2, '\n' ), fn );
}

function Feature( title, fn ) {
    describe( underline( title, '-', 4, '' ), fn );
}

function underline( title, format, indent, endWith ) {
    return title + '\n' +
        new Array( indent + 1 ).join( ' ' ) +
        new Array( title.length + 1 ).join( format ) +
        endWith;
}




// setup routines

function setupMultipleWallScenario() {
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
            }, reject)
            .catch( reject );
    });
}

function setupEmptyBoardScenario() {
    application.pauseListening();

    return new Promise(function( resolve, reject ) {
        var storage = {};

        // one wall
        belt.create( 'wall', { name: 'Empty Board Scenario' })
            .then(function( resource ) {
                storage.wall = resource;

                var promises = [];

                promises.push( belt.create('board', { wall: storage.wall.getId(), name: 'Empty Board' }) );

                return RSVP.all( promises );
            })
            .then(function( resources ) {
                storage.boards = resources;

                application.startListening();

                resolve( storage );
            }, reject)
            .catch( reject );
    });
}

function setupPopulatedBoardScenario() {
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
            }, reject)
            .catch( reject );
    });
}

function setupColorChangingBoardScenario() {
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
            }, reject)
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
