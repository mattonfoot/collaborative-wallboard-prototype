var RSVP = require('fortune').RSVP
  , Mustache = require('mustache')
  , fs = require('fs');






// constants
var MIME = {
standard: ['application/vnd.api+json', 'application/json']
},
errorMessages = {
400: 'Request was malformed.',
403: 'Access forbidden.',
404: 'Resource not found.',
405: 'Method not permitted.',
412: 'Request header "Content-Type" must be one of: ' + MIME.standard.join(', '),
500: 'Oops, something went wrong.',
501: 'Feature not implemented.'
};

// response emitters
var sendError = function(req, res, status, error) {
if(!!error) console.trace(error);
var object = {
error: errorMessages[status],
detail: error ? error.toString() : ''
}, str = JSON.stringify(object, null, null);

res.set('Content-Type', MIME.standard[1]);
res.send(status, str);
};

var sendResponse = function(req, res, status, object) {
if(status === 204) return res.send(status);

object = object || {};
if(!!baseUrl) object = appendLinks.call(_this, object);

var str = JSON.stringify(object, null, null);

res.set('Content-Type', !req.get('User-Agent') ? MIME.standard[0] : MIME.standard[1]);
res.send(status, str);
};

var mimeCheck = function(contentType) {
return MIME.standard.indexOf(contentType.split(';').shift().toLowerCase()) >= 0;
};





function init( app ) {
    var db = app.adapter
      , resource = {
          x: Number,
          y: Number,
          width: Number,
          height: Number,
          value: String,
          name: String,
          color: String,
          board: 'board',
          pockets: ['pocket']
      };

app.router.get('/regions/:id/edit', function(req, res, next) {
  var id = req.params.id;

  // get resources by IDs
  app.hypermedia.region
      .get( id )

      // send the response
      .then(function( resource ) {
          var region = resource, body;

          fs.readFile(__dirname + '/templates/regions/edit.mustache', function (error, data) {
              if (error) {
                  return next( new Error( error ? error.toString() : 'Failed to read editor template from disk' ) );
              }

              body = Mustache.render( data.toString(), region );

              res.send( 200, body );
          });
      }, function(error) {
          res.send(403, 'Access forbidden.');
      });
});

app.router.post('/regions/:id/move', function(req, res) {

    // header error handling
    if (!mimeCheck(req.get('content-type'))) {
      return sendError(req, res, 412);
    }

    var id = req.params.id
    , update;

    try {
      update = req.body;
      if (!update) return sendError(req, res, 400);
    } catch(error) {
      return sendError(req, res, 400, error);
    }

    // try to find the resource by ID
    db.find( 'region', id )
      .then(function( data ) {
          update.width = data.width;
          update.height = data.height;
          update.value = data.value;
          update.links = data.links;

          db.update( 'region', id, update )
              .then(function( region ) {
                  var body = {};

                  body['regions'] = [region];

                  app.queue.emit( 'region:moved', region );

                  sendResponse( req, res, 200, body);
              }, function(error) {
                  sendError(req, res, 403, error);
              });
      },

      // resource not found, try to create it
      function( error ) {
          sendError(req, res, 403, error);
      });
});

app.router.post('/regions/:id/resize', function(req, res) {

    // header error handling
    if (!mimeCheck(req.get('content-type'))) {
    return sendError(req, res, 412);
    }

    var id = req.params.id
    , update;

    try {
    update = req.body;
    if (!update) return sendError(req, res, 400);
    } catch(error) {
    return sendError(req, res, 400, error);
    }

    // try to find the resource by ID
    db.find( 'region', id )
    .then(function( data ) {
      update.x = data.x;
      update.y = data.y;
      update.value = data.value;
      update.links = data.links;

      db.update( 'region', id, update )
          .then(function( region ) {
              var body = {};

              body['regions'] = [region];

              app.queue.emit( 'region:resized', region );

              sendResponse( req, res, 200, body);
          }, function(error) {
              sendError(req, res, 403, error);
          });
    },

    // resource not found, try to create it
    function( error ) {
      sendError(req, res, 403, error);
    });
});

    app.resource('region', resource )
        .transform('region', function( request, response ) {
            var region = this
              , name = region.name
              , value = region.value
              , board = region.board
              , id = region.id || request.path.split('/').pop();

            // require a value and board.id
            if ((request.method.toLowerCase() === 'post' || request.method.toLowerCase() === 'put')) {
                  if (!name) {
                      throw new Error( 'Name is required.' );
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
                            app.queue.emit( 'region:createfail', {
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
                            app.queue.emit( 'region:updatefail', {
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
                            app.queue.emit( 'region:deletefail', {
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
        app.queue.emit( 'region:created', region );
    }

    function updated( region ) {
        app.queue.emit( 'region:updated', region );
    }

    function deleted( region ) {
        app.queue.emit( 'region:deleted', region );
    }

};

module.exports = {
  init: init
}
