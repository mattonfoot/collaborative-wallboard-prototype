var RSVP = require('fortune').RSVP;

function init( app ) {
    var db = app.adapter
      , resource = {
          key: String,
          name: String,
          transform: String,
          wall: 'wall',
          cards: ['card'],
          regions: ['region']
          // , views: [ 'view' ] --> [ 'transform' ]
          // , owner: 'user'
          // , access: [ 'right' ] --> 'user', 'group'
      };

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
                            app.queue.emit( 'board:createfail', {
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
                            app.queue.emit( 'board:updatefail', {
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
                            app.queue.emit( 'board:deletefail', {
                                id: id,
                                err: err
                            });
                        }
                );
        },

        search: function( query, limit ) {
            return db.findMany( 'board', query );
        },

        get: function( id ) {
            return db.find( 'board', id );
        }

    };

    function created( board ) {
        app.queue.emit( 'board:created', board );

        return app.hypermedia.wall
            .get( board.links.wall )
            .then(function( wall ) {
                wall.links.pockets
                    .forEach(function( pocket ) {
                        app.hypermedia.card.create( { pocket: pocket.id, board: board } );
                    });
            });
    }

    function updated( board ) {
        app.queue.emit( 'board:updated', board );
    }

    function deleted( board ) {
        app.queue.emit( 'board:deleted', board );
    }

};

module.exports = {
  init: init
}
