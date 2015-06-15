var RSVP = require('rsvp'),
    Promise = RSVP.Promise
    Auth0Lock = require('auth0-lock');

function Auth( $element, options ) {
  this.$element = $element;

  this.constructor = Auth;

  var auth = this;
  $element.on( 'click touch', '[data-auth="logout"]', function( ev ) {
      ev.preventDefault();

      auth.logoutUser();
  });
}

Auth.prototype.authenticate = function( clientid, authdomain ) {
  var auth = this;

  var lock = new Auth0Lock( clientid, authdomain );

  return new Promise(function( resolve, reject ) {
    var hash = lock.parseHash( window.location.hash );

    if ( hash ) {
      return onParseHash( hash.error, hash.id_token );
    }

    lock.show({
      closable: false,
      focusInput: true,
      authParams: { scope: 'openid' }
    });

    function onParseHash( err, token ) {
      if ( err )  return reject( err );

      auth.storeToken( token );

      lock.getProfile( token, onGetProfile );
    }

    function onGetProfile( err, profile ) {
      if ( err )  return reject( err );

      // look up existing user
      // if user does not exist create a new user, notify of new user creation, return new profile

      // attach profile
      auth.attachProfile( profile );

      // notify of successful login
      resolve( profile );
    }
  });
}

Auth.prototype.storeToken = function( token ) {
  localStorage.setItem( 'auth.token', token );
}

Auth.prototype.attachProfile = function( profile ) {
  this.profile = profile;

  this.$element.find('[data-profile="user"]').text( profile.nickname );
}

Auth.prototype.logoutUser = function() {
  localStorage.removeItem( 'auth.token' );

  this.profile = null;

  window.location.href = "/";
}

module.exports = Auth;
