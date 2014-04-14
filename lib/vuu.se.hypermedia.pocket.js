var RSVP = require('fortune').RSVP
  , Mustache = require('mustache')
  , fs = require('fs');

function init( app ) {
  var db = app.adapter
    , resource = {
        title: String,
        cardnumber: Number,
        content: String,     // [ 'fragment' ]
        tags: String,        // [ 'tag' ]
        mentions: String,    // [ 'mention' ] --> 'user', 'group'
        wall: 'wall',
        cards: ['card'],
        regions: ['region']
        // , owner: 'user'
    };

  app.router.get('/pockets/:id/edit', function(req, res, next) {
    var id = req.params.id;

    // get resources by IDs
    app.hypermedia.pocket
        .get( id )

        // send the response
        .then(function( resource ) {
            var pocket = resource, body;

            fs.readFile(__dirname + '/templates/pockets/edit.mustache', function (error, data) {
                if (error) {
                    return next( new Error( error ? error.toString() : 'Failed to read editor template from disk' ) );
                }

                body = Mustache.render( data.toString(), pocket );

                res.send( 200, body );
            });
        }, function(error) {
            res.send(403, 'Access forbidden.');
        });
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
                          app.queue.emit( 'pocket:createfail', {
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
                          app.queue.emit( 'pocket:updatefail', {
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
                          app.queue.emit( 'pocket:deletefail', {
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
      app.queue.emit( 'pocket:created', pocket );

      return app.hypermedia.wall
          .get( pocket.links.wall )
          .then(function( wall ) {
              wall.links.boards
                  .forEach(function( board ) {
                      app.hypermedia.card.create( { pocket: pocket.id, board: board } );
                  });
          });
  }

  function updated( pocket ) {
      app.queue.emit( 'pocket:updated', pocket );
  }

  function deleted( pocket ) {
      app.queue.emit( 'pocket:deleted', pocket );
  }

};

module.exports = {
  init: init
}
