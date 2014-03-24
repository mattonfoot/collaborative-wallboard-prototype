var RSVP = require('fortune').RSVP;

function init( app, io ) {
    var db = app.adapter
      , socket
      , resource = {
          key: String,
          wall: 'wall',
          cards: ['card'],
          regions: ['region']
      };

    io.sockets
        .on( 'connection', function( s ) {
            socket = s;
        });

    app.resource('board', resource )
        .transform('board', function( request, response ) {
            var board = this
              , key = board.key
              , wall = board.wall
              , id = board.id || request.path.split('/').pop();

            // require a key and wall.id
            if ((request.method.toLowerCase() === 'post' || request.method.toLowerCase() === 'put')) {
                  if (!key) {
                      throw new Error( 'Key is required.' );
                  }

                  if (!wall) {
                      throw new Error( 'Wall ID is required.' );
                  }
            }

            // do we need to validate the existence of a wall?

            return board;
        },

        function( request, response ) {
            var board = this;

            if (request.method.toLowerCase() === 'post') {
                created( board );

                // create cards for the board from the existing walls pockets
            }

            if (request.method.toLowerCase() === 'put') {
                updated( board );
            }

            if (request.method.toLowerCase() === 'delete') {
                // delete cards associated with this board
                // delete regions associated with this board

                deleted( board );
            }

            return this;
        });

    return {

        create: function( data ) {
            var obj = { name: data.name };

            return db.create( 'board', obj )
                .then(  created,
                        function( err ) {
                            socket.emit( 'board:createfail', {
                                data: data,
                                err: err
                            });
                        }
                );
        },

        update: function( data ) {
            var boardid =  data.id;

            return db.update( 'board', boardid, data )
                .then(  updated,
                        function( err ) {
                            socket.emit( 'board:updatefail', {
                                data: data,
                                err: err
                            });
                        }
                );
        },

        delete: function( id ) {
            return db.delete( 'board', id )
                .then(  deleted,
                        function( err ) {
                            socket.emit( 'board:deletefail', {
                                id: id,
                                err: err
                            });
                        }
                );
        },

        search: function( query, limit ) {
            return db.findMany( 'board', query );
        },

        get: function( query ) {
            return db.find( 'board', query );
        }

    };

    function created( board ) {
        socket.emit( 'board:created', board );
    }

    function updated( board ) {
        socket.emit( 'board:updated', board );
    }

    function deleted( board ) {
        socket.emit( 'board:deleted', board );
    }

};

module.exports = {
  init: init
}
