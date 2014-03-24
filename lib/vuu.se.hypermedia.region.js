var RSVP = require('fortune').RSVP;

function init( app, io ) {
    var db = app.adapter
      , socket
      , resource = {
          x: Number,
          y: Number,
          width: Number,
          height: Number,
          value: String,
          board: 'board'
      };

    io.sockets
        .on( 'connection', function( s ) {
            socket = s;
        });

    app.resource('region', resource )
        .transform('region', function( request, response ) {
            var region = this
              , value = region.value
              , board = region.board
              , id = region.id || request.path.split('/').pop();

            // require a value and board.id
            if ((request.method.toLowerCase() === 'post' || request.method.toLowerCase() === 'put')) {
                  if (!value) {
                      throw new Error( 'Value is required.' );
                  }

                  if (!board) {
                      throw new Error( 'Board ID is required.' );
                  }
            }

            return region;
        },

        function( request, response ) {
            var region = this;

            if (request.method.toLowerCase() === 'post') {
                created( region );
            }

            if (request.method.toLowerCase() === 'put') {
                updated( region );
            }

            if (request.method.toLowerCase() === 'delete') {
                deleted( region );
            }

            return region;
        });

    return {

        create: function( data ) {
            var obj = { name: data.name };

            return db.create( 'region', obj )
                .then(  created,
                        function( err ) {
                            socket.emit( 'region:createfail', {
                                data: data,
                                err: err
                            });
                        }
                );
        },

        update: function( data ) {
            var regionid =  data.id;

            return db.update( 'region', regionid, data )
                .then(  updated,
                        function( err ) {
                            socket.emit( 'region:updatefail', {
                                data: data,
                                err: err
                            });
                        }
                );
        },

        delete: function( id ) {
            return db.delete( 'region', id )
                .then(  deleted,
                        function( err ) {
                            socket.emit( 'region:deletefail', {
                                id: id,
                                err: err
                            });
                        }
                );
        },

        search: function( query, limit ) {
            return db.findMany( 'region', query, limit );
        },

        get: function( query ) {
            return db.find( 'region', query );
        }

    };

    function created( region ) {
        socket.emit( 'region:created', region );
    }

    function updated( region ) {
        socket.emit( 'region:updated', region );
    }

    function deleted( region ) {
        socket.emit( 'region:deleted', region );
    }

};

module.exports = {
  init: init
}
