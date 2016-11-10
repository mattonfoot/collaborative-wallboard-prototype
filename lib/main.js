var $ = require('jquery')
  , PouchDB = require('pouchdb')
  , Queue = require('./queue')
  , UI = require('./ui')
  , Auth = require('./auth')
  , Application = require('./application');

var $ = $ || function(){ console.log( 'jQuery not loaded.' ); };

var debug = false;

var $dom = $('[data-provides="ui"]');

var auth = new Auth( $dom, {} );
auth.authenticate( 'X0n9ZaXJrJgeP9V4KAI7LXsiMsn6jN4G', 'vuu-se.auth0.com' )
    .catch( onAuthenticationError )
    .then( configure )
    .catch( onConfigurationError )
    .then( setupQueue )
    .catch( onSetupQueueError )
    .then( replicate )
    .catch( onReplicationError )
    .then( initialize )
    .catch( onInitializationError );


function onAuthenticationError( err ) {
  console.log( 'AUTHENTICATION ERROR', err );
}

function configure( profile ) {
  var config = {
    clientId: profile.user_id,
    profile: profile
  };

  return new Promise(function( resolve, reject ) {
    $.get( window.location.origin + '/config' )
      .done(function( options ) {
        config.channelName = options.channelName;
        config.remotedb = window.location.origin + options.dataURI + '/' + options.channelName;

        $dom.data( 'config', config );

        resolve( config );
      });
  });
}

function onConfigurationError( err ) {
  console.log( 'CONFIGURATION ERROR', err );
}

function setupQueue( config ) {
  var pouchdb = new PouchDB( config.channelName +'_'+ config.clientId );

  var queue = new Queue({
    federate: true,
    db: pouchdb,
    channelName: config.channelName,
    debug: true,
    clientId: config.clientId + Date.now()
  });
  $dom.data( 'queue', queue );

  return config;
}

function onSetupQueueError( err ) {
  console.log( 'SETUP QUEUE ERROR', err );
}

function replicate( config ) {
  var queue = $dom.data( 'queue' );

  return queue.syncEventStreams( config.remotedb );
}

function onReplicationError( err ) {
  console.log( 'REPLICATION ERROR', err );
}

function initialize( config ) {
  var queue = $dom.data( 'queue' );

  var ui = new UI( queue, $dom, {}, $ );
  $dom.data( 'ui', ui );

  $dom.data( 'application', new Application( queue, ui, {} ) );

  ui.enable();
}

function onInitializationError( err ) {
  console.log( 'INITIALIZATION ERROR', err.message );
  console.log( err.stack );
}
