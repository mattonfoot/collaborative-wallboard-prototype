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
  db = new PouchDB( dbname, { db: require('memdown') } );
}

var queue = new Queue({ debug: true });
var ui = new UI( queue, $('[data-provides="ui"]'), {}, $ );

var application = new Application( db, queue, ui, {} );

module.exports = queue;
