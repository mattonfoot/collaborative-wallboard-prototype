var $ = require('jquery')
  , PouchDB = require('pouchdb')
  , Queue = require('./queue')
  , UI = require('./ui')
  , Auth = require('./auth')
  , Application = require('./application');

var $ = $ || function(){ console.log( 'jQuery not loaded.' ); };

var debug = false
    , channelName = 'vuuse'
    , opts = {}
    , remotedb = window.location.origin + '/data/' + channelName;

var $dom = $('[data-provides="ui"]');

// 1. authenticate to identify
// 2. if online get data store from server
// 3. if new user publish profile information
// 4. display wall selector

var auth = new Auth( $dom, {} );
auth.authenticate( 'X0n9ZaXJrJgeP9V4KAI7LXsiMsn6jN4G', 'vuu-se.auth0.com' )
  .then( onAuthenticate )
  .catch( onError );

function onAuthenticate( profile ) {
  var pouchdb = new PouchDB( channelName +'_'+ profile.user_id );

  var queue = new Queue({
    federate: true,
    db: pouchdb,
    channelName: channelName,
    debug: true,
    clientId: profile.user_id + Date.now()
  });

  if ( !process.browser ) {
    return onReplicate();
  }

  return queue.replicateFromRemote( remotedb ).then( onReplicate );

  function onReplicate() {
    $dom.data( 'queue', queue );

    queue.publish( 'user.authenticated', profile );

    var ui = new UI( queue, $dom, {}, $ );
    $dom.data( 'ui', ui );

    $dom.data( 'application', new Application( queue, ui, {} ) );
  }
}

function onError( err ) {
  console.log( err );
}
