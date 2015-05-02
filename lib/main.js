var $ = require('jquery')
  , PouchDB = require('pouchdb')
  , Queue = require('./queue')
  , UI = require('./ui')
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

var ui = new UI( queue, $dom, {}, $ );
$dom.data( 'ui', ui );

$dom.data( 'application', new Application( db, queue, ui, {} ) );

module.exports = queue;
