var RSVP = require('rsvp')
  , Promise = RSVP.Promise;

var models = [ 'Board', 'CardLocation', 'Pocket', 'Region', 'Transform', 'Wall' ];

// Commands

function Commands( adapter, queue ) {
    var db = this._db = adapter;
    this._queue = queue;

    models.forEach(function( model ) {
      model = model.toLowerCase();

      db.on( model + ':deleted', function( doc ) {
        queue.publish( model + ':deleted', doc );
      });
    });
}

models.forEach(function( model ) {
  var command = 'create';
  var schema = model.toLowerCase();

  Commands.prototype[ command + model ] = function( data ) {
    var db = this._db;
    var queue = this._queue;

    return new Promise(function( resolve, reject ) {
      if (!db[ command ]) return reject( new Error( '[' + command + '] is not a valid command for [' + model + ']' ) );

      db.once( schema + ':created', handleCreation );

      db[ command ]( schema, data ).catch( reject );

      function handleCreation( resource ) {
        if ( !resourceFromSource( resource, data ) ) {
          db.once( schema + ':created', handleCreation );
          return;
        }

        queue.publish( schema + ':created', resource );

        resolve( resource );
      }
    });
  };
});

function resourceFromSource( resource, source ) {
  for ( var prop in source ) {
    if ( resource[prop] instanceof Date ) {
      if ( resource[prop].getTime() !== source[prop].getTime() ) {
        return false;
      }

      continue;
    }

    if ( resource[prop] !== source[prop] ) {
      return false;
    }
  }

  return true;
}

models.forEach(function( model ) {
  var command = 'update';
  var schema = model.toLowerCase();

  Commands.prototype[ command + model ] = function( data ) {
    var db = this._db;
    var queue = this._queue;
    var schema = model.toLowerCase();

    return new Promise(function( resolve, reject ) {
      if (!db[ command ]) return reject( new Error( '[' + command + '] is not a valid command for [' + model + ']' ) );

      db[ command ]( schema, data ).then( resolve, reject );

      queue.publish( schema + ':updated', data );
    });
  };
});

Commands.prototype.addPocketsToBoard = function( board, pockets ) {
    var _this = this;

    var promises = pockets.map(function( pocket ) {
        return _this.createCardLocation( { board: board.getId(), pocket: pocket.getId() } );
    });

    return RSVP.all( promises );
};

Commands.prototype.addPocketToBoards = function( boards, pocket ) {
    var _this = this;

    var promises = boards.map(function( board ) {
        return _this.createCardLocation( { board: board.getId(), pocket: pocket.getId() } );
    });

    return RSVP.all( promises );
};

module.exports = Commands;
