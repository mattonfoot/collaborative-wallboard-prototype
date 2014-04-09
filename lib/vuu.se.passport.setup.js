var passport = require('passport');
var Auth0Strategy = require('passport-auth0');

var strategy = new Auth0Strategy({
    domain:       'vuu-se.auth0.com',
    clientID:     'X0n9ZaXJrJgeP9V4KAI7LXsiMsn6jN4G',
    clientSecret: 'KaqyAODoqYM768jZJq8jnRCoQ2wYkwvpiJSgLV-5EUQlUexjpGi2HIFALivpbw2W',
    callbackURL:  '/callback'
  }, function(accessToken, refreshToken, profile, done) {

    //Some tracing info
    console.trace( '>>> PASSPORT STRATEGY: profile is', profile );

    return done(null, profile);
  });

passport.use( strategy );

// This is not a best practice, but we want to keep things simple for now
passport.serializeUser(function(user, done) {
  done( null, user );
});

passport.deserializeUser(function(user, done) {
  done( null, user );
});

module.exports = strategy;
