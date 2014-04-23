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
    if (status === 204) return res.send(status);

    object = object || {};

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
          tagged: String,
          board: 'board',
          pocket: 'pocket'
        , createdBy: 'user'
        , createdOn: Date
        , lastModifiedBy: 'user'
        , lastModifiedOn: Date
      };



app.router.post('/cards/:id/move', function(req, res) {
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
    db.find( 'card', id )
      .then(function( data ) {
          update.tagged = data.tagged;
          update.links = data.links;

          db.update( 'card', id, update )
              .then(function( card ) {
                  var body = {};

                  body['cards'] = [card];

                  sendResponse( req, res, 200, body);

                  app.queue.emit( 'card:moved', card );
              }, function(error) {
                  sendError(req, res, 403, error);
              });
      },

      // resource not found
      function( error ) {
          sendError(req, res, 403, error);
      });
});

    app.resource('card', resource )
        .transform('card', function( request, response ) {
            var card = this
              , board = card.board
              , pocket = card.pocket
              , id = card.id || request.path.split('/').pop();

            if (request.method.toLowerCase() === 'post') {
                card.createdBy = request.user._json.user_id;
                card.createdOn = new Date();
            }

            if (request.method.toLowerCase() === 'put') {
                card.lastModifiedBy = request.user._json.user_id;
                card.lastModifiedOn = new Date();
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
            var obj = {
                x: 0,
                y: 0,
                tagged: false,
                board: data.board,
                pocket: data.pocket
            };

            return db.create( 'card', obj )
                .then(  created,
                        function( err ) {
                            app.queue.emit( 'card:createfail', {
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
                            app.queue.emit( 'card:updatefail', {
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
                            app.queue.emit( 'card:deletefail', {
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
        app.queue.emit( 'card:created', card );

        return card;
    }

    function updated( card ) {
        app.queue.broadcast.emit( 'card:updated', card );

        return card;
    }

    function deleted( card ) {
        app.queue.broadcast.emit( 'card:deleted', card );

        return card;
    }

};

module.exports = {
    init: init
}
