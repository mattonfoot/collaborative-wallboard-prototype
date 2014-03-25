var RSVP = require('fortune').RSVP;







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

                  socket.emit( 'region:moved', region );

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

              socket.emit( 'region:resized', region );

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