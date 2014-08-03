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
var services = application.services;

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
//, 'wall.select'   // two features need implementing
  , 'wall.display'
  , 'wall.edit'
  , 'wall.update'
  , 'board.new'
  , 'board.create'  // second feature with cards already needs implementing
//, 'board.select'
//, 'board.display'
  , 'board.edit'
//, 'board.update'
//, 'card.move'
];

Fixture('Application service API Features', function() {
    var fixture = {
        debug: debug
      , queue: queue
      , application: application
    };

    features.forEach(function( namespace ) {
        var features = require( './features/' + namespace );

        if (!features.length) {
            features = [ features ];
        }

        features.forEach(function( feature ) {
            Feature( feature.title, function() { feature.call( fixture ); } );
        });
    });

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
