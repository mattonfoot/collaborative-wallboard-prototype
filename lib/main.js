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
  .then( onAuthenticate )
  .catch( onError );

function onAuthenticate( profile ) {
  $dom.data( 'profile', profile );

  $.get( window.location.origin + '/config' )
    .done(function( config ) {
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

      return queue.replicateFromRemote( remotedb ).then( onReplicate );

      function onReplicate() {
        var ui = new UI( queue, $dom, {}, $ );
        $dom.data( 'ui', ui );

        $dom.data( 'application', new Application( queue, ui, {} ) );

        ui.enable();
      }
    });
}

function onError( err ) {
  console.log( err );
}
