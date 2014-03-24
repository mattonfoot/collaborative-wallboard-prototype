var RSVP = require('fortune').RSVP;

function init( app, io ) {
  var db = app.adapter
    , socket
    , resource = {
        title: String,
        cardnumber: Number,
        color: String,
        wall: 'wall',
        cards: ['card']
    };

  io.sockets
      .on( 'connection', function( s ) {
          socket = s;
      });

  app.resource('pocket', resource )
      .transform('pocket', function( request, response ) {
          var pocket = this
            , title = pocket.title
            , wall = pocket.wall
            , id = pocket.id || request.path.split('/').pop();

          // require a title and wall.id
          if ((request.method.toLowerCase() === 'post' || request.method.toLowerCase() === 'put')) {
                if (!title) {
                    throw new Error( 'Title is required.' );
                }

                if (!wall) {
                    throw new Error( 'Wall ID is required.' );
                }
          }

          return pocket;
      },

      function( request, response ) {
          var pocket = this;

          if (request.method.toLowerCase() === 'post') {
              created( pocket );

              // create cards for the pocket from the existing walls boards
          }

          if (request.method.toLowerCase() === 'put') {
              updated( pocket );
          }

          if (request.method.toLowerCase() === 'delete') {
              // delete cards associated with this pocket

              deleted( pocket );
          }

          return pocket;
      });

  return {

      create: function( data ) {
          var obj = { title: data.title };

          return db.create( 'pocket', obj )
              .then(  created,
                      function( err ) {
                          socket.emit( 'pocket:createfail', {
                              data: data,
                              err: err
                          });
                      }
              );
      },

      update: function( data ) {
          var pocketid =  data.id;

          return db.update( 'pocket', pocketid, data )
              .then(  updated,
                      function( err ) {
                          socket.emit( 'pocket:updatefail', {
                              data: data,
                              err: err
                          });
                      }
              );
      },

      delete: function( id ) {
          return db.delete( 'pocket', id )
              .then(  deleted,
                      function( err ) {
                          socket.emit( 'pocket:deletefail', {
                              id: id,
                              err: err
                          });
                      }
              );
      },

      search: function( query, limit ) {
          return db.findMany( 'pocket', query );
      },

      get: function( query ) {
          return db.find( 'pocket', query );
      }

  };

  function created( pocket ) {
      socket.emit( 'pocket:created', pocket );
  }

  function updated( pocket ) {
      socket.emit( 'pocket:updated', pocket );
  }

  function deleted( pocket ) {
      socket.emit( 'pocket:deleted', pocket );
  }

};

module.exports = {
  init: init
}
