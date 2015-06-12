var $ = require('jquery')
  , PouchDB = require('pouchdb')
  , Queue = require('./queue')
  , UI = require('./ui')
  , Auth = require('./auth')
  , RSVP = require('rsvp')
  , Promise = RSVP.Promise
  , Application = require('./application');

var $ = $ || function(){ console.log( 'jQuery not loaded.' ); };

var debug = false;

var $dom = $('[data-provides="ui"]');

var auth = new Auth( $dom, {} );
auth.authenticate( 'X0n9ZaXJrJgeP9V4KAI7LXsiMsn6jN4G', 'vuu-se.auth0.com' )
  .then( onAuthenticate )
  .catch( onAuthenticationError )
  .then( onConfigure )
  .catch( onConfigurationError )
  .then( onReplicate )
  .catch( onReplicationError );






function onAuthenticate( profile ) {
  $dom.data( 'profile', profile );

  return new Promise(function( resolve, reject ) {
  $.get( window.location.origin + '/config' )
    .done(function( config ) {
      resolve( config );
    });

  });
}

function onAuthenticationError( err ) {
  console.log( 'AUTH ERROR', err );
}

function onConfigure( config ) {
  var profile = $dom.data( 'profile' );
  var channelName = config.channelName;
  var remotedb = window.location.origin + config.dataURI + '/' + channelName;

  var pouchdb = new PouchDB( channelName +'_'+ profile.user_id );

  var queue = new Queue({
    federate: true,
    db: pouchdb,
    channelName: channelName,
    debug: true,
    clientId: profile.user_id + Date.now()
  });
  $dom.data( 'queue', queue );

  return queue.replicateFromRemote( remotedb );
}

function onConfigurationError( err ) {
  console.log( 'CONFIG ERROR', err );
}

function onReplicate() {
  var queue = $dom.data( 'queue' );
  var ui = new UI( queue, $dom, {}, $ );
  $dom.data( 'ui', ui );

  $dom.data( 'application', new Application( queue, ui, {} ) );

  ui.enable();
}

function onReplicationError( err ) {
  console.log( 'REPLICATION ERROR', err );
}
