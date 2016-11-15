var $ = require('jquery');
var PouchDB = require('pouchdb');
var Queue = require('./queue');
var UI = require('./ui');
var Auth = require('./auth');
var Application = require('./application');

var $ = $ || (() => console.log( 'jQuery not loaded.' ));
var $dom = $('[data-provides="ui"]');

const handleError = (t) => ( err ) => {
  console.log( t, err.message );
  console.log( err.stack );
};

const configure = ( profile ) => {
  var config = {
    clientId: profile.user_id,
    profile: profile
  };

  return new Promise(function( resolve /*, reject */ ) {
    $.get( window.location.origin + '/config' )
      .done(function( options ) {
        config.channelName = options.channelName;
        config.remotedb = window.location.origin + options.dataURI + '/' + options.channelName;

        $dom.data( 'config', config );

        resolve( config );
      });
  });
};

const setupQueue = ( config ) => {
  $dom.data( 'queue', new Queue({
    federate: true,
    db: new PouchDB( config.channelName +'_'+ config.clientId ),
    channelName: config.channelName,
    debug: false,
    clientId: config.clientId
  }));

  return config;
};

const replicate = ( config ) => {
  $dom.data( 'queue' ).syncEventStreams( config.remotedb );

  return config;
};

const initialize = ( config ) => {
  var queue = $dom.data( 'queue' );
  var ui = new UI( queue, $dom, {}, $ );

  $dom.data( 'ui', ui );
  $dom.data( 'application', new Application( queue, ui, {} ) );

  ui.enable();

  return config;
};

var auth = new Auth( $dom, {} );
auth.authenticate( 'X0n9ZaXJrJgeP9V4KAI7LXsiMsn6jN4G', 'vuu-se.auth0.com' )
    .catch( handleError('AUTHENTICATION ERROR') )
    .then( configure )
    .catch( handleError('CONFIGURATION ERROR') )
    .then( setupQueue )
    .catch( handleError('SETUP QUEUE ERROR') )
    .then( replicate )
    .catch( handleError('REPLICATION ERROR') )
    .then( initialize )
    .catch( handleError('INITIALIZATION ERROR') );
