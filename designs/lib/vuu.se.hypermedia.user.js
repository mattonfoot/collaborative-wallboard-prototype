var RSVP = require('fortune').RSVP
  , passport = require('passport')
  , Auth0 = require('auth0')
  , Mustache = require('mustache')
  , fs = require('fs');

function init( app, auth0config ) {
  var api = new Auth0({
      domain:       auth0config.domain,
      clientID:     auth0config.clientID,
      clientSecret: auth0config.clientSecret
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

              var body = Mustache.render( data.toString(), { auth0: auth0config } );

              res.send( 200, body );
          });
      });

  app.router.get('/callback',
      passport.authenticate('auth0', { failureRedirect: '/denied' }),
      function( req, res ) {
          if ( !req.user && !req.user._json ) {
              throw new Error('user null');
          }

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

  app.router.get('/users',
      function(req, res, next) {
          if (!req.user) {
              res.redirect('/login');
          }

          app.hypermedia.user
              .search()
              .then(function( users ) {
                  fs.readFile( __dirname + '/templates/users/index.mustache', function (error, data) {
                      if ( error ) {
                          return next( new Error( error ? error.toString() : 'Failed to read index template from disk' ) );
                      }

                      var body = Mustache.render( data.toString(), { user: req.user, users: users, raw: JSON.stringify( users, 2, 0 ), auth0: auth0config } );

                      res.send( 200, body );
                  });
          });
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
