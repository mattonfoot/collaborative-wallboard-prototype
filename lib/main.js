var $ = require('jquery')
  , PouchDB = require('pouchdb')
  , Belt = require('belt')
  , Queue = require('./queue')
  , UI = require('./ui')
  , Interface = require('./interface')
  , Application = require('./application');

var $ = $ || function(){ console.log( 'jQuery not loaded.' ); };

var debug = false
    , dbname = 'vuuse_features'
    , opts = {};

if ( !process.browser ) {
  opts.db = require('memdown');
}

var belt = new Belt( new PouchDB(dbname, opts), opts);
var queue = new Queue({ debug: true });
var ui = new UI( queue, $('[data-provides="ui"]'), {}, $ );
var interface = new Interface( queue, ui );

var application = new Application( belt, queue, interface, {} );

module.exports = queue;
