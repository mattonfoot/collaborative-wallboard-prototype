var chai = require('chai')
  , should = chai.should()
  , RSVP = require('rsvp')
  , Promise = RSVP.Promise
  , TestQueue = require('../lib/queue.extensions')
  , Application = require('../lib/application')
  , UI = require('../lib/interface');

var debug = false;

var queue = new TestQueue({ debug: debug });
var ui = new UI( queue );
var application = new Application( queue, ui, { debug: debug } );
var belt = application.belt;

/*
  WALL --> NEW, CREATE, SELECT, DISPLAY, EDIT, UPDATE

  BOARD --> NEW, CREATE, SELECT, DISPLAY, EDIT, UPDATE

  CARD --> NEW, CREATE, EDIT, UPDATE, MOVE

  REGION --> NEW, CREATE, EDIT, UPDATE, MOVE, UPDATE

  TRANSFORM --> CREATE, UNLINK
*/

var _this = this;

var features = [
    'wall.new'
  , 'wall.create'
  , 'wall.select'
  , 'wall.select.withMultipleWalls'
  , 'wall.display'
  , 'wall.display.withCompleteBoard'
  , 'wall.edit'
  , 'wall.update'

  , 'board.new'
  , 'board.create'
  , 'board.create.withCompleteBoard'
  , 'board.display'
  , 'board.display.withCompleteBoard'
  , 'board.edit'
  , 'board.update'

  , 'card.create'
//, 'card.move'
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
        }
      };

    features.forEach(function( namespace ) {
        var features = require( './features/' + namespace );

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
        if (debug || this.currentTest.state === 'failed') console.log( queue.getCalls() );

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

        promises.push( belt.create('wall', { name: 'Wall one' }) );
        promises.push( belt.create('wall', { name: 'Wall two' }) );
        promises.push( belt.create('wall', { name: 'Wall three' }) );

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
        belt.create( 'wall', { name: 'Scenario wall' })
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
        belt.create( 'wall', { name: 'Scenario wall' })
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

                promises.push( belt.create('region', { board: board.getId(), label: 'Red Region', value: 1, color: 'red' }) );
                promises.push( belt.create('region', { board: board.getId(), label: 'Blue Region', value: 2, color: 'blue' }) );

                return RSVP.all( promises );
            })
            .then(function( resources ) {
                storage.regions = resources;

                var promises = [];

                promises.push( belt.create('pocket', { wall: storage.wall.getId(), title: 'First Card' }) );
                promises.push( belt.create('pocket', { wall: storage.wall.getId(), title: 'Second Card' }) );

                return RSVP.all( promises );
            })
            .then(function() {
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

    queue.length.should.equal( len, 'expected number of queued event to equal ' + len + '\n'  );

    for (; i < len; i++) {
        queue[i].event.should.equal( events[i], 'expected queued event ' + i + ' to equal ' + events[i] + '\n' );
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
}

chai.Assertion.addMethod('specificCardResource', shouldBeSpecificCardResource);

function shouldBeSpecificCardResource( expectedTitle, expectedWallId ) {
    var resource = this._obj;

    resource.should.respondTo( 'getId' );
    resource.should.respondTo( 'getTitle' );
    resource.getTitle().should.equal( expectedTitle );
    resource.should.respondTo( 'getWall' );
    resource.getWall().should.equal( expectedWallId );
}
