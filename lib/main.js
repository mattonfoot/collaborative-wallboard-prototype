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

var queue = new Queue({ db: db, debug: true });
$dom.data( 'queue', queue );

var auth = new Auth( $dom, {} );

auth.authenticate( 'X0n9ZaXJrJgeP9V4KAI7LXsiMsn6jN4G', 'vuu-se.auth0.com' )
  .then(function( profile ) {
    queue.publish( 'user.authenticated', profile );

    var ui = new UI( queue, $dom, {}, $ );
    $dom.data( 'ui', ui );

    $dom.data( 'application', new Application( db, queue, ui, {} ) );
  })
  .catch(function( err ) {
    queue.publish( 'user.authentication.fail', err );
  });

module.exports = queue;
