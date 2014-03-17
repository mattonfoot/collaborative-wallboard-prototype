var should = require('chai').should();

describe('Given that a new Card will be added to a specific board', function() {

    var EventQueue = require('../designs/lib/vuu.se.eventqueue.js');
    var Card = require('../designs/lib/models/vuu.se.card.js');
    var Command = require('../designs/lib/commands/vuu.se.card.create.js');

    var queue = new EventQueue();

    var app = {
        wall: {
            getBoardById: function() {
                return {
                    addCard: function( data ) {
                      return true;  // emulate successful board add
                    }
                };
            }
        }
    };

    var outputs =[], events = [];

    [ 'created', 'added', 'moved' ]
        .forEach(function( ev ) {
            queue.on( {}, 'card:'+ ev, function( data ) {
                outputs.push( data );
                events.push( ev );
            });
        });

    Command.initialize( app, queue, Card );

    describe('When the "card:create" event is triggered', function() {

         var cardId = 1
           , boardId = 2
           , posX = 3
           , posY = 4;

        var data = {
            id: cardId,
            links: {
                board: {
                    id: boardId
                }
            },
            x: posX,
            y: posY,

        };

        queue.trigger( {}, 'card:create', data );

        it('Then the correct series of events will be triggered', function() {
            events.should.eql([ 'created', 'added', 'moved' ]);
        });

        it('And each event will receive the new Card object', function() {
            outputs[0].card.should.equal(outputs[1].card);
            outputs[1].card.should.equal(outputs[2].card);
        });

        it('And the new Card object will have the correct property values', function() {
            var output = outputs[0].card;

            should.exist( output );
            output.should.have.property('id').that.is.equal( cardId );
            output.should.have.deep.property('links.board.id').that.is.equal( boardId );
            output.should.have.property('x').that.is.equal( posX );
            output.should.have.property('y').that.is.equal( posY );
        });

    });

});

describe('Given that a new Card will fail to be added to a specific board', function() {

    var EventQueue = require('../designs/lib/vuu.se.eventqueue.js');
    var Card = require('../designs/lib/models/vuu.se.card.js');
    var Command = require('../designs/lib/commands/vuu.se.card.create.js');

    var queue = new EventQueue();

    var app = {
        wall: {
            getBoardById: function() {
                return {
                    addCard: function( data ) {
                      return false;  // emulate failed board add
                    }
                };
            }
        }
    };

    var outputs = [], events = [];

    [ 'created', 'added', 'moved' ]
        .forEach(function( ev ) {
            queue.on( {}, 'card:'+ ev, function( data ) {
                outputs.push( data );
                events.push( ev );
            });
        });

    Command.initialize( app, queue, Card );

    describe('When the "card:create" event is triggered', function() {

         var cardId = 1
           , boardId = 2
           , posX = 3
           , posY = 4;

        var data = {
            id: cardId,
            links: {
                board: {
                    id: boardId
                }
            },
            x: posX,
            y: posY,

        };

        queue.trigger( {}, 'card:create', data );

        it('Then the correct series of events will be triggered', function() {
            events.should.eql([ 'created' ]);
        });

        it('And the new Card object will have the correct property values', function() {
            var output = outputs[0].card;

            should.exist( output );
            output.should.have.property('id').that.is.equal( cardId );
            output.should.have.deep.property('links.board.id').that.is.equal( boardId );
            output.should.have.property('x').that.is.equal( posX );
            output.should.have.property('y').that.is.equal( posY );
        });

    });

});
