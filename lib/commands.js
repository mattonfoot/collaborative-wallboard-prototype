var RSVP = require('rsvp')
  , Promise = RSVP.Promise;

var models = [ 'Board', 'CardLocation', 'Pocket', 'Region', 'Transform', 'Wall' ];

// Commands

function Commands( adapter, queue ) {
    this._db = adapter;
    this._queue = queue;

    var commands = this;
    models.forEach(function( model ) {
      var ev = model.toLowerCase() + ':created';

      commands._db.on( ev, function( data ) {
        commands._queue.trigger( ev, data );
      });
    });
}
/*
var commands = [ 'create', 'update' ];

commands.forEach(function( command ) {
    models.forEach(function( model ) {
        Commands.prototype[ command + model ] = function( data ) {
            var _this = this;

            return new Promise(function( resolve, reject ) {
                if (!_this._db[ command ]) return reject( new Error( '[' + command + '] is not a valid command for [' + model + ']' ) );

                var db = _this._db[ command ]( model.toLowerCase(), data ) // --> model:commanded ( board:created, pocket:updated )
                    .then( resolve, reject );
            });
        };
    });
});
*/

models.forEach(function( model ) {
  var command = 'create';

  Commands.prototype[ command + model ] = function( data ) {
      var commands = this;

      return new Promise(function( resolve, reject ) {
          if (!commands._db[ command ]) return reject( new Error( '[' + command + '] is not a valid command for [' + model + ']' ) );

          var db = commands._db[ command ]( model.toLowerCase(), data ) // --> model:commanded ( board:created, pocket:updated )
              .then( resolve, reject );
      });
  };
});

models.forEach(function( model ) {
  var command = 'update';

  Commands.prototype[ command + model ] = function( data ) {
      var commands = this;

      return new Promise(function( resolve, reject ) {
          if (!commands._db[ command ]) return reject( new Error( '[' + command + '] is not a valid command for [' + model + ']' ) );

          commands._db[ command ]( model.toLowerCase(), data ) // --> model:commanded ( board:created, pocket:updated )
              .then(function( data ) {
                commands._queue.trigger( model.toLowerCase() + ':updated', data );

                resolve( data );
              })
              .catch( reject );
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
