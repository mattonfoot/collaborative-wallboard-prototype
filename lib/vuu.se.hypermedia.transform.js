var RSVP = require('fortune').RSVP
  , queryPhraseParser = require('./vuu.se.queryPhraseParser');


function init( app ) {
    var db = app.adapter
      , resource = {
          phrase: String
        , rules: Object
        , board: 'board'
        , createdBy: 'user'
        , createdOn: Date
        , lastModifiedBy: 'user'
        , lastModifiedOn: Date
      };

    app.resource('transform', resource )
        .transform('transform', function( request, response ) {
            var transform = this
              , phrase = transform.phrase
              , board = transform.board
              , id = transform.id || request.path.split('/').pop();

            transform.rules = queryPhraseParser( phrase );

            if (request.method.toLowerCase() === 'post') {
                transform.createdBy = request.user._json.user_id;
                transform.createdOn = new Date();
            }

            if (request.method.toLowerCase() === 'put') {
                transform.lastModifiedBy = request.user._json.user_id;
                transform.lastModifiedOn = new Date();
            }

            return transform;
        },

        function( request, response ) {
            var transform = this;

            if (request.method.toLowerCase() === 'post') {
                created( transform );
            }

            if (request.method.toLowerCase() === 'put') {
                updated( transform );
            }

            if (request.method.toLowerCase() === 'delete') {
                deleted( transform );
            }

            return this;
        });

    return {

        create: function( data ) {
            var obj = {
                phrase: data.phrase
              , rules: queryPhraseParser( data.phrase )
              , board: data.board
            };

            return db.create( 'transform', obj )
                .then(  created,
                        function( err ) {
                            app.queue.emit( 'transform:createfail', {
                                data: data,
                                err: err
                            });
                        }
                );
        },

        update: function( data ) {
            var transformid =  data.id;

            return db.update( 'transform', transformid, data )
                .then(  updated,
                        function( err ) {
                            app.queue.emit( 'transform:updatefail', {
                                data: data,
                                err: err
                            });
                        }
                );
        },

        delete: function( id ) {
            return db.delete( 'transform', id )
                .then(  deleted,
                        function( err ) {
                            app.queue.emit( 'transform:deletefail', {
                                id: id,
                                err: err
                            });
                        }
                );
        },

        search: function( query, limit ) {
            return db.findMany( 'transform', query );
        },

        get: function( id ) {
            return db.find( 'transform', id );
        }

    };

    function created( transform ) {
        app.queue.emit( 'transform:created', transform );
    }

    function updated( transform ) {
        app.queue.emit( 'transform:updated', transform );
    }

    function deleted( transform ) {
        app.queue.emit( 'transform:deleted', transform );
    }

};

module.exports = {
  init: init
}
