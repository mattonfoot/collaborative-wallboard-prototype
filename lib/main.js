var $ = require('jquery')
  , PouchDB = require('pouchdb')
  , Belt = require('belt')
  , Queue = require('./queue')
  , UI = require('./ui')
  , Interface = require('./interface')
  , Application = require('./application');

var $ = $ || function(){ console.log( 'jQuery not loaded.' ); };

var debug = false
    , db = 'vuuse'
    , opts = {};

if ( !process.browser ) {
  db = new PouchDB( dbname, { db: require('memdown') } );
}

var belt = new Belt( db, opts );
var queue = new Queue({ debug: true });
var ui = new UI( queue, $('[data-provides="ui"]'), {}, $ );
var interface = new Interface( queue, ui );

var application = new Application( belt, queue, interface, {} );

module.exports = queue;
