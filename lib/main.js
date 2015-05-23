var $ = require('jquery')
  , PouchDB = require('pouchdb')
  , Queue = require('./queue')
  , UI = require('./ui')
  , Auth = require('./auth')
  , Application = require('./application');

var $ = $ || function(){ console.log( 'jQuery not loaded.' ); };

var debug = false
    , db = 'vuuse'
    , opts = {};

if ( !process.browser ) {
  db = new PouchDB( db, { db: require('memdown') } );
} else {
  db = new PouchDB( db );
}

var $dom = $('[data-provides="ui"]');

var auth = new Auth( $dom, {} );
auth.authenticate( 'X0n9ZaXJrJgeP9V4KAI7LXsiMsn6jN4G', 'vuu-se.auth0.com' )
  .then( onAuthenticate )
  .catch( onError );

function onAuthenticate( profile ) {
  var queue = new Queue({
    federate: true,
    db: db,
    debug: true,
    clientId: profile.user_id + Date.now()
  });

  $dom.data( 'queue', queue );

  queue.publish( 'user.authenticated', profile );

  var ui = new UI( queue, $dom, {}, $ );
  $dom.data( 'ui', ui );

  $dom.data( 'application', new Application( db, queue, ui, {} ) );
}

function onError( err ) {
  console.log( err );
}
