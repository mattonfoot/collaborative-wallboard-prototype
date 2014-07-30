function init( passport, Auth0Strategy, config ) {
    var strategy = new Auth0Strategy({
          domain:       config.domain,
          clientID:     config.clientID,
          clientSecret: config.clientSecret,
          callbackURL:  config.callbackURL
        },
        function(accessToken, refreshToken, profile, done) {
            // console.trace( '>>> PASSPORT STRATEGY: profile is', profile );

            return done(null, profile);
        });

    passport.use( strategy );

    // This is not a best practice, but we want to keep things simple for now
    passport.serializeUser(function( user, done ) {
        done( null, user );
    });

    passport.deserializeUser(function( user, done ) {
        done( null, user );
    });

    return passport;
};

module.exports = {
    init: init
}
