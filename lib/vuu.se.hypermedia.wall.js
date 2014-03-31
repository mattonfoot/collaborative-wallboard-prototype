var RSVP = require('fortune').RSVP;

function init( app ) {
  var db = app.adapter
    , resource = {
        name: String,
        boards: ['board'],
        pockets: ['pocket']
        // , owner: 'user'
        // , access: [ 'right' ] --> 'user', 'group'
    };

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
                          app.queue.emit( 'wall:createfail', {
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
                          app.queue.emit( 'wall:updatefail', {
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
                          app.queue.emit( 'wall:deletefail', {
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
      app.queue.emit( 'wall:created', wall );
  }

  function updated( wall ) {
      app.queue.emit( 'wall:updated', wall );
  }

  function deleted( wall ) {
      app.queue.emit( 'wall:deleted', wall );
  }

};

module.exports = {
  init: init
}
