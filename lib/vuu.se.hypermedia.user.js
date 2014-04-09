var RSVP = require('fortune').RSVP
  , passport = require('passport')
  , Auth0 = require('auth0')
  , Mustache = require('mustache')
  , fs = require('fs');

function init( app ) {

  var api = new Auth0({
      domain:       'vuu-se.auth0.com',
      clientID:     'X0n9ZaXJrJgeP9V4KAI7LXsiMsn6jN4G',
      clientSecret: 'KaqyAODoqYM768jZJq8jnRCoQ2wYkwvpiJSgLV-5EUQlUexjpGi2HIFALivpbw2W'
  });

  app.router.get('/login',
      function(req, res, next) {
          if ( req.user ) {
              return res.redirect('/');
          }

          fs.readFile( __dirname + '/templates/users/login.mustache', function (error, data) {
              if ( error ) {
                  return next( new Error( error ? error.toString() : 'Failed to read login template from disk' ) );
              }

              var body = Mustache.render( data.toString(), { } );

              res.send( 200, body );
          });
      });

  app.router.get('/callback',
      passport.authenticate('auth0', { failureRedirect: '/denied' }),
      function( req, res ) {
          if ( !req.user ) {
              throw new Error('user null');
          }

          var user = {
                id: req.user._json.user_id
              , nickname: req.user._json.nickname
              , displayname: req.user._json.displayname
              , picture: req.user._json.picture
          };

          app.queue.emit( 'user:registered', user );

          res.redirect("/");
      });

  app.router.get('/denied',
      function(req, res, next) {
          fs.readFile( __dirname + '/templates/users/denied.mustache', function (error, data) {
              if ( error ) {
                  return next( new Error( error ? error.toString() : 'Failed to read denied template from disk' ) );
              }

              var body = Mustache.render( data.toString(), { } );

              res.send( 200, body );
          });
      });

  app.router.get('/logout',
      function(req, res) {
          req.logout();
          res.redirect('/');
      });

  return {

      search: function( query, limit ) {
          return new RSVP.Promise(function(resolve, reject) {
              api.getSocialUsers(function (err, firstPageOfResults) {
                  if (err) {
                      return reject( err );
                  }

                  resolve( firstPageOfResults );

              });
          });
      },

      get: function( query ) {
          return new RSVP.Promise(function(resolve, reject) {
              api.getUser( query, function(err, user) {
                  if (err) {
                    return reject( err );
                  }

                  resolve( user );

              });
          });
      }

  };

};

module.exports = {
  init: init
}
