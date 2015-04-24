var RSVP = require('rsvp')
  , Promise = RSVP.Promise;

var models = [ 'Board', 'CardLocation', 'Pocket', 'Region', 'Transform', 'Wall' ];
var operations = [ 'create', 'update' ];

// Commands

function Commands( adapter ) {
  var db = this._db = adapter;
}

models.forEach(function( model ) {
  var command = 'create';
  var schema = model.toLowerCase();

  Commands.prototype[ command + model ] = function( data ) {
    var db = this._db;

    return new Promise(function( resolve, reject ) {
      if (!db[ command ]) {
        return reject( new Error( '[' + command + '] is not a valid command for [' + model + ']' ) );
      }

      db[ command ]( schema, data ).then( resolve, reject );
    });
  };
});

models.forEach(function( model ) {
  var command = 'update';
  var schema = model.toLowerCase();

  Commands.prototype[ command + model ] = function( data ) {
    var db = this._db;

    return new Promise(function( resolve, reject ) {
      if (!db[ command ]) {
        return reject( new Error( '[' + command + '] is not a valid command for [' + model + ']' ) );
      }

      db[ command ]( schema, data ).then( resolve, reject );
    });
  };
});

module.exports = Commands;
