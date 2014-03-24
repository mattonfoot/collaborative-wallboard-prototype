var RSVP = require('fortune').RSVP;

function init( app, io ) {
  var db = app.adapter
    , socket
    , resource = {
        name: String,
        boards: ['board'],
        pockets: ['pocket']
    };

  io.sockets
      .on( 'connection', function( s ) {
          socket = s;
      });

  app.resource('wall', resource )
      .transform('wall', function( request, response ) {
          var wall = this
            , name = wall.name
            , id = wall.id || request.path.split('/').pop();

          // require a name
          if ((request.method.toLowerCase() === 'post' || request.method.toLowerCase() === 'put') && !name) {
              throw new Error( 'Name is required.' );
          }

          return wall;
      },

      function( request, response ) {
          var wall = this;

          if (request.method.toLowerCase() === 'post') {
              created( wall );
          }

          if (request.method.toLowerCase() === 'put') {
              updated( wall );
          }

          if (request.method.toLowerCase() === 'delete') {
              // delete boards associated with this wall
              // delete pockets associated with this wall

              deleted( wall );
          }

          return wall;
      });

  return {

      create: function( data ) {
          var obj = { name: data.name };

          return db.create( 'wall', obj )
              .then(  created,
                      function( err ) {
                          socket.emit( 'wall:createfail', {
                              data: data,
                              err: err
                          });
                      }
              );
      },

      update: function( data ) {
          var wallid =  data.id;

          return db.update( 'wall', wallid, data )
              .then(  updated,
                      function( err ) {
                          socket.emit( 'wall:updatefail', {
                              data: data,
                              err: err
                          });
                      }
              );
      },

      delete: function( id ) {
          return db.delete( 'wall', id )
              .then(  deleted,
                      function( err ) {
                          socket.emit( 'wall:deletefail', {
                              id: id,
                              err: err
                          });
                      }
              );
      },

      search: function( query, limit ) {
          return db.findMany( 'wall', query );
      },

      get: function( query ) {
          return db.find( 'wall', query );
      }

  };

  function created( wall ) {
      socket.emit( 'wall:created', wall );
  }

  function updated( wall ) {
      socket.emit( 'wall:updated', wall );
  }

  function deleted( wall ) {
      socket.emit( 'wall:deleted', wall );
  }

};

module.exports = {
  init: init
}
