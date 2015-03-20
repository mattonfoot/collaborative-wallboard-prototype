var RSVP = require('rsvp')
  , Promise = RSVP.Promise;

// Commands

function Commands( adapter, queue ) {
    this._db = adapter;
    this._queue = queue;
}

var models = [ 'Board', 'CardLocation', 'Pocket', 'Region', 'Transform', 'Wall' ];
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
