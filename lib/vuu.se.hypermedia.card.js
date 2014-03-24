var RSVP = require('fortune').RSVP;

function init( app, io ) {
    var db = app.adapter
      , socket
      , resource = {
          x: Number,
          y: Number,
          tagged: String,
          board: 'board',
          pocket: 'pocket'
      };

    io.sockets
        .on( 'connection', function( s ) {
            socket = s;
        });

    app.resource('card', resource )
        .transform('card', function( request, response ) {
            var card = this
              , board = card.board
              , pocket = card.pocket
              , id = card.id || request.path.split('/').pop();

            // require a board.id and a pocket.id
            if ((request.method.toLowerCase() === 'post' || request.method.toLowerCase() === 'put')) {
                if (!board) {
                    throw new Error( 'Board ID is required.' );
                }
                if (!pocket) {
                    throw new Error( 'Pocket ID is required.' );
                }
            }

            return card;
        },

        function( request, response ) {
            var card = this;

            if (request.method.toLowerCase() === 'post') {
                created( card );
            }

            if (request.method.toLowerCase() === 'put') {
                updated( card );
            }

            if (request.method.toLowerCase() === 'delete') {
                deleted( card );
            }

            return card;
        });

    return {

        create: function( data ) {
            var obj = { name: data.name };

            return db.create( 'card', obj )
                .then(  created,
                        function( err ) {
                            socket.emit( 'card:createfail', {
                                data: data,
                                err: err
                            });
                        }
                );
        },

        update: function( data ) {
            var cardid =  data.id;

            return db.update( 'card', cardid, data )
                .then(  updated,
                        function( err ) {
                            socket.emit( 'card:updatefail', {
                                data: data,
                                err: err
                            });
                        }
                );
        },

        delete: function( id ) {
            return db.delete( 'card', id )
                .then(  deleted,
                        function( err ) {
                            socket.emit( 'card:deletefail', {
                                id: id,
                                err: err
                            });
                        }
                );
        },

        search: function( query, limit ) {
            return db.findMany( 'card', query );
        },

        get: function( query ) {
            return db.find( 'card', query );
        }

    };

    function created( card ) {
        socket.emit( 'card:created', card );
    }

    function updated( card ) {
        socket.emit( 'card:updated', card );
    }

    function deleted( card ) {
        socket.emit( 'card:deleted', card );
    }

};

module.exports = {
    init: init
}
