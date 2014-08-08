(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
(function (process){
var Belt = require('belt')

//  models
  , Board = require('../lib/models/board')
  , CardLocation = require('../lib/models/cardlocation')
  , Pocket = require('../lib/models/pocket')
  , Region = require('../lib/models/region')
  , Transform = require('../lib/models/transform')
  , Wall = require('../lib/models/wall')

//  system
  , Commands = require('../lib/commands')
  , Queries = require('../lib/queries')
  , Services = require('../lib/services')
  , MovementTracker = require('../lib/trackMovement')
  , TransformManager = require('../lib/transformManager');

function Application( queue, ui, options ) {
    this.options = options || {};
    if ( !process.browser ) {
        this.options.db = require('memdown');
    }

    var belt = this.belt = new Belt( 'vuu_se', this.options );

    // initialize the services
    var commands = this.commands = new Commands( belt );
    var queries = this.queries = new Queries( belt );
    var services = this.services = new Services( ui, commands, queries );
    var movementTracker = this.movementTracker = new MovementTracker( queue, commands, queries );
    var transformManager = this.transformManager = new TransformManager( queue, commands, queries );

    this._listen = true;

    var factories = {
        "Board": Board
      , "CardLocation": CardLocation
      , "Pocket": Pocket
      , "Region": Region
      , "Transform": Transform
      , "Wall": Wall
    };

    var listeners = [ 'created', 'updated', 'deleted' ];

    for ( var key in factories ) {
        var type = key.toLowerCase(), Model = factories[ key ];

        // register model
        belt.resource( type, Model.constructor )
            .schema( Model.schema )
            .validator( Model.validator )
            .beforeCreate( Model.onBeforeCreate )
            .beforeUpdate( Model.onBeforeUpdate );

        // listen to db for events
        attachListenersToDb( type );
    }


    function attachListenersToDb( type  ) {
        listeners.forEach(function( listener ) {
            belt.on( type + ':' + listener, function( data ) {
                queue.trigger( type + ':' + listener, data );
            });
        });
    }

    this.constructor = Application;

    var _this = this;

    // setup events to trigger services

    var listeners2 = [ 'new', 'create', 'edit', 'update', 'select', 'display', 'unlink', 'move', 'resize' ];

    for ( var x in factories ) {
        setUpEventListeners( x );
    }

    function setUpEventListeners( type ) {
        listeners2.forEach(function( task ) {
            queue.on( type.toLowerCase() + ':' + task, function( ev ) {
                if (!_this._listen || !services[ task + type ]) return;

                if (options.debug) {
                    console.log( 'services.' + task + type + '()' );
                }

                services[ task + type ]( ev );
            });
        });
    }

    queue
        .on('board:displayed', function( board ) {
            if (!_this._listen) return;

            services.displayCardLocations( board );
            services.displayRegions( board );
        })

        .on('wall:firsttime', function( wall ) {
            if (!_this._listen) return;

            services.newBoard();
        })

        .on('wall:created', function( wall ) {
            if (!_this._listen) return;

            services.displayWall( wall.getId() );
        })

        .on('board:created', function( board ) {
            if (!_this._listen) return;

            services.displayBoard( board.getId() );
        })

        .on('region:created', function( region ) {
            if (!_this._listen) return;

            services.displayRegion( region.getId() );
        })

        .on('cardlocation:created', function( cardlocation ) {
            if (!_this._listen) return;

            services.displayCardLocation( cardlocation );
        })

        .on( 'cardlocation:updated', function( location ) {
            if (!_this._listen) return;

            movementTracker.trackCardMovement( location );
        })

        .on( 'region:updated', function( region ) {
            if (!_this._listen) return;

            movementTracker.trackRegionMovement( region );
        })

        .on( 'pocket:regionenter', function( data ) {
            if (!_this._listen) return;

            transformManager.checkTransforms( data );
        })

        .on( 'pocket:regionexit', function( data ) {
            if (!_this._listen) return;

            transformManager.checkTransforms( data );
        })

        ;
}

Application.prototype.pauseListening = function() {
    this._listen = false;
};

Application.prototype.startListening = function() {
    this._listen = true;
};

module.exports = Application;

}).call(this,require("JkpR2F"))
},{"../lib/commands":2,"../lib/models/board":4,"../lib/models/cardlocation":5,"../lib/models/pocket":6,"../lib/models/region":7,"../lib/models/transform":8,"../lib/models/wall":9,"../lib/queries":10,"../lib/services":14,"../lib/trackMovement":15,"../lib/transformManager":16,"JkpR2F":59,"belt":18,"memdown":62}],2:[function(require,module,exports){
var RSVP = require('rsvp')
  , Promise = RSVP.Promise;

// Commands

function Commands( adapter ) {
    this._db = adapter;
}

var models = [ 'Board', 'CardLocation', 'Pocket', 'Region', 'Transform', 'Wall' ];
var commands = [ 'create', 'update' ];

commands.forEach(function( command ) {
    models.forEach(function( model ) {
        Commands.prototype[ command + model ] = function( data ) {
            var _this = this;
            return new Promise(function(resolve, reject) {
                if (!_this._db[command]) return reject( new Error( '[' + command +'] is not a valid command for ['+ model +']' ) );

                var db = _this._db[command]( model.toLowerCase(), data); // --> model:commanded ( board:created, pocket:updated )

                if ( command === 'update' && should.getId ) {
                    return resolve( data );
                }

                db.then( resolve, reject ).catch( reject );
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

},{"rsvp":121}],3:[function(require,module,exports){
// Commands

function Interface( queue, ui ) {
    this._queue = queue;
    this._ui = ui;
}

Interface.prototype.addBoard = function( board ) {
    if ( this._ui && this._wall.getId() === board.getWall() ) this._ui.updateBoardSelector( board );

    this._queue.trigger( 'board:added', board );
};

Interface.prototype.displayBoard = function( board ) {
    if ( !this._wall || board.getWall() !== this._wall.getId() ) return;

    this._board = board;
    this._regions = [];
    this._cardlocations = [];

    if (this._ui) this._ui.displayBoard( board );

    this._queue.trigger( 'board:displayed', board );

    this.enableControls();
};

Interface.prototype.displayBoardCreator = function() {
    if ( !this._wall ) return;

    if (this._ui) this._ui.displayBoardCreator( this._wall );

    this._queue.trigger( 'boardcreator:displayed' );
};

Interface.prototype.displayBoardEditor = function( board ) {
    if (this._ui) this._ui.displayBoardEditor( board );

    this._queue.trigger( 'boardeditor:displayed', board );
};

Interface.prototype.displayBoardSelector = function( boards ) {
    if (this._ui) this._ui.displayBoardSelector( this._wall, boards );

    this._queue.trigger( 'boardselector:displayed', boards );
};

// cardlocations

Interface.prototype.displayCardLocation = function( location, pocket ) {
    if ( !this._board || location.getBoard() !== this._board.getId() || ~this._cardlocations.indexOf( location.getId() )) return;

    this._cardlocations.push( location.getId() );

    if (this._ui) this._ui.displayCardLocation( location, pocket );

    this._queue.trigger( 'cardlocation:displayed', location );
};

Interface.prototype.displayPocketCreator = function() {
    if ( !this._wall ) return;

    if (this._ui) this._ui.displayPocketCreator( this._wall );

    this._queue.trigger( 'pocketcreator:displayed' );
};

Interface.prototype.displayPocketEditor = function( pocket ) {
    if (this._ui) this._ui.displayPocketEditor( pocket );

    this._queue.trigger( 'pocketeditor:displayed', pocket );
};

// regions

Interface.prototype.displayRegion = function( region ) {
    if ( !this._board || region.getBoard() !== this._board.getId() || ~this._regions.indexOf( region.getId() )) return;

    this._regions.push( region.getId() );

    if (this._ui) this._ui.displayRegion( region );

    this._queue.trigger( 'region:displayed', region );
};

Interface.prototype.displayRegions = function( regions ) {
    var _this = this;

    regions.forEach(function( region ) {
        _this.displayRegion( region );
    });
};

Interface.prototype.displayRegionCreator = function() {
    if ( !this._board ) return;

    if (this._ui) this._ui.displayRegionCreator( this._board );

    this._queue.trigger( 'regioncreator:displayed' );
};

Interface.prototype.displayRegionEditor = function( region ) {
    if (this._ui) this._ui.displayRegionEditor( region );

    this._queue.trigger( 'regioneditor:displayed', region );
};

// walls

Interface.prototype.displayWall = function( wall ) {
    this._wall = wall;
    this._regions = [];
    this._cardlocations = [];
    delete this._board;

    if (this._ui) this._ui.displayWall( wall );

    this._queue.trigger( 'wall:displayed', wall );
};

Interface.prototype.displayWallCreator = function() {
    if (this._ui) this._ui.displayWallCreator();

    this._queue.trigger( 'wallcreator:displayed' );
};

Interface.prototype.displayWallEditor = function( wall ) {
    if (this._ui) this._ui.displayWallEditor( wall );

    this._queue.trigger( 'walleditor:displayed', wall );
};

Interface.prototype.displayWallSelector = function( walls ) {
    if (this._ui) this._ui.displayWallSelector( walls );

    this._queue.trigger( 'wallselector:displayed', walls );
};

Interface.prototype.notifyWallFirstTime = function( wall ) {
    this._queue.trigger( 'wall:firsttime', wall );
};

Interface.prototype.enableControls = function( data ) {
    if (this._ui) this._ui.enableControls( data );

    this._queue.trigger( 'controls:enabled' );
};

module.exports = Interface;

},{}],4:[function(require,module,exports){


function Board( data ) {
    for ( var prop in data ) {
        if ( prop === 'links' ) continue;

        this[prop] = data[prop];
    }

    this.cardlocations = [];
    this.regions = [];
    this.transforms = [];

    for ( var link in data.links ) {
        this[link] = data.links[link];
    }

    this.shelf = {};

    this.constructor = Board;
}

Board.prototype.getId = function() {
    return this.id;
};

Board.prototype.getName = function() {
    return this.name;
};

Board.prototype.getWall = function() {
    return this.wall;
};

Board.prototype.getCardLocations = function() {
    return this.cardlocations;
};

Board.prototype.addCardLocation = function( cardlocation ) {
    if ( !~this.cardlocations.indexOf( cardlocation.id ) ) {
        this.cardlocations.push( cardlocation.id );
    }

    return this;
};

Board.prototype.getRegions = function() {
    return this.regions;
};

Board.prototype.addRegion = function( region ) {
    if ( !~this.regions.indexOf( region.id ) ) {
        this.regions.push( region.id );
    }

    return this;
};

Board.prototype.getTransforms = function() {
    return this.transforms;
};

Board.prototype.addTransform = function( transform ) {
    if ( !~this.transforms.indexOf( transform.id ) ) {
        this.transforms.push( transform.id );
    }

    return this;
};

Board.constructor = function( data ) {
    if ( data instanceof Board ) {
        return data;
    }

    return new Board( data );
};

Board.schema = {
    name: String
  , wall: 'wall'
  , cardlocations: ['cardlocation']
  , regions: ['region']
  , transforms: ['transform']
  , createdBy: 'user'
  , createdOn: Date
  , lastModifiedBy: 'user'
  , lastModifiedOn: Date
  // , views: [ 'view' ] --> [ 'transform' ]
  // , access: [ 'right' ] --> 'user', 'group'
};

Board.validator = function( data ) {
    var validator = {
        validForUpdate: true
      , validForCreate: true
      , issues: []
    };

    if ( !data.id ) {
        validator.validForUpdate = false;
        validator.issues.push( 'ID is required' );
    }

    if ( !data.name || data.name === '' ) {
        validator.validForUpdate = validator.validForCreate = false;
        validator.issues.push( 'Name is required' );
    }

    if ( !data.wall || data.wall === '' ) {
        validator.validForUpdate = validator.validForCreate = false;
        validator.issues.push( 'Wall is required' );
    }

    return validator;
};

Board.onBeforeUpdate = function ( data ) {
    // data.lastModifiedBy = app.getCurrentUser()._id;
    data.lastModifiedOn = new Date();

    return data;
};

Board.onBeforeCreate = function( data ) {
    // data.createdBy = app.getCurrentUser()._id;
    data.createdOn = new Date();

    return data;
};

module.exports = Board;

},{}],5:[function(require,module,exports){


function CardLocation( data ) {
    for ( var prop in data ) {
        if ( prop === 'links' ) continue;

        this[prop] = data[prop];
    }

    for ( var link in data.links ) {
        this[link] = data.links[link];
    }

    this.constructor = CardLocation;
}

CardLocation.prototype.getId = function() {
    return this.id;
};

CardLocation.prototype.getX = function() {
    return this.x;
};

CardLocation.prototype.getY = function() {
    return this.y;
};

CardLocation.prototype.getPocket = function() {
    return this.pocket;
};

CardLocation.prototype.getBoard = function() {
    return this.board;
};

CardLocation.prototype.getPosition = function() {
    return {
        id: this.id,
        board: this.board,
        x: this.x,
        y: this.y
    };
};

CardLocation.prototype.moveTo = function( x, y ) {
    if ( this.x !== x || this.y !== y ) {
        this.x = x;
        this.y = y;
    }

    return this;
};

CardLocation.constructor = function( data ) {
    if ( data instanceof CardLocation ) {
        return data;
    }

    return new CardLocation( data );
};

CardLocation.schema = {
    x: Number,
    y: Number,
    board: 'board',
    pocket: 'pocket'
  , createdBy: 'user'
  , createdOn: Date
  , lastModifiedBy: 'user'
  , lastModifiedOn: Date
};

CardLocation.validator = function( data ) {
    var validator = {
        validForUpdate: true
      , validForCreate: true
      , issues: []
    };

    if ( !data.id ) {
        validator.validForUpdate = false;
        validator.issues.push( 'ID is required' );
    }

    if ( !data.pocket || data.pocket === '' ) {
        validator.validForUpdate = validator.validForCreate = false;
        validator.issues.push( 'Pocket is required' );
    }

    if ( !data.board || data.board === '' ) {
        validator.validForUpdate = validator.validForCreate = false;
        validator.issues.push( 'Board is required' );
    }

    return validator;
};

CardLocation.onBeforeUpdate = function ( data ) {
    // data.lastModifiedBy = app.getCurrentUser()._id;
    data.lastModifiedOn = new Date();

    return data;
};

CardLocation.onBeforeCreate = function( data ) {
    // data.createdBy = app.getCurrentUser()._id;
    data.createdOn = new Date();

    data.x = data.x || 20;
    data.y = data.y || 20;

    return data;
};

module.exports = CardLocation;

},{}],6:[function(require,module,exports){


function Pocket( data ) {
    for ( var prop in data ) {
        if ( prop === 'links' ) continue;

        var value = data[prop];

        this[prop] = (value === 'undefined' ? undefined : value);
    }

    this.cardlocations = [];
    this.regions = [];

    for ( var link in data.links ) {
        this[link] = data.links[link];
    }

    this.constructor = Pocket;
}

Pocket.prototype.getId = function() {
    return this.id;
};

Pocket.prototype.getTitle = function() {
    return this.title;
};

Pocket.prototype.getCardnumber = function() {
    return this.cardnumber;
};

Pocket.prototype.getContent = function() {
    return this.content;
};

Pocket.prototype.getTags = function() {
    return this.tags;
};

Pocket.prototype.getMentions = function() {
    return this.mentions;
};

Pocket.prototype.getWall = function() {
    return this.wall;
};

Pocket.prototype.getCardLocations = function() {
    return this.cardlocations;
};

Pocket.prototype.addCardLocation = function( cardlocation ) {
    if ( !~this.cardlocations.indexOf( cardlocation.id ) ) {
        this.cardlocations.push( cardlocation.id );
    }

    return this;
};

Pocket.prototype.getRegions = function() {
    return this.regions;
};

Pocket.prototype.addRegion = function( region ) {
    if ( !~this.regions.indexOf( region.id ) ) {
        this.regions.push( region.id );
    }

    return this;
};

Pocket.prototype.removeRegion = function( region ) {
    var loc = this.regions.indexOf( region.id );

    if ( ~loc ) {
        this.regions.splice( loc, 1 );
    }

    return this;
};

Pocket.constructor = function( data ) {
    if ( data instanceof Pocket ) {
        return data;
    }

    return new Pocket( data );
};

Pocket.schema = {
    title: String,
    cardnumber: Number,
    content: String,     // [ 'fragment' ]
    tags: String,        // [ 'tag' ]
    mentions: String,    // [ 'mention' ] --> 'user', 'group'
    color: String,
    wall: 'wall',
    cardlocation: ['cardlocation'],
    regions: ['region']
    , createdBy: 'user'
    , createdOn: Date
    , lastModifiedBy: 'user'
    , lastModifiedOn: Date
};

Pocket.validator = function( data ) {
    var validator = {
        validForUpdate: true
      , validForCreate: true
      , issues: []
    };

    if ( !data.id ) {
        validator.validForUpdate = false;
        validator.issues.push( 'ID is required' );
    }

    if ( !data.title || data.title === '' ) {
        validator.validForUpdate = validator.validForCreate = false;
        validator.issues.push( 'Title is required' );
    }

    if ( !data.wall || data.wall === '' ) {
        validator.validForUpdate = validator.validForCreate = false;
        validator.issues.push( 'Wall is required' );
    }

    return validator;
};

Pocket.onBeforeUpdate = function ( data ) {
    // data.lastModifiedBy = app.getCurrentUser()._id;
    data.lastModifiedOn = new Date();

    return data;
};

Pocket.onBeforeCreate = function( data ) {
    // data.createdBy = app.getCurrentUser()._id;
    data.createdOn = new Date();

    return data;
};

module.exports = Pocket;

},{}],7:[function(require,module,exports){


function Region( data ) {
    for ( var prop in data ) {
        if ( prop === 'links' ) continue;

        this[prop] = data[prop];
    }

    this.pockets = [];

    for ( var link in data.links ) {
        this[link] = data.links[link];
    }

    this.constructor = Region;
}

Region.prototype.getId = function() {
    return this.id;
};

Region.prototype.getLabel = function() {
    return this.label;
};

Region.prototype.getColor = function() {
    return this.color;
};

Region.prototype.getValue = function() {
    return this.value;
};

Region.prototype.getX = function() {
    return this.x;
};

Region.prototype.getY = function() {
    return this.y;
};

Region.prototype.getWidth = function() {
    return this.width;
};

Region.prototype.getHeight = function() {
    return this.height;
};

Region.prototype.getBoard = function() {
    return this.board;
};

Region.prototype.getPockets = function() {
    return this.pockets;
};

Region.prototype.addPocket = function( pocket ) {
    if ( !~this.pockets.indexOf( pocket.id ) ) {
        this.pockets.push( pocket.id );
    }

    return this;
};

Region.prototype.moveTo = function( x, y ) {
    if ( this.x !== x || this.y !== y ) {
        this.x = x;
        this.y = y;
    }

    return this;
};

Region.prototype.resizeTo = function( width, height ) {
    if ( this.width !== width || this.height !== height ) {
        this.width = width;
        this.height = height;
    }

    return this;
};

Region.constructor = function( data ) {
    if ( data instanceof Region ) {
        return data;
    }

    return new Region( data );
};

Region.schema = {
    label: String
  , value: String
  , color: String
  , x: Number
  , y: Number
  , width: Number
  , height: Number
  , board: 'board'
  , pockets: ['pocket']
  , createdBy: 'user'
  , createdOn: Date
  , lastModifiedBy: 'user'
  , lastModifiedOn: Date
};

Region.validator = function( data ) {
    var validator = {
        validForUpdate: true
      , validForCreate: true
      , issues: []
    };

    if ( !data.id ) {
        validator.validForUpdate = false;
        validator.issues.push( 'ID is required' );
    }

    if ( !data.label || data.label === '' ) {
        validator.validForUpdate = validator.validForCreate = false;
        validator.issues.push( 'Label is required' );
    }

    if ( !data.board || data.board === '' ) {
        validator.validForUpdate = validator.validForCreate = false;
        validator.issues.push( 'Board is required' );
    }

    return validator;
};

Region.onBeforeUpdate = function ( data ) {
    // data.lastModifiedBy = app.getCurrentUser()._id;
    data.lastModifiedOn = new Date();

    return data;
};

Region.onBeforeCreate = function( data ) {
    // data.createdBy = app.getCurrentUser()._id;
    data.createdOn = new Date();

    data.width = data.width || 100;
    data.height = data.height || 100;
    data.x = data.x || 10;
    data.y = data.y || 10;

    return data;
};

module.exports = Region;

},{}],8:[function(require,module,exports){
var queryPhraseParser = require('../queryPhraseParser');


function Transform( data ) {
    for ( var prop in data ) {
        if ( prop === 'links' ) continue;

        this[prop] = data[prop];
    }

    for ( var link in data.links ) {
        this[link] = data.links[link];
    }

    this.constructor = Transform;
}

Transform.prototype.getId = function() {
    return this.id;
};

Transform.prototype.getPhrase = function() {
    return this.phrase;
};

Transform.prototype.getRules = function() {
    return this.rules;
};

Transform.prototype.getBoard = function() {
    return this.board;
};

Transform.constructor = function( data ) {
    if ( data instanceof Transform ) {
        return data;
    }

    return new Transform( data );
};

Transform.schema = {
    phrase: String
  , rules: Object
  , board: 'board'
  , createdBy: 'user'
  , createdOn: Date
  , lastModifiedBy: 'user'
  , lastModifiedOn: Date
};

Transform.validator = function( data ) {
    var validator = {
        validForUpdate: true
      , validForCreate: true
      , issues: []
    };

    if ( !data.id ) {
        validator.validForUpdate = false;
        validator.issues.push( 'ID is required' );
    }

    if ( !data.phrase || data.phrase === '' ) {
        validator.validForUpdate = validator.validForCreate = false;
        validator.issues.push( 'Phrase is required' );
    }

    if ( !data.board ) {
        validator.validForUpdate = false;
        validator.issues.push( 'Board is required' );
    }

    return validator;
};

Transform.onBeforeUpdate = function ( data ) {
    // data.lastModifiedBy = app.getCurrentUser()._id;
    data.lastModifiedOn = new Date();

    data.rules = queryPhraseParser( data.phrase );

    return data;
};

Transform.onBeforeCreate = function( data ) {
    // data.createdBy = app.getCurrentUser()._id;
    data.createdOn = new Date();

    data.rules = queryPhraseParser( data.phrase );

    return data;
};

module.exports = Transform;

},{"../queryPhraseParser":11}],9:[function(require,module,exports){
function Wall( data ) {
    for ( var prop in data ) {
        if ( prop === 'links' ) continue;

        this[prop] = data[prop];
    }

    this.boards = [];
    this.pockets = [];

    for ( var link in data.links ) {
        this[link] = data.links[link];
    }

    this.constructor = Wall;
}

Wall.prototype.getId = function() {
    return this.id;
};

Wall.prototype.getName = function() {
    return this.name;
};

Wall.prototype.getBoards = function() {
    return this.boards;
};

Wall.prototype.addBoard = function( board ) {
    if ( !~this.boards.indexOf( board.id ) ) {
        this.boards.push( board.id );
    }

    return this;
};

Wall.prototype.getPockets = function() {
    return this.pockets;
};

Wall.prototype.addPocket = function( pocket ) {
    if ( !~this.pockets.indexOf( pocket.id ) ) {
        this.pockets.push( pocket.id );
    }

    return this;
};

Wall.constructor = function( data ) {
    if ( data instanceof Wall ) {
        return data;
    }

    return new Wall( data );
};

Wall.schema = {
    name: String
  , boards: ['board']
  , pockets: ['pocket']
  , createdBy: 'user'
  , createdOn: Date
  , lastModifiedBy: 'user'
  , lastModifiedOn: Date
  // , access: [ 'right' ] --> 'user', 'group'
};

Wall.validator = function( data ) {
    var validator = {
        validForUpdate: true
      , validForCreate: true
      , issues: []
    };

    if ( !data.id ) {
        validator.validForUpdate = false;
        validator.issues.push( 'ID is required' );
    }

    if ( !data.name || data.name === '' ) {
        validator.validForUpdate = validator.validForCreate = false;
        validator.issues.push( 'Name is required' );
    }

    return validator;
};

Wall.onBeforeUpdate = function ( data ) {
    // data.lastModifiedBy = app.getCurrentUser()._id;
    data.lastModifiedOn = new Date();

    return data;
};

Wall.onBeforeCreate = function( data ) {
    // data.createdBy = app.getCurrentUser()._id;
    data.createdOn = new Date();

    return data;
};

module.exports = Wall;

},{}],10:[function(require,module,exports){
var RSVP = require('rsvp')
  , Promise = RSVP.Promise;

// Commands

function Queries( adapter ) {
    this._db = adapter;
}

Queries.prototype.getBoard = function( boardid ) {
    var _this = this;

    return new Promise(function( resolve, reject ) {
        _this._db.find( 'board', boardid )
            .then( resolve )
            .catch( reject );
    });
};

Queries.prototype.getBoardsForWall = function( wall ) {
    var _this = this
      , boardids = wall.getBoards();

    return new Promise(function( resolve, reject ) {
        if (!boardids.length) {
            resolve([]);
        }

        _this._db.findMany( 'board', boardids )
            .then( resolve )
            .catch( reject );
    });
};

Queries.prototype.getCardLocation = function( id ) {
    var _this = this;

    return new Promise(function( resolve, reject ) {
        _this._db.find( 'cardlocation', id )
            .then( resolve )
            .catch( reject );
    });
};

Queries.prototype.getCardLocationsForBoard = function( board ) {
    var _this = this
      , ids = board.getCardLocations();

    return new Promise(function( resolve, reject ) {
        if (!ids.length) {
            resolve([]);
        }

        _this._db.findMany( 'cardlocation', ids )
            .then( resolve )
            .catch( reject );
    });
};

Queries.prototype.getPocket = function( pocketid ) {
    var _this = this;

    return new Promise(function( resolve, reject ) {
        _this._db.find( 'pocket', pocketid )
            .then( resolve )
            .catch( reject );
    });
};

Queries.prototype.getPocketsForWall = function( wall ) {
    var _this = this
      , pocketids = wall.getPockets();

    return new Promise(function( resolve, reject ) {
        if (!pocketids.length) {
            resolve([]);
        }

        _this._db.findMany( 'pocket', pocketids )
            .then( resolve )
            .catch( reject );
    });
};

Queries.prototype.getRegion = function( regionid ) {
    var _this = this;

    return new Promise(function( resolve, reject ) {
        _this._db.find( 'region', regionid )
            .then( resolve )
            .catch( reject );
    });
};

Queries.prototype.getRegionsForBoard = function( board ) {
    var _this = this
      , regionids = board.getRegions();

    return new Promise(function( resolve, reject ) {
        if (!regionids.length) {
            resolve([]);
        }

        _this._db.findMany( 'region', regionids )
            .then( resolve )
            .catch( reject );
    });
};

Queries.prototype.getTransformsForBoard = function( board ) {
    var _this = this
      , transformids = board.getTransforms();

    return new Promise(function( resolve, reject ) {
        if (!transformids.length) {
            resolve([]);
        }

        _this._db.findMany( 'transform', transformids )
            .then( resolve )
            .catch( reject );
    });
};

Queries.prototype.getAllTransforms = function() {
    var _this = this;

    return new Promise(function( resolve, reject ) {
        _this._db.findMany( 'transforms' )
            .then( resolve )
            .catch( reject );
    });
};

Queries.prototype.getWall = function( wallid ) {
    var _this = this;

    return new Promise(function( resolve, reject ) {
        _this._db.find( 'wall', wallid )
            .then( resolve )
            .catch( reject );
    });
};

Queries.prototype.getAllWalls = function() {
    var _this = this;

    return new Promise(function( resolve, reject ) {
        _this._db.findMany( 'wall' )
            .then( resolve )
            .catch( reject );
    });
};

module.exports = Queries;

},{"rsvp":121}],11:[function(require,module,exports){
// query phrase config object

function Config( attr ) {
  this.attr = attr;
}

Config.prototype.from = function( attr, selector ) {
  this.from = {
    attr: attr,
    selector: selector
  };

  return this;
};

Config.prototype.when = function( relationship, filter ) {
  this.when = {
    relationship: relationship,
    filter: filter
  };

  return this;
};

// parser factory

function get( attr ) {
  var config = new Config( attr );

  return config;
}

function region( relationship, selector ) {
    return {
      relationship: relationship,
      selector: selector,
      node: 'region'
    };
}

function board( selector ) {
    return {
      selector: selector,
      node: 'board'
    };
}

function Parser( phrase ) {
  var matches = phrase.match(/(get|from|when)/ig);
  if (!matches || matches.length < 2) {
    return {};
  }

  var out = phrase.replace(/\sof\s/ig, ' ').replace(/board\s#([^\s]*)/ig, 'this.board(\'#$1\')').trim();
  out = out.replace(/(board[^\(])\s/ig, '\'$1\' ').trim();
  out = out.replace(/\sboard(?:\s|$)/ig, ' \'board\' ').trim();
  out = out.replace(/region\s([^\s]*)\s([^\s]*)/ig, 'this.region(\'$1\',$2)').trim();
  out = out.replace(/\sregion(?:\s|$)/ig, ' \'region\' ').trim();
  out = out.replace(/get\s([^\s]*)/ig, 'this.get(\'$1\')').trim();
  out = out.replace(/\sfrom\s([^\s]*)\s([^\s]*)/ig, '.from(\'$1\',$2)').trim();
  out = out.replace(/\swhen\s([^\s]*?)\s([^\s]*)/ig, '.when(\'$1\',$2)').trim();

  if (out === phrase) {
    return {};
  }

  /*jslint evil: true */
  return (new Function( 'return ' + out )).call({
      get: get,
      region: region,
      board: board
  });
}

module.exports = Parser;

},{}],12:[function(require,module,exports){
var util = require('util')
  , Queue = require('./queue');

function TestQueue( options ) {
    Queue.call( this, options );
}

util.inherits( TestQueue, Queue );

TestQueue.prototype._emit = TestQueue.prototype.emit;
TestQueue.prototype.emit = function( ev, data ) {
    this._calls = this._calls || [];

    this._calls.push({ event: ev, data: data });

    this._emit( ev, data );
};

TestQueue.prototype.clearCalls = function() {
    this._calls = [];

    for (var ev in this.events) {
        clearOnceEvents( this, ev );
    }

    function clearOnceEvents( _this, ev ) {
        var cleansed = [];

        _this.events[ev].forEach(function( react ) {
            if (!react.once) {
                cleansed.push( react );
            }
        });

        _this.events[ev] = cleansed;
    }
};

TestQueue.prototype.getCalls = function() {
    return this._calls;
};

module.exports = TestQueue;

},{"./queue":13,"util":61}],13:[function(require,module,exports){
function EventQueue( options ) {
    this.options = options || {};

    this.events = {};
}

EventQueue.prototype.on = function( ev, reaction, once ) {
    if (!this.events[ev]) {
        this.events[ev] = [];
    }

    this.events[ev].push( { reaction: reaction, once: !!once } );

    return this;
};

EventQueue.prototype.once = function( ev, reaction ) {
    return this.on( ev, reaction, true );
};

EventQueue.prototype.emit = function( ev, data ) {
    var options = this.options;

    if (options.debug) {
        console.log( 'EventQueue.emit('+ ev +')', ( data && data.getId ? data.getId() : typeof( data ) ) );
    }

    if (this.events[ev]) {
        var cleansed = [];

        this.events[ev].forEach(function( react ) {
            setTimeout(function() {
                react.reaction( data );
            }, 0);

            if (!react.once) {
                cleansed.push( react );
            }
        });

        this.events[ev] = cleansed;
    }

    return this;
};

EventQueue.prototype.clearAll = function() {
    this.events = {};
};

EventQueue.prototype.trigger = function( ev, data ) {
    this.emit( ev, data );
};

module.exports = EventQueue;

},{}],14:[function(require,module,exports){
var RSVP = require('rsvp')
  , Promise = RSVP.Promise;

// Application

function Services( interface, commands, queries ) {
    this._commands = commands;
    this._queries = queries;
    this._interface = interface;
}

// board:new
Services.prototype.newBoard = function() {
    return this._interface.displayBoardCreator();
};

// board:create
Services.prototype.createBoard = function( data ) {
    var _this = this, board, phrase;

    if (data.transform) {
        phrase = data.transform;

        delete data.transform;
    }

    return this._commands
        .createBoard( data )  // --> board:created
        .then(function( resource ) {
            board = resource;

            return board;
        })
        .then(function( board ) {
            if (phrase && phrase !== '') {
                return _this.createTransform({
                        board: board.getId(),
                        phrase: phrase
                    })
                    .then(function( transform ) {
                        board.transforms.push( transform.getId() );

                        return board;
                    });
            }

            return board;
        })
        .then(function( board ) {
            _this._interface.addBoard( board );

            return _this._queries.getWall( board.getWall() );
        })
        .then(function( wall ) {
            return _this._queries.getPocketsForWall( wall );
        })
        .then(function( pockets ) {
            _this._commands.addPocketsToBoard( board, pockets );  // --> cardlocation:created

            return board;
        });
};

// board:edit
Services.prototype.editBoard = function( id ) {
    var _this = this;

    return this._queries
        .getBoard( id )
        .then(function( board ) {
            _this._interface.displayBoardEditor( board );

            return board;
        });
};

// board:update
Services.prototype.updateBoard = function( data ) {
    var _this = this, phrase;

    if (data.transform) {
        phrase = data.transform;

        delete data.transform;
    }

    return this._commands.updateBoard( data )  // --> board:updated
        .then(function( board ) {
            if (phrase && phrase !== '') {
                return _this.createTransform({
                        board: board.getId(),
                        phrase: phrase
                    })
                    .then(function( transform ) {
                        board.transforms.push( transform.getId() );

                        return board;
                    });
            }

            return board;
        });

};

// board:display
// board:created
Services.prototype.displayBoard = function( id ) {
    var _this = this;

    return this._queries
        .getBoard( id )
        .then(function( board ) {
            _this._interface.displayBoard( board );  // --> board:displayed

            return board;
        });
};

// board:select
Services.prototype.selectBoard = function( wall ) {
    var _this = this;

    return this._queries
        .getBoardsForWall( wall )
        .then(function( boards ) {
            _this._interface.displayBoardSelector( boards );  // --> boardselector:displayed

            return boards;
        })
        .then(function( boards ) {
            if (boards.length) {
                _this._interface.displayBoard( boards[0] );  // --> board:displayed
            }

            return wall;
        });
};





// cardlocations

// cardlocation:created
Services.prototype.displayCardLocation = function( location ) {
    var _this = this;

    return callDisplayCardLocationWithPocket.call( _this, location );
};

// board:displayed
Services.prototype.displayCardLocations = function( board ) {
    var _this = this;

    return this._queries
        .getCardLocationsForBoard( board )
        .then(function( locations ) {
            var promises = locations.map(function( location ) {
                return callDisplayCardLocationWithPocket.call( _this, location );
            });

            return RSVP.all( promises );
        });
};

function callDisplayCardLocationWithPocket( location ) {
    var _this = this;

    return this._queries.getPocket( location.getPocket() )
        .then(function( pocket ) {
            _this._interface.displayCardLocation( location, pocket );  // --> cardlocation:displayed

            return location;
        });
}

// cardlocation:move
Services.prototype.moveCardLocation = function( info ) {
    var _this = this;

    return this._queries
        .getCardLocation( info.id )
        .then(function( cardlocation ) {
            if ( cardlocation.x != info.x || cardlocation.y != info.y ) {
              cardlocation.x = info.x;
              cardlocation.y = info.y;

              return _this._commands.updateCardLocation( cardlocation );  // --> cardlocation:updated
            }
        });
};






// pockets

// pocket:new
Services.prototype.newPocket = function() {
    return this._interface.displayPocketCreator();
};

// pocket:create
Services.prototype.createPocket = function( data ) {
    var _this = this, pocket;

    return this._commands
        .createPocket( data )  // --> pocket:created
        .then(function( resource ) {
            pocket = resource;

            return _this._queries.getWall( pocket.getWall() );
        })
        .then(function( wall ) {
            return _this._queries.getBoardsForWall( wall );
        })
        .then(function( boards ) {
            _this._commands.addPocketToBoards( boards, pocket );  // --> cardlocation:created

            return pocket;
        });
};

// pocket:edit
Services.prototype.editPocket = function( id ) {
    var _this = this;

    return this._queries
        .getPocket( id )
        .then(function( pocket ) {
            _this._interface.displayPocketEditor( pocket );

            return pocket;
        });
};

// pocket:update
Services.prototype.updatePocket = function( data ) {
    return this._commands.updatePocket( data );  // --> pocket:updated
};






// regions

// region:created
Services.prototype.displayRegion = function( id ) {
    var _this = this;

    return this._queries
        .getRegion( id )
        .then(function( region ) {
            _this._interface.displayRegion( region );  // --> region:displayed

            return region;
        });
};

// board:displayed
Services.prototype.displayRegions = function( board ) {
    var _this = this;

    return this._queries
        .getRegionsForBoard( board )
        .then(function( regions ) {
            _this._interface.displayRegions( regions );  // --> region:displayed

            return regions;
        });
};
// region:new
Services.prototype.newRegion = function() {
    return this._interface.displayRegionCreator();
};

// region:create
Services.prototype.createRegion = function( data ) {
    return this._commands.createRegion( data );  // --> region:created
};

// region:edit
Services.prototype.editRegion = function( id ) {
    var _this = this;

    return this._queries.getRegion( id )
        .then(function( region ) {
            _this._interface.displayRegionEditor( region );

            return region;
        });
};

// region:move
Services.prototype.moveRegion = function( info ) {
  var _this = this;

  return this._queries
      .getRegion( info.id )
      .then(function( region ) {
          if ( region.x === info.x && region.y === info.y ) {
            return region;
          }

          region.x = info.x;
          region.y = info.y;

          return _this._commands.updateRegion( region );  // --> region:updated
      });
};

// region:resize
Services.prototype.resizeRegion = function( info ) {
  var _this = this;

  return this._queries
      .getRegion( info.id )
      .then(function( region ) {
          if ( region.height === info.height && region.width === info.width ) {
              return region;
          }

          region.height = info.height;
          region.width = info.width;

          return _this._commands.updateRegion( region );  // --> region:updated
      });
};

// region:update
Services.prototype.updateRegion = function( data ) {
    return this._commands.updateRegion( data );  // --> region:updated
};






// transforms

Services.prototype.createTransform = function( data ) {
    return this._commands.createTransform( data );  // --> region:created
};

// transform:unlink
Services.prototype.unlinkTransform = function( id ) {
    var _this = this;

    return this._queries
        .getTransform( id )
        .then(function( transform ) {
            return _this._commands.unlinkTransform( id );  // --> transform:unlinked
        })
        .then(function( transform ) {
            _this._interface.removeTransform( transform );

            return transform;
        });
};





// walls

// wall:new
Services.prototype.newWall = function() {
    this._interface.displayWallCreator();
};

// wall:create
Services.prototype.createWall = function( data ) {
    return this._commands.createWall( data ); // --> wall:created
};

// wall:edit
Services.prototype.editWall = function( id ) {
    var _this = this;

    return this._queries
        .getWall( id )
        .then(function( wall ) {
            _this._interface.displayWallEditor( wall );

            return wall;
        });
};

// wall:update
Services.prototype.updateWall = function( data ) {
    return this._commands.updateWall( data );  // --> wall:updated
};

// wall:select
Services.prototype.selectWall = function( id ) {
    var _this = this;

    return this._queries.getAllWalls()
        .then(function( walls ) {
            _this._interface.displayWallSelector( walls );

            return walls;
        });
};

// wall:display
// wall:created
Services.prototype.displayWall = function( id ) {
    var _this = this, wall;

    return this._queries.getWall( id )
        .then(function( resource ) {
            wall = resource;

            _this._interface.displayWall( wall );  // --> wall:displayed

            return _this.selectBoard( wall )
                .then(function( wall ) {
                    if ( !wall.boards.length ) {
                        return _this._interface.notifyWallFirstTime( wall );  // --> wall:firsttime
                    }

                    return wall;
                });
        });
};

module.exports = Services;

},{"rsvp":121}],15:[function(require,module,exports){

var cardHeight = 65;
var cardWidth = 100;

function MovementTracker( queue, commands, queries ) {
    this._queue = queue;
    this._commands = commands;
    this._queries = queries;

    this._regionalcards = {};
}

MovementTracker.prototype.trackCardMovement = function( location ) {
    var _this = this
      , patch = {
            in: []
          , out: []
        }
      , card;

    this._queries
        .getPocket( location.getPocket() )
        .then(function( resource ) {
            card = resource;

            return _this._queries.getBoard( location.getBoard() );
        })
        .then(function( board ) {
            return _this._queries.getRegionsForBoard( board );
        })
        .then(function( regions ) {
            var update = [];

            regions.forEach(function( region ) {
                var regionid = region.getId()
                  , isInRegion = cardIsInRegion.call( _this, location, region )
                  , areLinked = ~card.getRegions().indexOf( regionid );

                if ( isInRegion ) {
                    if (!areLinked) {
                        patch.in.push( region ); // mark region going in
                    }

                    update.push( regionid );

                    return;
                }

                if ( areLinked ) {
                    patch.out.push( region ); // mark region comming out
                }
            });

            if ( !patch.in.length && !patch.out.length ) return card;

            card.regions = update;

            return _this._commands
                .updatePocket( card )
                .then(function( card ) {
                    patch.out.forEach(function( region ) {
                        _this._queue.emit( 'pocket:regionexit', { pocket: card, region: region } );
                    });

                    patch.in.forEach(function( region ) {
                        _this._queue.emit( 'pocket:regionenter', { pocket: card, region: region } );
                    });

                    return card;
                });
        });
};

MovementTracker.prototype.trackRegionMovement = function( region ) {
    var _this = this;

    this._queries
        .getBoard( region.getBoard() )
        .then(function( board ) {
            return _this._queries.getCardLocationsForBoard( board );
        })
        .then(function( cards ) {
            cards.forEach(function( card ) {
                if ( !cardIsInRegion.call( _this, card, region ) ) {
                    markPocketAsNotInRegion.call( _this, card.getPocket(), region );
                }
            });

            return cards;
        })
        .then(function( cards ) {
            cards.forEach(function( card ) {
                if ( cardIsInRegion.call( _this, card, region ) ) {
                    markPocketAsInRegion.call( _this, card.getPocket(), region );
                }
            });
        });
};

function cardIsInRegion( card, region ) {
    var cardX = (card.x + (cardWidth / 2))
      , cardY = (card.y + (cardHeight / 2))
      , inLeft = cardX > region.x
      , inRight = cardX < (region.x + region.width)
      , inTop = cardY > region.y
      , inBase = cardY < (region.y + region.height);

    return ( inLeft && inRight && inTop && inBase );
}

function markPocketAsInRegion( pocketid, region ) {
    var _this = this;

    return this._queries
        .getPocket( pocketid )
        .then(function( pocket ) {
            var numregions = pocket.getRegions().length;

            pocket.addRegion( region );

            if (pocket.getRegions().length > numregions) {
                return _this._commands
                    .updatePocket( pocket )
                    .then(function( pocket ) {
                        _this._queue.emit( 'pocket:regionenter', { pocket: pocket, region: region } );
                    });

            }
        });
}

function markPocketAsNotInRegion( pocketid, region ) {
    var _this = this;

    return this._queries
        .getPocket( pocketid )
        .then(function( pocket ) {
            var numregions = pocket.getRegions().length;

            pocket.removeRegion( region );

            if (pocket.getRegions().length < numregions) {
                return _this._commands
                    .updatePocket( pocket )
                    .then(function() {
                        app.queue.emit( 'pocket:regionexit', { pocket: pocket, region: region } );
                    });
            }
        });
}

module.exports = MovementTracker;

},{}],16:[function(require,module,exports){

function TransformManager( queue, commands, queries ) {
    this._queue = queue;
    this._commands = commands;
    this._queries = queries;

    this._regionalcards = {};
}

TransformManager.prototype.checkTransforms = function( data ) {
    var pocket = data.pocket
      , region = data.region;

    return this._queries.getAllTransforms()
        .then(function( resources ) {
            resources.forEach(function( transform ) {
                processTransform.call( this, transform, pocket, region );
            });
        });
};

function processTransform( transform, pocket, region ) {
    var rules = transform.rules
      , attr = rules.attr
      , when = rules.when
      , from = rules.from
      , canApply = checkCanApplyTransform( region, when, from.selector );

    if ( canApply ) {
        pocket[attr] = region[from.attr];

        // this._queue.emit( 'pocket:transformed', pocket );

        this._commands.updatePocket( pocket );
    }
}

function checkCanApplyTransform( region, when, filter ) {
    if ( when.relationship === 'within' && when.filter === 'region' && filter.node === 'region' ) {
        return filterMethods[typeof filter.selector]( region, filter );
    }

    return false;
}

var filterMethods = {
    'string': function( region, filter ) {
        return region.getId() === filter.selector.replace('#', '');
    }
  , 'object': function( region, filter ) {
        var f = filter.selector;

        return region[f.node] === f.selector.replace('#', '');
    }
};

module.exports = TransformManager;

},{}],17:[function(require,module,exports){
var util = require("util")
  , events = require("events")
  , RSVP = require('rsvp')
  , Promise = RSVP.Promise
  , Repository = require('./repository');

// Adapter
//    .resource( 'card', ModelFactory.constructor )
//    .schema( ModelFactory.schema )
//    .validator( ModelFactory.validator )
//    .beforeCreate( onBeforeCreate )         // function returns data to succeed, returns falsey to fail
//    .beforeUpdate( onBeforeUpdate );        // function returns data to succeed, returns falsey to fail
//
//  Adapter.create( 'card', data ).then( done, fail );
//  Adapter.update( 'card', data ).then( done, fail );
//  Adapter.delete( 'card', id ).then( done, fail );
//  Adapter.find( 'card', id ).then( done, fail );
//  Adapter.findMany( 'card', query || [ id ] ).then( done, fail );
//  Adapter.findAll( 'card' ).then( done, fail );

// public interface

function Adapter( dbname, options ) {
    this._repository = new Repository( dbname, options );

    events.EventEmitter.call(this);
}

util.inherits( Adapter, events.EventEmitter );

Adapter.prototype.constructor = Adapter;

Adapter.prototype._factories = {};
Adapter.prototype._validators = {};
Adapter.prototype._beforeCreate = {};
Adapter.prototype._beforeUpdate = {};

Adapter.prototype.resource = function( schema, factory ) {
    if (!factory) {
        if (!this._context) throw new Error( 'No schema name defined in context' );

        factory = schema;
        schema = this._context;
    }

    this._factories[schema] = factory;

    this._context = schema;

    return this;
};

Adapter.prototype.schema = function( schema, definition ) {
    if (!definition) {
        if (!this._context) throw new Error( 'No schema name defined in context' );

        definition = schema;
        schema = this._context;
    }

    this._repository.schema( schema, definition, true );

    this._context = schema;

    return this;
};

Adapter.prototype.validator = function( schema, validator ) {
    if (!validator) {
        if (!this._context) throw new Error( 'No schema name defined in context' );

        validator = schema;
        schema = this._context;
    }

    this._validators[schema] = validator;

    this._context = schema;

    return this;
};

Adapter.prototype.beforeCreate = function( schema, transform ) {
    if (!transform) {
        if (!this._context) throw new Error( 'No schema name defined in context' );

        transform = schema;
        schema = this._context;
    }

    this._beforeCreate[schema] = this._beforeCreate[schema] || [];
    this._beforeCreate[schema].push(transform);

    this._context = schema;

    return this;
};

Adapter.prototype.beforeUpdate = function( schema, transform ) {
    if (!transform) {
        if (!this._context) throw new Error( 'No schema name defined in context' );

        transform = schema;
        schema = this._context;
    }

    this._beforeUpdate[schema] = this._beforeUpdate[schema] || [];
    this._beforeUpdate[schema].push(transform);

    this._context = schema;

    return this;
};

Adapter.prototype.create = function( schema, data ) {
    var _this = this
      , validator = _this._validators[schema]( data );

    return new Promise(function( resolve, reject ) {
        if ( !validator.validForCreate ) {
            var error = new Error( 'Schema validation failed: ' + validator.issues.join(', ') );

            _this.emit( schema + ':createfail', {
                id: data.id,
                err: error
            });

            throw error;
        }

        _this._repository
            .create( schema, _onBeforeTransforms( _this._beforeCreate[schema], data ) )
            .then( _this._factories[schema] )
            .then(function( doc ) {
                  _this.emit( schema + ':created', doc );

                  resolve( doc );
            })
            .catch(function( err ) {
                  _this.emit( schema + ':createfail', {
                      id: data._id,
                      err: err
                  });

                  reject( err );
            });

    });
};

Adapter.prototype.update = function( schema, data ) {
    var _this = this
      , validator = _this._validators[schema]( data );

    return new Promise(function( resolve, reject ) {
        if ( !validator.validForUpdate ) {
            var error = new Error( 'Schema validation failed: ' + validator.issues.join(', ') );

            _this.emit( schema + ':updatefail', {
                id: data.id,
                err: error
            });

            throw error;
        }

        _this._repository
            .update( schema, _onBeforeTransforms( _this._beforeUpdate[schema], data ) )
            .then( _this._factories[schema] )
            .then(function( doc ) {
                  _this.emit( schema + ':updated', doc );

                  resolve( doc );
            })
            .catch(function( err ) {
                  _this.emit( schema + ':updatefail', {
                      id: data._id,
                      err: err
                  });

                  reject( err );
            });

    });
};

Adapter.prototype.delete = function( schema, id ) {
    var _this = this;

    return this._repository
        .delete( schema, id )
        .then(function( doc ) {
              _this.emit( schema + ':deleted', doc );

              return doc;
        })
        .catch(function( err ) {
              _this.emit( schema + ':deletefail', {
                  id: data._id,
                  err: err
              });
        });
};

Adapter.prototype.find = function( schema, id ) {
    var _this = this;

    return this._repository
        .find( schema, id )
        .then( _this._factories[schema] );
};

Adapter.prototype.findMany = function( schema, ids ) {
    var _this = this;

    return this._repository
        .findMany( schema, ids )
        .then(function( resources ) {
            return resources.map(function( resource ) {
                return new _this._factories[schema]( resource );
            });
        });
};

Adapter.prototype.findAll = function( schema ) {
    return this.findMany( schema );
};

// private methods

function _onBeforeTransforms( transforms, data ) {
    transforms
        .forEach(function( transform ) {
            data = transform( data );
        });

    return data;
}

module.exports = Adapter;

},{"./repository":20,"events":57,"rsvp":121,"util":61}],18:[function(require,module,exports){
var Belt = require('./adapter');

module.exports = Belt;

},{"./adapter":17}],19:[function(require,module,exports){

/*
  TODO: if model had access to the shema it could store optimised views for quickly finding related documents

  view key could be [ PROPERTY_NAME, RELATED_DOC_ID, DOC_ID ]
*/

function _docMatchesQuery( doc, query ) {
    for (var key in query) {
        if (!doc.hasOwnProperty( key ) || doc[ key ] !== query[ key ]) return false;
    }

    return true;
}

function Model( db, name ) {
    this._db = db;
    this._name = name;
}

Model.prototype = {

    constructor: Model

  , post: function( data, cb /* error, resource */ ) {
        var model = this;

        data.doctype = this._name;

        model._db.post( data, function( err, info ) {
            if ( err && err.message ) {
                return cb( new Error( err.message ) );
            }

            cb( undefined, info );
        });
    }

  , postMany: function( updates, cb ) {
        this.putMany( updates, cb );
    }

  , put: function( update, id, cb /* error */ ) {
        if ( typeof id === 'function' ) {
            cb = id;
            id = update.id;
        }

        var model = this;

        update.doctype = model._name;

        model._db.put( update, id, update._rev, onComplete);

        function onComplete( err, info ) {
            if ( err && err.message ) {
                return cb( new Error( err.message ) );
            }

            cb( undefined, info );
        }
    }

  , putMany: function( updates, cb ) {
        var model = this;

        updates.forEach(function( update ) {
            update.doctype = model._name;
        });

        model._db.bulkDocs( updates, onComplete);

        function onComplete( err, info ) {
            if ( err && err.message ) {
                return cb( new Error( err.message ) );
            }

            cb( undefined, info );
        }
    }

  , remove: function( id, rev, cb /* error */ ) {
        if ( typeof rev === 'function' ) {
          cb = rev;
          rev = id._rev;
          id = id._id;
        }

        var model = this;

        model._db.remove( id, rev, onComplete);

        function onComplete( err, info ) {
            if ( err && err.message ) {
                return cb( new Error( err.message ) );
            }

            cb( undefined, info );
        }
    }

  , get: function( id, cb /* error, resource */ ) {
        var model = this;

        model._db.get( id, onComplete);

        function onComplete( err, resource ) {
            if ( err && err.message ) {
                return cb( new Error( err.message ) );
            }

            cb( undefined, resource );
        }
    }

  , query: function( mapObj, options, cb /* error, resource */ ) {
        if ( typeof options === 'function' ) {
          cb = options;
          options = {};
        }

        var model = this;

        options.include_docs = true;

        var mapQuery = {
            map: function( doc, emit ) {
                if ( doc.doctype === model._name ) {
                    mapObj.map( doc, emit );
                }
            }
        };

        model._db.query( mapQuery, { include_docs: true }, onComplete );

        function onComplete( err, response ) {
            if ( err && err.message ) {
                return cb( new Error( err.message ) );
            }

            if ( response.total_rows === 0 ) {
                return cb( undefined, [] );
            }

            cb( undefined, response.rows.map(function( row ) { return row.doc; }) );
        }
    }

  , firstDoc: function( query, cb /* error, resource */ ) {
        var model = this;

        model.allDocs( query, onComplete);

        function onComplete( err, response ) {
            if ( err ) return cb( err );

            if ( response.length ) {
                cb( undefined, response[0] );
            }
        }
    }

  , allDocs: function( query, cb /* error, resources */ ) {
        var model = this;

        if ( Array.isArray(query.keys) ) {
            model._db
                .allDocs({ keys: query.keys, include_docs: true }, function( err, response ) {
                    if ( err && err.message ) {
                        return cb( new Error( err.message ) );
                    }

                    onComplete( err, response );
                });

            return;
        }

        var map = {
            map: function( doc, emit ) {
                if ( doc.doctype === model._name && _docMatchesQuery( doc, query ) ) {
                    emit();
                }
            }
        };

        model.query( map, onComplete );

        function onComplete( err, response ) {
            if ( err ) return cb( err );

            if ( Array.isArray(response) ) return cb( undefined, response );

            if ( response.total_rows === 0 ) return cb( undefined, [] );

            cb( undefined, response.rows.map(function( row ) { return row.doc; }) );
        }
    }

};

module.exports = Model;

},{}],20:[function(require,module,exports){
var util = require("util")
  , events = require("events")
  , PouchDB = require('pouchdb')
  , RSVP = require('rsvp')
  , Promise = RSVP.Promise
  , Model = require('./model');

// Repository
// Follows the interface for the fortuneJS library adapters in an attempt to provide additional db options easily

function Repository( dbname, options ) {
    if ( typeof dbname !== 'string' ) {
        throw new Error( 'dbname must be provided' );
    }

    options = options || {};
    options.dbname = dbname;

    this._init( options );
}

util.inherits( Repository, events.EventEmitter );

Repository.prototype.constructor = Repository;

Repository.prototype._models = {};
Repository.prototype._schemas = {};
Repository.prototype._options = {};

Repository.prototype._init = function( options ) {
    for (var key in options) {
        if (key === 'dbname' || !options.hasOwnProperty(key)) continue;

        this._options[key] = options[key];
    }

    this.db = new PouchDB( options.dbname, this._options );

    _watchForChanges.call( this, {
        include_docs: true
      , since: 'now'
      , live: true
    });

    events.EventEmitter.call(this);
};

Repository.prototype.schema = function( name, schema, alsoCreateModel ) {
    for( var key in schema ) {
        var value = schema[ key ]
          , obj = {}
          , isArray = Array.isArray( value );

        value = isArray ? value[0] : value;

        var isObject = _isObject( value )
          , ref = isObject ? value.ref : value
          , inverse = isObject ? value.inverse : undefined;

        // Convert string to association object
        if ( typeof ref === 'string' ) {
            obj.ref = ref;
            obj.inverse = inverse;
            schema[ key ] = isArray ? [ obj ] : obj;
        }

        // Wrap native type in object
        if ( typeof value === 'function' ) {
            schema[ key ] = isArray ? [{ type: schema[ key ] }] : { type: schema[ key ] };
        }

    }

    this._schemas[ name ] = schema;

    if (alsoCreateModel) this.model( name, schema );

    return schema;
};

Repository.prototype.model = function( name, schema ) {
    var model;

    if ( schema ) {
        model = new Model( this.db, name );

        this._models[ name ] = model;
    } else {
        model = this._models[ name ];

        if (!model) throw new Error( 'Schema ['+name+'] not registered.' );
    }

    return model;
};

// TODO: array of updates should invoke postMany

Repository.prototype.create = function( model, id, resource ) {
    var _this = this;

    if (!resource) {
        resource = id;
    } else {
        resource.id = id;
    }

    model = typeof model === 'string' ? this.model( model ) : model;
    resource = _serialize.call( _this, model, resource );

    return new Promise(function ( resolve, reject ) {
        model.post( resource, function ( error, info ) {
            if (error) return reject(error);

            resource._id = info.id;
            resource._rev = info.rev;

            _handleWrite.call( _this, model, resource, error, resolve, reject );
        });
    });
};

// TODO: array of updates should invoke putMany

Repository.prototype.update = function( model, id, update ) {
    var _this = this;

    if (!update) {
        update = id;
    } else {
        update.id = id;
    }

    id = update.id;

    model = typeof model === 'string' ? this.model( model ) : model;
    update = _serialize.call( _this, model, update);

    return new Promise(function (resolve, reject) {
        // have to do a get to find the latest revision
        model.get( id, function( err, resource ) {
            if ( err ) return reject( err );

            update._id = id;
            update._rev = resource._rev;

            model.put( update, function (error, info) {
                if (error) return reject(error);

                update._rev = info.rev;

                _handleWrite.call( _this, model, update, error, resolve, reject );
            });
        });
    });
};

// TODO: array of ids should invoke removeMany

Repository.prototype.delete = function( model, id ) {
    var _this = this;

    model = typeof model === 'string' ? this.model(model) : model;

    return new Promise(function ( resolve, reject ) {
        model.get(id, function ( error, resource ) {
            if (error || !resource) return reject(error);

            resource = _dissociate.call( _this, model, resource );

            model.remove( resource, function ( error ) {
                _handleWrite.call( _this, model, resource, error, resolve, reject );
            });
        });
    });
};

Repository.prototype.find = function( model, query ) {
    var _this = this
      , method = typeof query != 'object' ? 'get' : 'firstDoc';

    model = typeof model == 'string' ? this.model(model) : model;

    return new Promise(function (resolve, reject) {
        model[method](query, function (error, resource) {
                if (error || !resource) return reject(error);

                resolve( _deserialize.call( _this, model, resource) );
            });
    });
};

Repository.prototype.findMany = function( model, query ) {
    var _this = this;

    if ( Array.isArray(query) ) {
        query = query.length ? { keys: query } : {};
    } else if (!query) {
        query = {};
    }

    model = typeof model === 'string' ? this.model(model) : model;

    return new RSVP.Promise(function (resolve, reject) {
        model.allDocs( query, function (error, resources) {
            if (error) return reject(error);

            resources = resources.map(function (resource) {
                return _deserialize.call( _this, model, resource);
            });

            resolve(resources);
        });
    });
};


// private methods

function _watchForChanges(options ) {
    var _this = this;

    _this.db.changes( options )
        .on('create', function( ev ) {
            var doc = ev.doc;
            _this.emit( doc.doctype + ':created', doc );
        })
        .on('update', function( ev ) {
            var doc = ev.doc;
            _this.emit( doc.doctype + ':updated', doc );
        })
        .on('delete', function( ev ) {
            var doc = ev.doc;
            _this.emit( doc.doctype + ':deleted', doc );
        });
}

function _handleWrite( model, resource, error, resolve, reject ) {
    var _this = this;

    if (error || !resource) return reject(error);

    _updateRelationships
        .call( this, model, resource)
        .then(function (resource) {
            resolve( _deserialize.call( _this, model, resource ) );
        }, reject);
}

function _serialize( model, resource ) {
    // setting ID is not allowed
    if (resource.hasOwnProperty('id')) {
        delete resource.id;
    }
    if (resource.hasOwnProperty('_id')) {
        delete resource._id;
    }
    // setting rev is not allowed
    if (resource.hasOwnProperty('rev')) {
        delete resource.rev;
    }
    if (resource.hasOwnProperty('_rev')) {
        delete resource._rev;
    }
    // setting doctype is not allowed
    if (resource.hasOwnProperty('doctype')) {
        delete resource.doctype;
    }

    // flatten links
    if (resource.hasOwnProperty('links') && typeof resource.links === 'object') {
        for ( var key in resource.links ) {
            resource[key] = resource.links[key];
        }

        delete resource.links;
    }

    return _scrubResource.call( this, model, resource );
}

function _deserialize( model, resource ) {
    var json = {}
      , schema = this._schemas[ model._name ];

    json.id = resource._id;
    json.rev = resource._rev;

    var relations = [];
    for ( var key in schema ) {
        if (key === '_id') continue;

        var value = schema[key];

        json[key] = resource[key];

        if (Array.isArray(value) ? value[0].ref : value.ref) {
            relations.push(key);
        }
    }

    if (relations.length) {
        var links = {}
          , linksAdded = false;

        relations.forEach(function (relation) {
            if ( Array.isArray(json[relation]) ? json[relation].length : json[relation] ) {
                links[relation] = json[relation];
                linksAdded = true;
            }

            delete json[relation];
        });

        if ( linksAdded ) {
            json.links = links;
        }
    }

    return json;
}

function _scrubResource( model, resource ) {
    var json = {};

    var schema = this._schemas[ model._name ];

    for (var key in schema ) {
        if (!resource.hasOwnProperty(key)) continue;

        var value = schema[key]
          , type = value.type
          , typeString = type ? typeCheck(type) : ''
          , ref = Array.isArray(value) ? value[0].ref : value.ref;

        if (type && !ref) {
            json[key] = type(resource[key]);

            if (typeString === 'date') {
                json[key] = new Date(resource[key]);
            } else if (typeString === 'array' || typeString === 'object') {
                json[key] = typeof resource[key] === 'object' ? resource[key] : null;
            }
        } else if (ref) {
            json[key] = resource[key];
        }
    }

    return json;

    function typeCheck (fn) {
        return Object.prototype.toString.call(new fn(''))
            .slice(1, -1).split(' ')[1].toLowerCase();
    }
}

function _updateRelationships( model, resource ) {
    var _this = this
      , schema = this._schemas[ model._name ]
      , references = _getSchemaFields( schema, function( obj, schema ) { return ( typeof obj === 'object' && obj.hasOwnProperty('ref') ); })
      , promises = [];

    references
        .forEach(function( reference ) {
            if (reference.inverse !== undefined && !reference.inverse) {
                return;
            }

            var relatedModel = _this._models[ reference.model ]
              , relatedSchema = _this._schemas[ reference.model ];

            // Get fields on the related model that reference this model
            if (typeof reference.inverse === 'string') {
                var inverted = {};

                inverted[ reference.inverse ] = relatedSchema[ reference.inverse ];
                relatedSchema = inverted;
            }

            var fields = _getSchemaFields( relatedSchema, function( obj, schema ) { return (typeof obj === 'object' && obj.ref === model._name ); });

            fields
                .forEach(function( field ) {
                    // One-to-one
                    if ( reference.singular && field.singular ) {
                        return promises.push( _updateOneToOne.call( _this, relatedModel, resource, reference, field ) );
                    }
                    // One-to-many
                    if ( reference.singular && !field.singular ) {
                        return promises.push( _updateOneToMany.call( _this, relatedModel, resource, reference, field ) );
                    }
                    // Many-to-one
                    if ( !reference.singular && field.singular ) {
                        return promises.push( _updateManyToOne.call( _this, relatedModel, resource, reference, field ) );
                    }
                    // Many-to-many
                    if ( !reference.singular && !field.singular ) {
                        return promises.push( _updateManyToMany.call( _this, relatedModel, resource, reference, field ) );
                    }
                });
        });

    return new Promise(function (resolve, reject) {
        RSVP.all(promises)
            .then(function () {
                resolve( resource );
            }, function ( errors ) {
                reject( errors );
            });
    });
}

function _getSchemaFields( schema, isValid ) {
    var fields = [];

    for (var key in schema ) {
        var value = schema[ key ]
          , singular = !Array.isArray( value )
          , obj = singular ? value : value[0];

        if ( isValid( obj ) ) {
            fields.push({
                path: key,
                model: obj.ref,
                singular: singular,
                inverse: obj.inverse
            });
          }
    }

    return fields;
}



function _updateOneToOne( relatedModel, resource, reference, field ) {
    var _this = this
      , options = { reduce: false, include_docs: true }
      , dissociate = function( related, emit ) {
            // looking for related document that is set
            if ( related[ field.path ] === resource._id ) {
                emit( related );
            }
        };

    return new Promise(function (resolve, reject) {
        relatedModel
            .query({ map: dissociate }, options, function ( error, responses ) {
                if (error) return reject(error);

                if (!responses.length) return resolve();

                _unsetSingleDocs
                    .call( _this, responses, relatedModel, reference, field, resource )
                    .then( resolve )
                    .catch( reject );
            });
    })
    .then(function() {
        if ( resource[ reference.path ] ) {
            return new Promise(function (resolve, reject) {
                // have to do a get to find the latest revision
                relatedModel.get( resource[ reference.path ], function( error, response ) {
                    if ( error ) return reject( error );

                    var update = _setSingleDoc.call( _this, response, relatedModel, reference, field, resource );

                    relatedModel.put( update, response._id, function( error, info ) {
                        if ( error ) return reject( error );

                        resolve();
                    });
                });
            });
        }
    });
}


function _updateOneToMany( relatedModel, resource, reference, field ) {
      var _this = this
        , options = { reduce: false, include_docs: true }
        , dissociate = function( doc, emit ) {
            if ( doc[ field.path ] !== undefined && ~doc[ field.path ].indexOf( resource._id ) ) {
                emit( doc );
            }
        };

      return new Promise(function (resolve, reject) {
          relatedModel
              .query({ map: dissociate }, options, function ( error, responses ) {
                  if (error) return reject(error);

                  if (!responses.length) return resolve();

                  _removeFromManyDocs
                      .call( _this, responses, relatedModel, reference, field, resource )
                      .then( resolve )
                      .catch( reject );
              });
      })
      .then(function() {
          if ( resource[ reference.path ] ) {
              return new Promise(function (resolve, reject) {
                  // have to do a get to find the latest revision
                  relatedModel.get( resource[ reference.path ], function( error, response ) {
                      if ( error ) return reject( error );

                      var update = _addSingleDoc.call( _this, response, relatedModel, reference, field, resource );

                      relatedModel.put( update, response._id, function( error, info ) {
                          if ( error ) return reject( error );

                          resolve();
                      });
                  });
              });
          }
      });
}

function _updateManyToOne( relatedModel, resource, reference, field ) {
    var _this = this
      , options = { reduce: false, include_docs: true }
      , dissociate = function( doc, emit ) {
          if ( doc[ field.path ] === resource._id ) {
              emit( doc );
          }
      };

    return new Promise(function (resolve, reject) {
        relatedModel
            .query({ map: dissociate }, options, function ( error, responses ) {
                if ( error ) return reject( error );

                if (!responses.length) return resolve();

                _unsetSingleDocs
                    .call( _this, responses, relatedModel, reference, field, resource )
                    .then( resolve )
                    .catch( reject );
            });
    })
    .then(function() {
        if ( resource[ reference.path ] ) {
            return new Promise(function (resolve, reject) {
                relatedModel.allDocs({ keys: resource[ reference.path ], include_docs: true }, function ( error, responses ) {
                    if ( error ) return reject( error );

                    if (!responses.length) return resolve();

                    var updates = _applyToManyDocs.call( _this, _setSingleDoc, responses, relatedModel, reference, field, resource );

                    return relatedModel.putMany( updates, function( error, info ) {
                        if ( error ) return reject( error );

                        resolve();
                    });
                });
            });
        }
    });
}

function _updateManyToMany( relatedModel, resource, reference, field ) {
    var _this = this
      , options = { reduce: false, include_docs: true }
      , dissociate = function( doc, emit ) {
          if ( doc._id === resource._id || doc[ field.path ] === undefined ) return;

          var docIsLinked = doc[ field.path ].indexOf( resource._id ) >= 0;
          var resourceIsNoLongerLinked = ( resource[ reference.path ] === undefined || resource[ reference.path ].indexOf( doc._id ) < 0 );

          if ( docIsLinked && resourceIsNoLongerLinked ) emit( doc );
      };

    return new Promise(function (resolve, reject) {
        relatedModel
            .query({ map: dissociate }, options, function ( error, responses ) {
                if ( error ) return reject( error );

                if (!responses.length) return resolve();

                _removeFromManyDocs
                    .call( _this, responses, relatedModel, reference, field, resource )
                    .then( resolve )
                    .catch( reject );
            });
    })
    .then(function() {
        if ( resource[ reference.path ] ) {
            return new Promise(function (resolve, reject) {
                relatedModel.allDocs({ keys: resource[ reference.path ], include_docs: true }, function ( error, responses ) {
                    if ( error ) return reject( error );

                    if (!responses.length) return resolve();

                    var updates = _applyToManyDocs.call( _this, _addSingleDoc, responses, relatedModel, reference, field, resource );

                    return relatedModel.putMany( updates, function( error, info ) {
                        if ( error ) return reject( error );

                        resolve();
                    });
                });
            });
        }
    });
}

function _unsetSingleDocs( rows, relatedModel, reference, field, resource ) {
    var _this = this;

    return new Promise(function ( resolve, reject ) {
        var updates = rows.map(function( doc ) {
                doc[ field.path ] = undefined;

                return doc;
            });

        return relatedModel.putMany( updates, function( error, info ) {
            if ( error ) return reject( error );

            resolve();
        });
    });
}

function _removeFromManyDocs( rows, relatedModel, reference, field, resource ) {
    var _this = this;

    return new Promise(function ( resolve, reject ) {
        var updates = rows.map(function( doc ) {
                doc[ field.path ].splice( doc[ field.path ].indexOf( resource._id ), 1 );

                if ( doc[ field.path ].length <= 0 ) {
                    doc[ field.path ] = undefined;
                }

                return doc;
            });

        return relatedModel.putMany( updates, function( error, info ) {
            if ( error ) return reject( error );

            resolve();
        });
    });
}

function _applyToManyDocs( fun, rows, relatedModel, reference, field, resource ) {
    return rows.map(function( doc ) {
        return fun( doc, relatedModel, reference, field, resource );
    });
}

function _setSingleDoc( doc, relatedModel, reference, field, resource ) {
    doc[ field.path ] = resource._id;

    return doc;
}

function _addSingleDoc( doc, relatedModel, reference, field, resource ) {
    doc[ field.path ] = doc[ field.path ] || [];

    if ( doc[ field.path ].indexOf( resource._id ) < 0 ) {
        doc[ field.path ].push( resource._id );
    }

    return doc;
}

function _dissociate( model, resource ) {
  var schema = this._schemas[model._name];
  for ( var key in schema ) {
      var value = schema[key];

      if ( Array.isArray(value) ? value[0].ref : value.ref ) {
          resource[key] = null;
      }
  }

  return resource;
}

// util methods

function _isObject( o ) {
    return typeof o === "object" && o.constructor === Object && o !== null;
}

module.exports = Repository;

},{"./model":19,"events":57,"pouchdb":83,"rsvp":121,"util":61}],21:[function(require,module,exports){
module.exports = require('./lib/chai');

},{"./lib/chai":22}],22:[function(require,module,exports){
/*!
 * chai
 * Copyright(c) 2011-2014 Jake Luer <jake@alogicalparadox.com>
 * MIT Licensed
 */

var used = []
  , exports = module.exports = {};

/*!
 * Chai version
 */

exports.version = '1.9.1';

/*!
 * Assertion Error
 */

exports.AssertionError = require('assertion-error');

/*!
 * Utils for plugins (not exported)
 */

var util = require('./chai/utils');

/**
 * # .use(function)
 *
 * Provides a way to extend the internals of Chai
 *
 * @param {Function}
 * @returns {this} for chaining
 * @api public
 */

exports.use = function (fn) {
  if (!~used.indexOf(fn)) {
    fn(this, util);
    used.push(fn);
  }

  return this;
};

/*!
 * Configuration
 */

var config = require('./chai/config');
exports.config = config;

/*!
 * Primary `Assertion` prototype
 */

var assertion = require('./chai/assertion');
exports.use(assertion);

/*!
 * Core Assertions
 */

var core = require('./chai/core/assertions');
exports.use(core);

/*!
 * Expect interface
 */

var expect = require('./chai/interface/expect');
exports.use(expect);

/*!
 * Should interface
 */

var should = require('./chai/interface/should');
exports.use(should);

/*!
 * Assert interface
 */

var assert = require('./chai/interface/assert');
exports.use(assert);

},{"./chai/assertion":23,"./chai/config":24,"./chai/core/assertions":25,"./chai/interface/assert":26,"./chai/interface/expect":27,"./chai/interface/should":28,"./chai/utils":39,"assertion-error":48}],23:[function(require,module,exports){
/*!
 * chai
 * http://chaijs.com
 * Copyright(c) 2011-2014 Jake Luer <jake@alogicalparadox.com>
 * MIT Licensed
 */

var config = require('./config');

module.exports = function (_chai, util) {
  /*!
   * Module dependencies.
   */

  var AssertionError = _chai.AssertionError
    , flag = util.flag;

  /*!
   * Module export.
   */

  _chai.Assertion = Assertion;

  /*!
   * Assertion Constructor
   *
   * Creates object for chaining.
   *
   * @api private
   */

  function Assertion (obj, msg, stack) {
    flag(this, 'ssfi', stack || arguments.callee);
    flag(this, 'object', obj);
    flag(this, 'message', msg);
  }

  Object.defineProperty(Assertion, 'includeStack', {
    get: function() {
      console.warn('Assertion.includeStack is deprecated, use chai.config.includeStack instead.');
      return config.includeStack;
    },
    set: function(value) {
      console.warn('Assertion.includeStack is deprecated, use chai.config.includeStack instead.');
      config.includeStack = value;
    }
  });

  Object.defineProperty(Assertion, 'showDiff', {
    get: function() {
      console.warn('Assertion.showDiff is deprecated, use chai.config.showDiff instead.');
      return config.showDiff;
    },
    set: function(value) {
      console.warn('Assertion.showDiff is deprecated, use chai.config.showDiff instead.');
      config.showDiff = value;
    }
  });

  Assertion.addProperty = function (name, fn) {
    util.addProperty(this.prototype, name, fn);
  };

  Assertion.addMethod = function (name, fn) {
    util.addMethod(this.prototype, name, fn);
  };

  Assertion.addChainableMethod = function (name, fn, chainingBehavior) {
    util.addChainableMethod(this.prototype, name, fn, chainingBehavior);
  };

  Assertion.overwriteProperty = function (name, fn) {
    util.overwriteProperty(this.prototype, name, fn);
  };

  Assertion.overwriteMethod = function (name, fn) {
    util.overwriteMethod(this.prototype, name, fn);
  };

  Assertion.overwriteChainableMethod = function (name, fn, chainingBehavior) {
    util.overwriteChainableMethod(this.prototype, name, fn, chainingBehavior);
  };

  /*!
   * ### .assert(expression, message, negateMessage, expected, actual)
   *
   * Executes an expression and check expectations. Throws AssertionError for reporting if test doesn't pass.
   *
   * @name assert
   * @param {Philosophical} expression to be tested
   * @param {String} message to display if fails
   * @param {String} negatedMessage to display if negated expression fails
   * @param {Mixed} expected value (remember to check for negation)
   * @param {Mixed} actual (optional) will default to `this.obj`
   * @api private
   */

  Assertion.prototype.assert = function (expr, msg, negateMsg, expected, _actual, showDiff) {
    var ok = util.test(this, arguments);
    if (true !== showDiff) showDiff = false;
    if (true !== config.showDiff) showDiff = false;

    if (!ok) {
      var msg = util.getMessage(this, arguments)
        , actual = util.getActual(this, arguments);
      throw new AssertionError(msg, {
          actual: actual
        , expected: expected
        , showDiff: showDiff
      }, (config.includeStack) ? this.assert : flag(this, 'ssfi'));
    }
  };

  /*!
   * ### ._obj
   *
   * Quick reference to stored `actual` value for plugin developers.
   *
   * @api private
   */

  Object.defineProperty(Assertion.prototype, '_obj',
    { get: function () {
        return flag(this, 'object');
      }
    , set: function (val) {
        flag(this, 'object', val);
      }
  });
};

},{"./config":24}],24:[function(require,module,exports){
module.exports = {

  /**
   * ### config.includeStack
   *
   * User configurable property, influences whether stack trace
   * is included in Assertion error message. Default of false
   * suppresses stack trace in the error message.
   *
   *     chai.config.includeStack = true;  // enable stack on error
   *
   * @param {Boolean}
   * @api public
   */

   includeStack: false,

  /**
   * ### config.showDiff
   *
   * User configurable property, influences whether or not
   * the `showDiff` flag should be included in the thrown
   * AssertionErrors. `false` will always be `false`; `true`
   * will be true when the assertion has requested a diff
   * be shown.
   *
   * @param {Boolean}
   * @api public
   */

  showDiff: true,

  /**
   * ### config.truncateThreshold
   *
   * User configurable property, sets length threshold for actual and
   * expected values in assertion errors. If this threshold is exceeded,
   * the value is truncated.
   *
   * Set it to zero if you want to disable truncating altogether.
   *
   *     chai.config.truncateThreshold = 0;  // disable truncating
   *
   * @param {Number}
   * @api public
   */

  truncateThreshold: 40

};

},{}],25:[function(require,module,exports){
/*!
 * chai
 * http://chaijs.com
 * Copyright(c) 2011-2014 Jake Luer <jake@alogicalparadox.com>
 * MIT Licensed
 */

module.exports = function (chai, _) {
  var Assertion = chai.Assertion
    , toString = Object.prototype.toString
    , flag = _.flag;

  /**
   * ### Language Chains
   *
   * The following are provided as chainable getters to
   * improve the readability of your assertions. They
   * do not provide testing capabilities unless they
   * have been overwritten by a plugin.
   *
   * **Chains**
   *
   * - to
   * - be
   * - been
   * - is
   * - that
   * - and
   * - has
   * - have
   * - with
   * - at
   * - of
   * - same
   *
   * @name language chains
   * @api public
   */

  [ 'to', 'be', 'been'
  , 'is', 'and', 'has', 'have'
  , 'with', 'that', 'at'
  , 'of', 'same' ].forEach(function (chain) {
    Assertion.addProperty(chain, function () {
      return this;
    });
  });

  /**
   * ### .not
   *
   * Negates any of assertions following in the chain.
   *
   *     expect(foo).to.not.equal('bar');
   *     expect(goodFn).to.not.throw(Error);
   *     expect({ foo: 'baz' }).to.have.property('foo')
   *       .and.not.equal('bar');
   *
   * @name not
   * @api public
   */

  Assertion.addProperty('not', function () {
    flag(this, 'negate', true);
  });

  /**
   * ### .deep
   *
   * Sets the `deep` flag, later used by the `equal` and
   * `property` assertions.
   *
   *     expect(foo).to.deep.equal({ bar: 'baz' });
   *     expect({ foo: { bar: { baz: 'quux' } } })
   *       .to.have.deep.property('foo.bar.baz', 'quux');
   *
   * @name deep
   * @api public
   */

  Assertion.addProperty('deep', function () {
    flag(this, 'deep', true);
  });

  /**
   * ### .a(type)
   *
   * The `a` and `an` assertions are aliases that can be
   * used either as language chains or to assert a value's
   * type.
   *
   *     // typeof
   *     expect('test').to.be.a('string');
   *     expect({ foo: 'bar' }).to.be.an('object');
   *     expect(null).to.be.a('null');
   *     expect(undefined).to.be.an('undefined');
   *
   *     // language chain
   *     expect(foo).to.be.an.instanceof(Foo);
   *
   * @name a
   * @alias an
   * @param {String} type
   * @param {String} message _optional_
   * @api public
   */

  function an (type, msg) {
    if (msg) flag(this, 'message', msg);
    type = type.toLowerCase();
    var obj = flag(this, 'object')
      , article = ~[ 'a', 'e', 'i', 'o', 'u' ].indexOf(type.charAt(0)) ? 'an ' : 'a ';

    this.assert(
        type === _.type(obj)
      , 'expected #{this} to be ' + article + type
      , 'expected #{this} not to be ' + article + type
    );
  }

  Assertion.addChainableMethod('an', an);
  Assertion.addChainableMethod('a', an);

  /**
   * ### .include(value)
   *
   * The `include` and `contain` assertions can be used as either property
   * based language chains or as methods to assert the inclusion of an object
   * in an array or a substring in a string. When used as language chains,
   * they toggle the `contain` flag for the `keys` assertion.
   *
   *     expect([1,2,3]).to.include(2);
   *     expect('foobar').to.contain('foo');
   *     expect({ foo: 'bar', hello: 'universe' }).to.include.keys('foo');
   *
   * @name include
   * @alias contain
   * @param {Object|String|Number} obj
   * @param {String} message _optional_
   * @api public
   */

  function includeChainingBehavior () {
    flag(this, 'contains', true);
  }

  function include (val, msg) {
    if (msg) flag(this, 'message', msg);
    var obj = flag(this, 'object');
    var expected = false;
    if (_.type(obj) === 'array' && _.type(val) === 'object') {
      for (var i in obj) {
        if (_.eql(obj[i], val)) {
          expected = true;
          break;
        }
      }
    } else if (_.type(val) === 'object') {
      if (!flag(this, 'negate')) {
        for (var k in val) new Assertion(obj).property(k, val[k]);
        return;
      }
      var subset = {}
      for (var k in val) subset[k] = obj[k]
      expected = _.eql(subset, val);
    } else {
      expected = obj && ~obj.indexOf(val)
    }
    this.assert(
        expected
      , 'expected #{this} to include ' + _.inspect(val)
      , 'expected #{this} to not include ' + _.inspect(val));
  }

  Assertion.addChainableMethod('include', include, includeChainingBehavior);
  Assertion.addChainableMethod('contain', include, includeChainingBehavior);

  /**
   * ### .ok
   *
   * Asserts that the target is truthy.
   *
   *     expect('everthing').to.be.ok;
   *     expect(1).to.be.ok;
   *     expect(false).to.not.be.ok;
   *     expect(undefined).to.not.be.ok;
   *     expect(null).to.not.be.ok;
   *
   * @name ok
   * @api public
   */

  Assertion.addProperty('ok', function () {
    this.assert(
        flag(this, 'object')
      , 'expected #{this} to be truthy'
      , 'expected #{this} to be falsy');
  });

  /**
   * ### .true
   *
   * Asserts that the target is `true`.
   *
   *     expect(true).to.be.true;
   *     expect(1).to.not.be.true;
   *
   * @name true
   * @api public
   */

  Assertion.addProperty('true', function () {
    this.assert(
        true === flag(this, 'object')
      , 'expected #{this} to be true'
      , 'expected #{this} to be false'
      , this.negate ? false : true
    );
  });

  /**
   * ### .false
   *
   * Asserts that the target is `false`.
   *
   *     expect(false).to.be.false;
   *     expect(0).to.not.be.false;
   *
   * @name false
   * @api public
   */

  Assertion.addProperty('false', function () {
    this.assert(
        false === flag(this, 'object')
      , 'expected #{this} to be false'
      , 'expected #{this} to be true'
      , this.negate ? true : false
    );
  });

  /**
   * ### .null
   *
   * Asserts that the target is `null`.
   *
   *     expect(null).to.be.null;
   *     expect(undefined).not.to.be.null;
   *
   * @name null
   * @api public
   */

  Assertion.addProperty('null', function () {
    this.assert(
        null === flag(this, 'object')
      , 'expected #{this} to be null'
      , 'expected #{this} not to be null'
    );
  });

  /**
   * ### .undefined
   *
   * Asserts that the target is `undefined`.
   *
   *     expect(undefined).to.be.undefined;
   *     expect(null).to.not.be.undefined;
   *
   * @name undefined
   * @api public
   */

  Assertion.addProperty('undefined', function () {
    this.assert(
        undefined === flag(this, 'object')
      , 'expected #{this} to be undefined'
      , 'expected #{this} not to be undefined'
    );
  });

  /**
   * ### .exist
   *
   * Asserts that the target is neither `null` nor `undefined`.
   *
   *     var foo = 'hi'
   *       , bar = null
   *       , baz;
   *
   *     expect(foo).to.exist;
   *     expect(bar).to.not.exist;
   *     expect(baz).to.not.exist;
   *
   * @name exist
   * @api public
   */

  Assertion.addProperty('exist', function () {
    this.assert(
        null != flag(this, 'object')
      , 'expected #{this} to exist'
      , 'expected #{this} to not exist'
    );
  });


  /**
   * ### .empty
   *
   * Asserts that the target's length is `0`. For arrays, it checks
   * the `length` property. For objects, it gets the count of
   * enumerable keys.
   *
   *     expect([]).to.be.empty;
   *     expect('').to.be.empty;
   *     expect({}).to.be.empty;
   *
   * @name empty
   * @api public
   */

  Assertion.addProperty('empty', function () {
    var obj = flag(this, 'object')
      , expected = obj;

    if (Array.isArray(obj) || 'string' === typeof object) {
      expected = obj.length;
    } else if (typeof obj === 'object') {
      expected = Object.keys(obj).length;
    }

    this.assert(
        !expected
      , 'expected #{this} to be empty'
      , 'expected #{this} not to be empty'
    );
  });

  /**
   * ### .arguments
   *
   * Asserts that the target is an arguments object.
   *
   *     function test () {
   *       expect(arguments).to.be.arguments;
   *     }
   *
   * @name arguments
   * @alias Arguments
   * @api public
   */

  function checkArguments () {
    var obj = flag(this, 'object')
      , type = Object.prototype.toString.call(obj);
    this.assert(
        '[object Arguments]' === type
      , 'expected #{this} to be arguments but got ' + type
      , 'expected #{this} to not be arguments'
    );
  }

  Assertion.addProperty('arguments', checkArguments);
  Assertion.addProperty('Arguments', checkArguments);

  /**
   * ### .equal(value)
   *
   * Asserts that the target is strictly equal (`===`) to `value`.
   * Alternately, if the `deep` flag is set, asserts that
   * the target is deeply equal to `value`.
   *
   *     expect('hello').to.equal('hello');
   *     expect(42).to.equal(42);
   *     expect(1).to.not.equal(true);
   *     expect({ foo: 'bar' }).to.not.equal({ foo: 'bar' });
   *     expect({ foo: 'bar' }).to.deep.equal({ foo: 'bar' });
   *
   * @name equal
   * @alias equals
   * @alias eq
   * @alias deep.equal
   * @param {Mixed} value
   * @param {String} message _optional_
   * @api public
   */

  function assertEqual (val, msg) {
    if (msg) flag(this, 'message', msg);
    var obj = flag(this, 'object');
    if (flag(this, 'deep')) {
      return this.eql(val);
    } else {
      this.assert(
          val === obj
        , 'expected #{this} to equal #{exp}'
        , 'expected #{this} to not equal #{exp}'
        , val
        , this._obj
        , true
      );
    }
  }

  Assertion.addMethod('equal', assertEqual);
  Assertion.addMethod('equals', assertEqual);
  Assertion.addMethod('eq', assertEqual);

  /**
   * ### .eql(value)
   *
   * Asserts that the target is deeply equal to `value`.
   *
   *     expect({ foo: 'bar' }).to.eql({ foo: 'bar' });
   *     expect([ 1, 2, 3 ]).to.eql([ 1, 2, 3 ]);
   *
   * @name eql
   * @alias eqls
   * @param {Mixed} value
   * @param {String} message _optional_
   * @api public
   */

  function assertEql(obj, msg) {
    if (msg) flag(this, 'message', msg);
    this.assert(
        _.eql(obj, flag(this, 'object'))
      , 'expected #{this} to deeply equal #{exp}'
      , 'expected #{this} to not deeply equal #{exp}'
      , obj
      , this._obj
      , true
    );
  }

  Assertion.addMethod('eql', assertEql);
  Assertion.addMethod('eqls', assertEql);

  /**
   * ### .above(value)
   *
   * Asserts that the target is greater than `value`.
   *
   *     expect(10).to.be.above(5);
   *
   * Can also be used in conjunction with `length` to
   * assert a minimum length. The benefit being a
   * more informative error message than if the length
   * was supplied directly.
   *
   *     expect('foo').to.have.length.above(2);
   *     expect([ 1, 2, 3 ]).to.have.length.above(2);
   *
   * @name above
   * @alias gt
   * @alias greaterThan
   * @param {Number} value
   * @param {String} message _optional_
   * @api public
   */

  function assertAbove (n, msg) {
    if (msg) flag(this, 'message', msg);
    var obj = flag(this, 'object');
    if (flag(this, 'doLength')) {
      new Assertion(obj, msg).to.have.property('length');
      var len = obj.length;
      this.assert(
          len > n
        , 'expected #{this} to have a length above #{exp} but got #{act}'
        , 'expected #{this} to not have a length above #{exp}'
        , n
        , len
      );
    } else {
      this.assert(
          obj > n
        , 'expected #{this} to be above ' + n
        , 'expected #{this} to be at most ' + n
      );
    }
  }

  Assertion.addMethod('above', assertAbove);
  Assertion.addMethod('gt', assertAbove);
  Assertion.addMethod('greaterThan', assertAbove);

  /**
   * ### .least(value)
   *
   * Asserts that the target is greater than or equal to `value`.
   *
   *     expect(10).to.be.at.least(10);
   *
   * Can also be used in conjunction with `length` to
   * assert a minimum length. The benefit being a
   * more informative error message than if the length
   * was supplied directly.
   *
   *     expect('foo').to.have.length.of.at.least(2);
   *     expect([ 1, 2, 3 ]).to.have.length.of.at.least(3);
   *
   * @name least
   * @alias gte
   * @param {Number} value
   * @param {String} message _optional_
   * @api public
   */

  function assertLeast (n, msg) {
    if (msg) flag(this, 'message', msg);
    var obj = flag(this, 'object');
    if (flag(this, 'doLength')) {
      new Assertion(obj, msg).to.have.property('length');
      var len = obj.length;
      this.assert(
          len >= n
        , 'expected #{this} to have a length at least #{exp} but got #{act}'
        , 'expected #{this} to have a length below #{exp}'
        , n
        , len
      );
    } else {
      this.assert(
          obj >= n
        , 'expected #{this} to be at least ' + n
        , 'expected #{this} to be below ' + n
      );
    }
  }

  Assertion.addMethod('least', assertLeast);
  Assertion.addMethod('gte', assertLeast);

  /**
   * ### .below(value)
   *
   * Asserts that the target is less than `value`.
   *
   *     expect(5).to.be.below(10);
   *
   * Can also be used in conjunction with `length` to
   * assert a maximum length. The benefit being a
   * more informative error message than if the length
   * was supplied directly.
   *
   *     expect('foo').to.have.length.below(4);
   *     expect([ 1, 2, 3 ]).to.have.length.below(4);
   *
   * @name below
   * @alias lt
   * @alias lessThan
   * @param {Number} value
   * @param {String} message _optional_
   * @api public
   */

  function assertBelow (n, msg) {
    if (msg) flag(this, 'message', msg);
    var obj = flag(this, 'object');
    if (flag(this, 'doLength')) {
      new Assertion(obj, msg).to.have.property('length');
      var len = obj.length;
      this.assert(
          len < n
        , 'expected #{this} to have a length below #{exp} but got #{act}'
        , 'expected #{this} to not have a length below #{exp}'
        , n
        , len
      );
    } else {
      this.assert(
          obj < n
        , 'expected #{this} to be below ' + n
        , 'expected #{this} to be at least ' + n
      );
    }
  }

  Assertion.addMethod('below', assertBelow);
  Assertion.addMethod('lt', assertBelow);
  Assertion.addMethod('lessThan', assertBelow);

  /**
   * ### .most(value)
   *
   * Asserts that the target is less than or equal to `value`.
   *
   *     expect(5).to.be.at.most(5);
   *
   * Can also be used in conjunction with `length` to
   * assert a maximum length. The benefit being a
   * more informative error message than if the length
   * was supplied directly.
   *
   *     expect('foo').to.have.length.of.at.most(4);
   *     expect([ 1, 2, 3 ]).to.have.length.of.at.most(3);
   *
   * @name most
   * @alias lte
   * @param {Number} value
   * @param {String} message _optional_
   * @api public
   */

  function assertMost (n, msg) {
    if (msg) flag(this, 'message', msg);
    var obj = flag(this, 'object');
    if (flag(this, 'doLength')) {
      new Assertion(obj, msg).to.have.property('length');
      var len = obj.length;
      this.assert(
          len <= n
        , 'expected #{this} to have a length at most #{exp} but got #{act}'
        , 'expected #{this} to have a length above #{exp}'
        , n
        , len
      );
    } else {
      this.assert(
          obj <= n
        , 'expected #{this} to be at most ' + n
        , 'expected #{this} to be above ' + n
      );
    }
  }

  Assertion.addMethod('most', assertMost);
  Assertion.addMethod('lte', assertMost);

  /**
   * ### .within(start, finish)
   *
   * Asserts that the target is within a range.
   *
   *     expect(7).to.be.within(5,10);
   *
   * Can also be used in conjunction with `length` to
   * assert a length range. The benefit being a
   * more informative error message than if the length
   * was supplied directly.
   *
   *     expect('foo').to.have.length.within(2,4);
   *     expect([ 1, 2, 3 ]).to.have.length.within(2,4);
   *
   * @name within
   * @param {Number} start lowerbound inclusive
   * @param {Number} finish upperbound inclusive
   * @param {String} message _optional_
   * @api public
   */

  Assertion.addMethod('within', function (start, finish, msg) {
    if (msg) flag(this, 'message', msg);
    var obj = flag(this, 'object')
      , range = start + '..' + finish;
    if (flag(this, 'doLength')) {
      new Assertion(obj, msg).to.have.property('length');
      var len = obj.length;
      this.assert(
          len >= start && len <= finish
        , 'expected #{this} to have a length within ' + range
        , 'expected #{this} to not have a length within ' + range
      );
    } else {
      this.assert(
          obj >= start && obj <= finish
        , 'expected #{this} to be within ' + range
        , 'expected #{this} to not be within ' + range
      );
    }
  });

  /**
   * ### .instanceof(constructor)
   *
   * Asserts that the target is an instance of `constructor`.
   *
   *     var Tea = function (name) { this.name = name; }
   *       , Chai = new Tea('chai');
   *
   *     expect(Chai).to.be.an.instanceof(Tea);
   *     expect([ 1, 2, 3 ]).to.be.instanceof(Array);
   *
   * @name instanceof
   * @param {Constructor} constructor
   * @param {String} message _optional_
   * @alias instanceOf
   * @api public
   */

  function assertInstanceOf (constructor, msg) {
    if (msg) flag(this, 'message', msg);
    var name = _.getName(constructor);
    this.assert(
        flag(this, 'object') instanceof constructor
      , 'expected #{this} to be an instance of ' + name
      , 'expected #{this} to not be an instance of ' + name
    );
  };

  Assertion.addMethod('instanceof', assertInstanceOf);
  Assertion.addMethod('instanceOf', assertInstanceOf);

  /**
   * ### .property(name, [value])
   *
   * Asserts that the target has a property `name`, optionally asserting that
   * the value of that property is strictly equal to  `value`.
   * If the `deep` flag is set, you can use dot- and bracket-notation for deep
   * references into objects and arrays.
   *
   *     // simple referencing
   *     var obj = { foo: 'bar' };
   *     expect(obj).to.have.property('foo');
   *     expect(obj).to.have.property('foo', 'bar');
   *
   *     // deep referencing
   *     var deepObj = {
   *         green: { tea: 'matcha' }
   *       , teas: [ 'chai', 'matcha', { tea: 'konacha' } ]
   *     };

   *     expect(deepObj).to.have.deep.property('green.tea', 'matcha');
   *     expect(deepObj).to.have.deep.property('teas[1]', 'matcha');
   *     expect(deepObj).to.have.deep.property('teas[2].tea', 'konacha');
   *
   * You can also use an array as the starting point of a `deep.property`
   * assertion, or traverse nested arrays.
   *
   *     var arr = [
   *         [ 'chai', 'matcha', 'konacha' ]
   *       , [ { tea: 'chai' }
   *         , { tea: 'matcha' }
   *         , { tea: 'konacha' } ]
   *     ];
   *
   *     expect(arr).to.have.deep.property('[0][1]', 'matcha');
   *     expect(arr).to.have.deep.property('[1][2].tea', 'konacha');
   *
   * Furthermore, `property` changes the subject of the assertion
   * to be the value of that property from the original object. This
   * permits for further chainable assertions on that property.
   *
   *     expect(obj).to.have.property('foo')
   *       .that.is.a('string');
   *     expect(deepObj).to.have.property('green')
   *       .that.is.an('object')
   *       .that.deep.equals({ tea: 'matcha' });
   *     expect(deepObj).to.have.property('teas')
   *       .that.is.an('array')
   *       .with.deep.property('[2]')
   *         .that.deep.equals({ tea: 'konacha' });
   *
   * @name property
   * @alias deep.property
   * @param {String} name
   * @param {Mixed} value (optional)
   * @param {String} message _optional_
   * @returns value of property for chaining
   * @api public
   */

  Assertion.addMethod('property', function (name, val, msg) {
    if (msg) flag(this, 'message', msg);

    var descriptor = flag(this, 'deep') ? 'deep property ' : 'property '
      , negate = flag(this, 'negate')
      , obj = flag(this, 'object')
      , value = flag(this, 'deep')
        ? _.getPathValue(name, obj)
        : obj[name];

    if (negate && undefined !== val) {
      if (undefined === value) {
        msg = (msg != null) ? msg + ': ' : '';
        throw new Error(msg + _.inspect(obj) + ' has no ' + descriptor + _.inspect(name));
      }
    } else {
      this.assert(
          undefined !== value
        , 'expected #{this} to have a ' + descriptor + _.inspect(name)
        , 'expected #{this} to not have ' + descriptor + _.inspect(name));
    }

    if (undefined !== val) {
      this.assert(
          val === value
        , 'expected #{this} to have a ' + descriptor + _.inspect(name) + ' of #{exp}, but got #{act}'
        , 'expected #{this} to not have a ' + descriptor + _.inspect(name) + ' of #{act}'
        , val
        , value
      );
    }

    flag(this, 'object', value);
  });


  /**
   * ### .ownProperty(name)
   *
   * Asserts that the target has an own property `name`.
   *
   *     expect('test').to.have.ownProperty('length');
   *
   * @name ownProperty
   * @alias haveOwnProperty
   * @param {String} name
   * @param {String} message _optional_
   * @api public
   */

  function assertOwnProperty (name, msg) {
    if (msg) flag(this, 'message', msg);
    var obj = flag(this, 'object');
    this.assert(
        obj.hasOwnProperty(name)
      , 'expected #{this} to have own property ' + _.inspect(name)
      , 'expected #{this} to not have own property ' + _.inspect(name)
    );
  }

  Assertion.addMethod('ownProperty', assertOwnProperty);
  Assertion.addMethod('haveOwnProperty', assertOwnProperty);

  /**
   * ### .length(value)
   *
   * Asserts that the target's `length` property has
   * the expected value.
   *
   *     expect([ 1, 2, 3]).to.have.length(3);
   *     expect('foobar').to.have.length(6);
   *
   * Can also be used as a chain precursor to a value
   * comparison for the length property.
   *
   *     expect('foo').to.have.length.above(2);
   *     expect([ 1, 2, 3 ]).to.have.length.above(2);
   *     expect('foo').to.have.length.below(4);
   *     expect([ 1, 2, 3 ]).to.have.length.below(4);
   *     expect('foo').to.have.length.within(2,4);
   *     expect([ 1, 2, 3 ]).to.have.length.within(2,4);
   *
   * @name length
   * @alias lengthOf
   * @param {Number} length
   * @param {String} message _optional_
   * @api public
   */

  function assertLengthChain () {
    flag(this, 'doLength', true);
  }

  function assertLength (n, msg) {
    if (msg) flag(this, 'message', msg);
    var obj = flag(this, 'object');
    new Assertion(obj, msg).to.have.property('length');
    var len = obj.length;

    this.assert(
        len == n
      , 'expected #{this} to have a length of #{exp} but got #{act}'
      , 'expected #{this} to not have a length of #{act}'
      , n
      , len
    );
  }

  Assertion.addChainableMethod('length', assertLength, assertLengthChain);
  Assertion.addMethod('lengthOf', assertLength, assertLengthChain);

  /**
   * ### .match(regexp)
   *
   * Asserts that the target matches a regular expression.
   *
   *     expect('foobar').to.match(/^foo/);
   *
   * @name match
   * @param {RegExp} RegularExpression
   * @param {String} message _optional_
   * @api public
   */

  Assertion.addMethod('match', function (re, msg) {
    if (msg) flag(this, 'message', msg);
    var obj = flag(this, 'object');
    this.assert(
        re.exec(obj)
      , 'expected #{this} to match ' + re
      , 'expected #{this} not to match ' + re
    );
  });

  /**
   * ### .string(string)
   *
   * Asserts that the string target contains another string.
   *
   *     expect('foobar').to.have.string('bar');
   *
   * @name string
   * @param {String} string
   * @param {String} message _optional_
   * @api public
   */

  Assertion.addMethod('string', function (str, msg) {
    if (msg) flag(this, 'message', msg);
    var obj = flag(this, 'object');
    new Assertion(obj, msg).is.a('string');

    this.assert(
        ~obj.indexOf(str)
      , 'expected #{this} to contain ' + _.inspect(str)
      , 'expected #{this} to not contain ' + _.inspect(str)
    );
  });


  /**
   * ### .keys(key1, [key2], [...])
   *
   * Asserts that the target has exactly the given keys, or
   * asserts the inclusion of some keys when using the
   * `include` or `contain` modifiers.
   *
   *     expect({ foo: 1, bar: 2 }).to.have.keys(['foo', 'bar']);
   *     expect({ foo: 1, bar: 2, baz: 3 }).to.contain.keys('foo', 'bar');
   *
   * @name keys
   * @alias key
   * @param {String...|Array} keys
   * @api public
   */

  function assertKeys (keys) {
    var obj = flag(this, 'object')
      , str
      , ok = true;

    keys = keys instanceof Array
      ? keys
      : Array.prototype.slice.call(arguments);

    if (!keys.length) throw new Error('keys required');

    var actual = Object.keys(obj)
      , len = keys.length;

    // Inclusion
    ok = keys.every(function(key){
      return ~actual.indexOf(key);
    });

    // Strict
    if (!flag(this, 'negate') && !flag(this, 'contains')) {
      ok = ok && keys.length == actual.length;
    }

    // Key string
    if (len > 1) {
      keys = keys.map(function(key){
        return _.inspect(key);
      });
      var last = keys.pop();
      str = keys.join(', ') + ', and ' + last;
    } else {
      str = _.inspect(keys[0]);
    }

    // Form
    str = (len > 1 ? 'keys ' : 'key ') + str;

    // Have / include
    str = (flag(this, 'contains') ? 'contain ' : 'have ') + str;

    // Assertion
    this.assert(
        ok
      , 'expected #{this} to ' + str
      , 'expected #{this} to not ' + str
    );
  }

  Assertion.addMethod('keys', assertKeys);
  Assertion.addMethod('key', assertKeys);

  /**
   * ### .throw(constructor)
   *
   * Asserts that the function target will throw a specific error, or specific type of error
   * (as determined using `instanceof`), optionally with a RegExp or string inclusion test
   * for the error's message.
   *
   *     var err = new ReferenceError('This is a bad function.');
   *     var fn = function () { throw err; }
   *     expect(fn).to.throw(ReferenceError);
   *     expect(fn).to.throw(Error);
   *     expect(fn).to.throw(/bad function/);
   *     expect(fn).to.not.throw('good function');
   *     expect(fn).to.throw(ReferenceError, /bad function/);
   *     expect(fn).to.throw(err);
   *     expect(fn).to.not.throw(new RangeError('Out of range.'));
   *
   * Please note that when a throw expectation is negated, it will check each
   * parameter independently, starting with error constructor type. The appropriate way
   * to check for the existence of a type of error but for a message that does not match
   * is to use `and`.
   *
   *     expect(fn).to.throw(ReferenceError)
   *        .and.not.throw(/good function/);
   *
   * @name throw
   * @alias throws
   * @alias Throw
   * @param {ErrorConstructor} constructor
   * @param {String|RegExp} expected error message
   * @param {String} message _optional_
   * @see https://developer.mozilla.org/en/JavaScript/Reference/Global_Objects/Error#Error_types
   * @returns error for chaining (null if no error)
   * @api public
   */

  function assertThrows (constructor, errMsg, msg) {
    if (msg) flag(this, 'message', msg);
    var obj = flag(this, 'object');
    new Assertion(obj, msg).is.a('function');

    var thrown = false
      , desiredError = null
      , name = null
      , thrownError = null;

    if (arguments.length === 0) {
      errMsg = null;
      constructor = null;
    } else if (constructor && (constructor instanceof RegExp || 'string' === typeof constructor)) {
      errMsg = constructor;
      constructor = null;
    } else if (constructor && constructor instanceof Error) {
      desiredError = constructor;
      constructor = null;
      errMsg = null;
    } else if (typeof constructor === 'function') {
      name = constructor.prototype.name || constructor.name;
      if (name === 'Error' && constructor !== Error) {
        name = (new constructor()).name;
      }
    } else {
      constructor = null;
    }

    try {
      obj();
    } catch (err) {
      // first, check desired error
      if (desiredError) {
        this.assert(
            err === desiredError
          , 'expected #{this} to throw #{exp} but #{act} was thrown'
          , 'expected #{this} to not throw #{exp}'
          , (desiredError instanceof Error ? desiredError.toString() : desiredError)
          , (err instanceof Error ? err.toString() : err)
        );

        flag(this, 'object', err);
        return this;
      }

      // next, check constructor
      if (constructor) {
        this.assert(
            err instanceof constructor
          , 'expected #{this} to throw #{exp} but #{act} was thrown'
          , 'expected #{this} to not throw #{exp} but #{act} was thrown'
          , name
          , (err instanceof Error ? err.toString() : err)
        );

        if (!errMsg) {
          flag(this, 'object', err);
          return this;
        }
      }

      // next, check message
      var message = 'object' === _.type(err) && "message" in err
        ? err.message
        : '' + err;

      if ((message != null) && errMsg && errMsg instanceof RegExp) {
        this.assert(
            errMsg.exec(message)
          , 'expected #{this} to throw error matching #{exp} but got #{act}'
          , 'expected #{this} to throw error not matching #{exp}'
          , errMsg
          , message
        );

        flag(this, 'object', err);
        return this;
      } else if ((message != null) && errMsg && 'string' === typeof errMsg) {
        this.assert(
            ~message.indexOf(errMsg)
          , 'expected #{this} to throw error including #{exp} but got #{act}'
          , 'expected #{this} to throw error not including #{act}'
          , errMsg
          , message
        );

        flag(this, 'object', err);
        return this;
      } else {
        thrown = true;
        thrownError = err;
      }
    }

    var actuallyGot = ''
      , expectedThrown = name !== null
        ? name
        : desiredError
          ? '#{exp}' //_.inspect(desiredError)
          : 'an error';

    if (thrown) {
      actuallyGot = ' but #{act} was thrown'
    }

    this.assert(
        thrown === true
      , 'expected #{this} to throw ' + expectedThrown + actuallyGot
      , 'expected #{this} to not throw ' + expectedThrown + actuallyGot
      , (desiredError instanceof Error ? desiredError.toString() : desiredError)
      , (thrownError instanceof Error ? thrownError.toString() : thrownError)
    );

    flag(this, 'object', thrownError);
  };

  Assertion.addMethod('throw', assertThrows);
  Assertion.addMethod('throws', assertThrows);
  Assertion.addMethod('Throw', assertThrows);

  /**
   * ### .respondTo(method)
   *
   * Asserts that the object or class target will respond to a method.
   *
   *     Klass.prototype.bar = function(){};
   *     expect(Klass).to.respondTo('bar');
   *     expect(obj).to.respondTo('bar');
   *
   * To check if a constructor will respond to a static function,
   * set the `itself` flag.
   *
   *     Klass.baz = function(){};
   *     expect(Klass).itself.to.respondTo('baz');
   *
   * @name respondTo
   * @param {String} method
   * @param {String} message _optional_
   * @api public
   */

  Assertion.addMethod('respondTo', function (method, msg) {
    if (msg) flag(this, 'message', msg);
    var obj = flag(this, 'object')
      , itself = flag(this, 'itself')
      , context = ('function' === _.type(obj) && !itself)
        ? obj.prototype[method]
        : obj[method];

    this.assert(
        'function' === typeof context
      , 'expected #{this} to respond to ' + _.inspect(method)
      , 'expected #{this} to not respond to ' + _.inspect(method)
    );
  });

  /**
   * ### .itself
   *
   * Sets the `itself` flag, later used by the `respondTo` assertion.
   *
   *     function Foo() {}
   *     Foo.bar = function() {}
   *     Foo.prototype.baz = function() {}
   *
   *     expect(Foo).itself.to.respondTo('bar');
   *     expect(Foo).itself.not.to.respondTo('baz');
   *
   * @name itself
   * @api public
   */

  Assertion.addProperty('itself', function () {
    flag(this, 'itself', true);
  });

  /**
   * ### .satisfy(method)
   *
   * Asserts that the target passes a given truth test.
   *
   *     expect(1).to.satisfy(function(num) { return num > 0; });
   *
   * @name satisfy
   * @param {Function} matcher
   * @param {String} message _optional_
   * @api public
   */

  Assertion.addMethod('satisfy', function (matcher, msg) {
    if (msg) flag(this, 'message', msg);
    var obj = flag(this, 'object');
    this.assert(
        matcher(obj)
      , 'expected #{this} to satisfy ' + _.objDisplay(matcher)
      , 'expected #{this} to not satisfy' + _.objDisplay(matcher)
      , this.negate ? false : true
      , matcher(obj)
    );
  });

  /**
   * ### .closeTo(expected, delta)
   *
   * Asserts that the target is equal `expected`, to within a +/- `delta` range.
   *
   *     expect(1.5).to.be.closeTo(1, 0.5);
   *
   * @name closeTo
   * @param {Number} expected
   * @param {Number} delta
   * @param {String} message _optional_
   * @api public
   */

  Assertion.addMethod('closeTo', function (expected, delta, msg) {
    if (msg) flag(this, 'message', msg);
    var obj = flag(this, 'object');
    this.assert(
        Math.abs(obj - expected) <= delta
      , 'expected #{this} to be close to ' + expected + ' +/- ' + delta
      , 'expected #{this} not to be close to ' + expected + ' +/- ' + delta
    );
  });

  function isSubsetOf(subset, superset, cmp) {
    return subset.every(function(elem) {
      if (!cmp) return superset.indexOf(elem) !== -1;

      return superset.some(function(elem2) {
        return cmp(elem, elem2);
      });
    })
  }

  /**
   * ### .members(set)
   *
   * Asserts that the target is a superset of `set`,
   * or that the target and `set` have the same strictly-equal (===) members.
   * Alternately, if the `deep` flag is set, set members are compared for deep
   * equality.
   *
   *     expect([1, 2, 3]).to.include.members([3, 2]);
   *     expect([1, 2, 3]).to.not.include.members([3, 2, 8]);
   *
   *     expect([4, 2]).to.have.members([2, 4]);
   *     expect([5, 2]).to.not.have.members([5, 2, 1]);
   *
   *     expect([{ id: 1 }]).to.deep.include.members([{ id: 1 }]);
   *
   * @name members
   * @param {Array} set
   * @param {String} message _optional_
   * @api public
   */

  Assertion.addMethod('members', function (subset, msg) {
    if (msg) flag(this, 'message', msg);
    var obj = flag(this, 'object');

    new Assertion(obj).to.be.an('array');
    new Assertion(subset).to.be.an('array');

    var cmp = flag(this, 'deep') ? _.eql : undefined;

    if (flag(this, 'contains')) {
      return this.assert(
          isSubsetOf(subset, obj, cmp)
        , 'expected #{this} to be a superset of #{act}'
        , 'expected #{this} to not be a superset of #{act}'
        , obj
        , subset
      );
    }

    this.assert(
        isSubsetOf(obj, subset, cmp) && isSubsetOf(subset, obj, cmp)
        , 'expected #{this} to have the same members as #{act}'
        , 'expected #{this} to not have the same members as #{act}'
        , obj
        , subset
    );
  });
};

},{}],26:[function(require,module,exports){
/*!
 * chai
 * Copyright(c) 2011-2014 Jake Luer <jake@alogicalparadox.com>
 * MIT Licensed
 */


module.exports = function (chai, util) {

  /*!
   * Chai dependencies.
   */

  var Assertion = chai.Assertion
    , flag = util.flag;

  /*!
   * Module export.
   */

  /**
   * ### assert(expression, message)
   *
   * Write your own test expressions.
   *
   *     assert('foo' !== 'bar', 'foo is not bar');
   *     assert(Array.isArray([]), 'empty arrays are arrays');
   *
   * @param {Mixed} expression to test for truthiness
   * @param {String} message to display on error
   * @name assert
   * @api public
   */

  var assert = chai.assert = function (express, errmsg) {
    var test = new Assertion(null, null, chai.assert);
    test.assert(
        express
      , errmsg
      , '[ negation message unavailable ]'
    );
  };

  /**
   * ### .fail(actual, expected, [message], [operator])
   *
   * Throw a failure. Node.js `assert` module-compatible.
   *
   * @name fail
   * @param {Mixed} actual
   * @param {Mixed} expected
   * @param {String} message
   * @param {String} operator
   * @api public
   */

  assert.fail = function (actual, expected, message, operator) {
    message = message || 'assert.fail()';
    throw new chai.AssertionError(message, {
        actual: actual
      , expected: expected
      , operator: operator
    }, assert.fail);
  };

  /**
   * ### .ok(object, [message])
   *
   * Asserts that `object` is truthy.
   *
   *     assert.ok('everything', 'everything is ok');
   *     assert.ok(false, 'this will fail');
   *
   * @name ok
   * @param {Mixed} object to test
   * @param {String} message
   * @api public
   */

  assert.ok = function (val, msg) {
    new Assertion(val, msg).is.ok;
  };

  /**
   * ### .notOk(object, [message])
   *
   * Asserts that `object` is falsy.
   *
   *     assert.notOk('everything', 'this will fail');
   *     assert.notOk(false, 'this will pass');
   *
   * @name notOk
   * @param {Mixed} object to test
   * @param {String} message
   * @api public
   */

  assert.notOk = function (val, msg) {
    new Assertion(val, msg).is.not.ok;
  };

  /**
   * ### .equal(actual, expected, [message])
   *
   * Asserts non-strict equality (`==`) of `actual` and `expected`.
   *
   *     assert.equal(3, '3', '== coerces values to strings');
   *
   * @name equal
   * @param {Mixed} actual
   * @param {Mixed} expected
   * @param {String} message
   * @api public
   */

  assert.equal = function (act, exp, msg) {
    var test = new Assertion(act, msg, assert.equal);

    test.assert(
        exp == flag(test, 'object')
      , 'expected #{this} to equal #{exp}'
      , 'expected #{this} to not equal #{act}'
      , exp
      , act
    );
  };

  /**
   * ### .notEqual(actual, expected, [message])
   *
   * Asserts non-strict inequality (`!=`) of `actual` and `expected`.
   *
   *     assert.notEqual(3, 4, 'these numbers are not equal');
   *
   * @name notEqual
   * @param {Mixed} actual
   * @param {Mixed} expected
   * @param {String} message
   * @api public
   */

  assert.notEqual = function (act, exp, msg) {
    var test = new Assertion(act, msg, assert.notEqual);

    test.assert(
        exp != flag(test, 'object')
      , 'expected #{this} to not equal #{exp}'
      , 'expected #{this} to equal #{act}'
      , exp
      , act
    );
  };

  /**
   * ### .strictEqual(actual, expected, [message])
   *
   * Asserts strict equality (`===`) of `actual` and `expected`.
   *
   *     assert.strictEqual(true, true, 'these booleans are strictly equal');
   *
   * @name strictEqual
   * @param {Mixed} actual
   * @param {Mixed} expected
   * @param {String} message
   * @api public
   */

  assert.strictEqual = function (act, exp, msg) {
    new Assertion(act, msg).to.equal(exp);
  };

  /**
   * ### .notStrictEqual(actual, expected, [message])
   *
   * Asserts strict inequality (`!==`) of `actual` and `expected`.
   *
   *     assert.notStrictEqual(3, '3', 'no coercion for strict equality');
   *
   * @name notStrictEqual
   * @param {Mixed} actual
   * @param {Mixed} expected
   * @param {String} message
   * @api public
   */

  assert.notStrictEqual = function (act, exp, msg) {
    new Assertion(act, msg).to.not.equal(exp);
  };

  /**
   * ### .deepEqual(actual, expected, [message])
   *
   * Asserts that `actual` is deeply equal to `expected`.
   *
   *     assert.deepEqual({ tea: 'green' }, { tea: 'green' });
   *
   * @name deepEqual
   * @param {Mixed} actual
   * @param {Mixed} expected
   * @param {String} message
   * @api public
   */

  assert.deepEqual = function (act, exp, msg) {
    new Assertion(act, msg).to.eql(exp);
  };

  /**
   * ### .notDeepEqual(actual, expected, [message])
   *
   * Assert that `actual` is not deeply equal to `expected`.
   *
   *     assert.notDeepEqual({ tea: 'green' }, { tea: 'jasmine' });
   *
   * @name notDeepEqual
   * @param {Mixed} actual
   * @param {Mixed} expected
   * @param {String} message
   * @api public
   */

  assert.notDeepEqual = function (act, exp, msg) {
    new Assertion(act, msg).to.not.eql(exp);
  };

  /**
   * ### .isTrue(value, [message])
   *
   * Asserts that `value` is true.
   *
   *     var teaServed = true;
   *     assert.isTrue(teaServed, 'the tea has been served');
   *
   * @name isTrue
   * @param {Mixed} value
   * @param {String} message
   * @api public
   */

  assert.isTrue = function (val, msg) {
    new Assertion(val, msg).is['true'];
  };

  /**
   * ### .isFalse(value, [message])
   *
   * Asserts that `value` is false.
   *
   *     var teaServed = false;
   *     assert.isFalse(teaServed, 'no tea yet? hmm...');
   *
   * @name isFalse
   * @param {Mixed} value
   * @param {String} message
   * @api public
   */

  assert.isFalse = function (val, msg) {
    new Assertion(val, msg).is['false'];
  };

  /**
   * ### .isNull(value, [message])
   *
   * Asserts that `value` is null.
   *
   *     assert.isNull(err, 'there was no error');
   *
   * @name isNull
   * @param {Mixed} value
   * @param {String} message
   * @api public
   */

  assert.isNull = function (val, msg) {
    new Assertion(val, msg).to.equal(null);
  };

  /**
   * ### .isNotNull(value, [message])
   *
   * Asserts that `value` is not null.
   *
   *     var tea = 'tasty chai';
   *     assert.isNotNull(tea, 'great, time for tea!');
   *
   * @name isNotNull
   * @param {Mixed} value
   * @param {String} message
   * @api public
   */

  assert.isNotNull = function (val, msg) {
    new Assertion(val, msg).to.not.equal(null);
  };

  /**
   * ### .isUndefined(value, [message])
   *
   * Asserts that `value` is `undefined`.
   *
   *     var tea;
   *     assert.isUndefined(tea, 'no tea defined');
   *
   * @name isUndefined
   * @param {Mixed} value
   * @param {String} message
   * @api public
   */

  assert.isUndefined = function (val, msg) {
    new Assertion(val, msg).to.equal(undefined);
  };

  /**
   * ### .isDefined(value, [message])
   *
   * Asserts that `value` is not `undefined`.
   *
   *     var tea = 'cup of chai';
   *     assert.isDefined(tea, 'tea has been defined');
   *
   * @name isDefined
   * @param {Mixed} value
   * @param {String} message
   * @api public
   */

  assert.isDefined = function (val, msg) {
    new Assertion(val, msg).to.not.equal(undefined);
  };

  /**
   * ### .isFunction(value, [message])
   *
   * Asserts that `value` is a function.
   *
   *     function serveTea() { return 'cup of tea'; };
   *     assert.isFunction(serveTea, 'great, we can have tea now');
   *
   * @name isFunction
   * @param {Mixed} value
   * @param {String} message
   * @api public
   */

  assert.isFunction = function (val, msg) {
    new Assertion(val, msg).to.be.a('function');
  };

  /**
   * ### .isNotFunction(value, [message])
   *
   * Asserts that `value` is _not_ a function.
   *
   *     var serveTea = [ 'heat', 'pour', 'sip' ];
   *     assert.isNotFunction(serveTea, 'great, we have listed the steps');
   *
   * @name isNotFunction
   * @param {Mixed} value
   * @param {String} message
   * @api public
   */

  assert.isNotFunction = function (val, msg) {
    new Assertion(val, msg).to.not.be.a('function');
  };

  /**
   * ### .isObject(value, [message])
   *
   * Asserts that `value` is an object (as revealed by
   * `Object.prototype.toString`).
   *
   *     var selection = { name: 'Chai', serve: 'with spices' };
   *     assert.isObject(selection, 'tea selection is an object');
   *
   * @name isObject
   * @param {Mixed} value
   * @param {String} message
   * @api public
   */

  assert.isObject = function (val, msg) {
    new Assertion(val, msg).to.be.a('object');
  };

  /**
   * ### .isNotObject(value, [message])
   *
   * Asserts that `value` is _not_ an object.
   *
   *     var selection = 'chai'
   *     assert.isNotObject(selection, 'tea selection is not an object');
   *     assert.isNotObject(null, 'null is not an object');
   *
   * @name isNotObject
   * @param {Mixed} value
   * @param {String} message
   * @api public
   */

  assert.isNotObject = function (val, msg) {
    new Assertion(val, msg).to.not.be.a('object');
  };

  /**
   * ### .isArray(value, [message])
   *
   * Asserts that `value` is an array.
   *
   *     var menu = [ 'green', 'chai', 'oolong' ];
   *     assert.isArray(menu, 'what kind of tea do we want?');
   *
   * @name isArray
   * @param {Mixed} value
   * @param {String} message
   * @api public
   */

  assert.isArray = function (val, msg) {
    new Assertion(val, msg).to.be.an('array');
  };

  /**
   * ### .isNotArray(value, [message])
   *
   * Asserts that `value` is _not_ an array.
   *
   *     var menu = 'green|chai|oolong';
   *     assert.isNotArray(menu, 'what kind of tea do we want?');
   *
   * @name isNotArray
   * @param {Mixed} value
   * @param {String} message
   * @api public
   */

  assert.isNotArray = function (val, msg) {
    new Assertion(val, msg).to.not.be.an('array');
  };

  /**
   * ### .isString(value, [message])
   *
   * Asserts that `value` is a string.
   *
   *     var teaOrder = 'chai';
   *     assert.isString(teaOrder, 'order placed');
   *
   * @name isString
   * @param {Mixed} value
   * @param {String} message
   * @api public
   */

  assert.isString = function (val, msg) {
    new Assertion(val, msg).to.be.a('string');
  };

  /**
   * ### .isNotString(value, [message])
   *
   * Asserts that `value` is _not_ a string.
   *
   *     var teaOrder = 4;
   *     assert.isNotString(teaOrder, 'order placed');
   *
   * @name isNotString
   * @param {Mixed} value
   * @param {String} message
   * @api public
   */

  assert.isNotString = function (val, msg) {
    new Assertion(val, msg).to.not.be.a('string');
  };

  /**
   * ### .isNumber(value, [message])
   *
   * Asserts that `value` is a number.
   *
   *     var cups = 2;
   *     assert.isNumber(cups, 'how many cups');
   *
   * @name isNumber
   * @param {Number} value
   * @param {String} message
   * @api public
   */

  assert.isNumber = function (val, msg) {
    new Assertion(val, msg).to.be.a('number');
  };

  /**
   * ### .isNotNumber(value, [message])
   *
   * Asserts that `value` is _not_ a number.
   *
   *     var cups = '2 cups please';
   *     assert.isNotNumber(cups, 'how many cups');
   *
   * @name isNotNumber
   * @param {Mixed} value
   * @param {String} message
   * @api public
   */

  assert.isNotNumber = function (val, msg) {
    new Assertion(val, msg).to.not.be.a('number');
  };

  /**
   * ### .isBoolean(value, [message])
   *
   * Asserts that `value` is a boolean.
   *
   *     var teaReady = true
   *       , teaServed = false;
   *
   *     assert.isBoolean(teaReady, 'is the tea ready');
   *     assert.isBoolean(teaServed, 'has tea been served');
   *
   * @name isBoolean
   * @param {Mixed} value
   * @param {String} message
   * @api public
   */

  assert.isBoolean = function (val, msg) {
    new Assertion(val, msg).to.be.a('boolean');
  };

  /**
   * ### .isNotBoolean(value, [message])
   *
   * Asserts that `value` is _not_ a boolean.
   *
   *     var teaReady = 'yep'
   *       , teaServed = 'nope';
   *
   *     assert.isNotBoolean(teaReady, 'is the tea ready');
   *     assert.isNotBoolean(teaServed, 'has tea been served');
   *
   * @name isNotBoolean
   * @param {Mixed} value
   * @param {String} message
   * @api public
   */

  assert.isNotBoolean = function (val, msg) {
    new Assertion(val, msg).to.not.be.a('boolean');
  };

  /**
   * ### .typeOf(value, name, [message])
   *
   * Asserts that `value`'s type is `name`, as determined by
   * `Object.prototype.toString`.
   *
   *     assert.typeOf({ tea: 'chai' }, 'object', 'we have an object');
   *     assert.typeOf(['chai', 'jasmine'], 'array', 'we have an array');
   *     assert.typeOf('tea', 'string', 'we have a string');
   *     assert.typeOf(/tea/, 'regexp', 'we have a regular expression');
   *     assert.typeOf(null, 'null', 'we have a null');
   *     assert.typeOf(undefined, 'undefined', 'we have an undefined');
   *
   * @name typeOf
   * @param {Mixed} value
   * @param {String} name
   * @param {String} message
   * @api public
   */

  assert.typeOf = function (val, type, msg) {
    new Assertion(val, msg).to.be.a(type);
  };

  /**
   * ### .notTypeOf(value, name, [message])
   *
   * Asserts that `value`'s type is _not_ `name`, as determined by
   * `Object.prototype.toString`.
   *
   *     assert.notTypeOf('tea', 'number', 'strings are not numbers');
   *
   * @name notTypeOf
   * @param {Mixed} value
   * @param {String} typeof name
   * @param {String} message
   * @api public
   */

  assert.notTypeOf = function (val, type, msg) {
    new Assertion(val, msg).to.not.be.a(type);
  };

  /**
   * ### .instanceOf(object, constructor, [message])
   *
   * Asserts that `value` is an instance of `constructor`.
   *
   *     var Tea = function (name) { this.name = name; }
   *       , chai = new Tea('chai');
   *
   *     assert.instanceOf(chai, Tea, 'chai is an instance of tea');
   *
   * @name instanceOf
   * @param {Object} object
   * @param {Constructor} constructor
   * @param {String} message
   * @api public
   */

  assert.instanceOf = function (val, type, msg) {
    new Assertion(val, msg).to.be.instanceOf(type);
  };

  /**
   * ### .notInstanceOf(object, constructor, [message])
   *
   * Asserts `value` is not an instance of `constructor`.
   *
   *     var Tea = function (name) { this.name = name; }
   *       , chai = new String('chai');
   *
   *     assert.notInstanceOf(chai, Tea, 'chai is not an instance of tea');
   *
   * @name notInstanceOf
   * @param {Object} object
   * @param {Constructor} constructor
   * @param {String} message
   * @api public
   */

  assert.notInstanceOf = function (val, type, msg) {
    new Assertion(val, msg).to.not.be.instanceOf(type);
  };

  /**
   * ### .include(haystack, needle, [message])
   *
   * Asserts that `haystack` includes `needle`. Works
   * for strings and arrays.
   *
   *     assert.include('foobar', 'bar', 'foobar contains string "bar"');
   *     assert.include([ 1, 2, 3 ], 3, 'array contains value');
   *
   * @name include
   * @param {Array|String} haystack
   * @param {Mixed} needle
   * @param {String} message
   * @api public
   */

  assert.include = function (exp, inc, msg) {
    new Assertion(exp, msg, assert.include).include(inc);
  };

  /**
   * ### .notInclude(haystack, needle, [message])
   *
   * Asserts that `haystack` does not include `needle`. Works
   * for strings and arrays.
   *i
   *     assert.notInclude('foobar', 'baz', 'string not include substring');
   *     assert.notInclude([ 1, 2, 3 ], 4, 'array not include contain value');
   *
   * @name notInclude
   * @param {Array|String} haystack
   * @param {Mixed} needle
   * @param {String} message
   * @api public
   */

  assert.notInclude = function (exp, inc, msg) {
    new Assertion(exp, msg, assert.notInclude).not.include(inc);
  };

  /**
   * ### .match(value, regexp, [message])
   *
   * Asserts that `value` matches the regular expression `regexp`.
   *
   *     assert.match('foobar', /^foo/, 'regexp matches');
   *
   * @name match
   * @param {Mixed} value
   * @param {RegExp} regexp
   * @param {String} message
   * @api public
   */

  assert.match = function (exp, re, msg) {
    new Assertion(exp, msg).to.match(re);
  };

  /**
   * ### .notMatch(value, regexp, [message])
   *
   * Asserts that `value` does not match the regular expression `regexp`.
   *
   *     assert.notMatch('foobar', /^foo/, 'regexp does not match');
   *
   * @name notMatch
   * @param {Mixed} value
   * @param {RegExp} regexp
   * @param {String} message
   * @api public
   */

  assert.notMatch = function (exp, re, msg) {
    new Assertion(exp, msg).to.not.match(re);
  };

  /**
   * ### .property(object, property, [message])
   *
   * Asserts that `object` has a property named by `property`.
   *
   *     assert.property({ tea: { green: 'matcha' }}, 'tea');
   *
   * @name property
   * @param {Object} object
   * @param {String} property
   * @param {String} message
   * @api public
   */

  assert.property = function (obj, prop, msg) {
    new Assertion(obj, msg).to.have.property(prop);
  };

  /**
   * ### .notProperty(object, property, [message])
   *
   * Asserts that `object` does _not_ have a property named by `property`.
   *
   *     assert.notProperty({ tea: { green: 'matcha' }}, 'coffee');
   *
   * @name notProperty
   * @param {Object} object
   * @param {String} property
   * @param {String} message
   * @api public
   */

  assert.notProperty = function (obj, prop, msg) {
    new Assertion(obj, msg).to.not.have.property(prop);
  };

  /**
   * ### .deepProperty(object, property, [message])
   *
   * Asserts that `object` has a property named by `property`, which can be a
   * string using dot- and bracket-notation for deep reference.
   *
   *     assert.deepProperty({ tea: { green: 'matcha' }}, 'tea.green');
   *
   * @name deepProperty
   * @param {Object} object
   * @param {String} property
   * @param {String} message
   * @api public
   */

  assert.deepProperty = function (obj, prop, msg) {
    new Assertion(obj, msg).to.have.deep.property(prop);
  };

  /**
   * ### .notDeepProperty(object, property, [message])
   *
   * Asserts that `object` does _not_ have a property named by `property`, which
   * can be a string using dot- and bracket-notation for deep reference.
   *
   *     assert.notDeepProperty({ tea: { green: 'matcha' }}, 'tea.oolong');
   *
   * @name notDeepProperty
   * @param {Object} object
   * @param {String} property
   * @param {String} message
   * @api public
   */

  assert.notDeepProperty = function (obj, prop, msg) {
    new Assertion(obj, msg).to.not.have.deep.property(prop);
  };

  /**
   * ### .propertyVal(object, property, value, [message])
   *
   * Asserts that `object` has a property named by `property` with value given
   * by `value`.
   *
   *     assert.propertyVal({ tea: 'is good' }, 'tea', 'is good');
   *
   * @name propertyVal
   * @param {Object} object
   * @param {String} property
   * @param {Mixed} value
   * @param {String} message
   * @api public
   */

  assert.propertyVal = function (obj, prop, val, msg) {
    new Assertion(obj, msg).to.have.property(prop, val);
  };

  /**
   * ### .propertyNotVal(object, property, value, [message])
   *
   * Asserts that `object` has a property named by `property`, but with a value
   * different from that given by `value`.
   *
   *     assert.propertyNotVal({ tea: 'is good' }, 'tea', 'is bad');
   *
   * @name propertyNotVal
   * @param {Object} object
   * @param {String} property
   * @param {Mixed} value
   * @param {String} message
   * @api public
   */

  assert.propertyNotVal = function (obj, prop, val, msg) {
    new Assertion(obj, msg).to.not.have.property(prop, val);
  };

  /**
   * ### .deepPropertyVal(object, property, value, [message])
   *
   * Asserts that `object` has a property named by `property` with value given
   * by `value`. `property` can use dot- and bracket-notation for deep
   * reference.
   *
   *     assert.deepPropertyVal({ tea: { green: 'matcha' }}, 'tea.green', 'matcha');
   *
   * @name deepPropertyVal
   * @param {Object} object
   * @param {String} property
   * @param {Mixed} value
   * @param {String} message
   * @api public
   */

  assert.deepPropertyVal = function (obj, prop, val, msg) {
    new Assertion(obj, msg).to.have.deep.property(prop, val);
  };

  /**
   * ### .deepPropertyNotVal(object, property, value, [message])
   *
   * Asserts that `object` has a property named by `property`, but with a value
   * different from that given by `value`. `property` can use dot- and
   * bracket-notation for deep reference.
   *
   *     assert.deepPropertyNotVal({ tea: { green: 'matcha' }}, 'tea.green', 'konacha');
   *
   * @name deepPropertyNotVal
   * @param {Object} object
   * @param {String} property
   * @param {Mixed} value
   * @param {String} message
   * @api public
   */

  assert.deepPropertyNotVal = function (obj, prop, val, msg) {
    new Assertion(obj, msg).to.not.have.deep.property(prop, val);
  };

  /**
   * ### .lengthOf(object, length, [message])
   *
   * Asserts that `object` has a `length` property with the expected value.
   *
   *     assert.lengthOf([1,2,3], 3, 'array has length of 3');
   *     assert.lengthOf('foobar', 5, 'string has length of 6');
   *
   * @name lengthOf
   * @param {Mixed} object
   * @param {Number} length
   * @param {String} message
   * @api public
   */

  assert.lengthOf = function (exp, len, msg) {
    new Assertion(exp, msg).to.have.length(len);
  };

  /**
   * ### .throws(function, [constructor/string/regexp], [string/regexp], [message])
   *
   * Asserts that `function` will throw an error that is an instance of
   * `constructor`, or alternately that it will throw an error with message
   * matching `regexp`.
   *
   *     assert.throw(fn, 'function throws a reference error');
   *     assert.throw(fn, /function throws a reference error/);
   *     assert.throw(fn, ReferenceError);
   *     assert.throw(fn, ReferenceError, 'function throws a reference error');
   *     assert.throw(fn, ReferenceError, /function throws a reference error/);
   *
   * @name throws
   * @alias throw
   * @alias Throw
   * @param {Function} function
   * @param {ErrorConstructor} constructor
   * @param {RegExp} regexp
   * @param {String} message
   * @see https://developer.mozilla.org/en/JavaScript/Reference/Global_Objects/Error#Error_types
   * @api public
   */

  assert.Throw = function (fn, errt, errs, msg) {
    if ('string' === typeof errt || errt instanceof RegExp) {
      errs = errt;
      errt = null;
    }

    var assertErr = new Assertion(fn, msg).to.Throw(errt, errs);
    return flag(assertErr, 'object');
  };

  /**
   * ### .doesNotThrow(function, [constructor/regexp], [message])
   *
   * Asserts that `function` will _not_ throw an error that is an instance of
   * `constructor`, or alternately that it will not throw an error with message
   * matching `regexp`.
   *
   *     assert.doesNotThrow(fn, Error, 'function does not throw');
   *
   * @name doesNotThrow
   * @param {Function} function
   * @param {ErrorConstructor} constructor
   * @param {RegExp} regexp
   * @param {String} message
   * @see https://developer.mozilla.org/en/JavaScript/Reference/Global_Objects/Error#Error_types
   * @api public
   */

  assert.doesNotThrow = function (fn, type, msg) {
    if ('string' === typeof type) {
      msg = type;
      type = null;
    }

    new Assertion(fn, msg).to.not.Throw(type);
  };

  /**
   * ### .operator(val1, operator, val2, [message])
   *
   * Compares two values using `operator`.
   *
   *     assert.operator(1, '<', 2, 'everything is ok');
   *     assert.operator(1, '>', 2, 'this will fail');
   *
   * @name operator
   * @param {Mixed} val1
   * @param {String} operator
   * @param {Mixed} val2
   * @param {String} message
   * @api public
   */

  assert.operator = function (val, operator, val2, msg) {
    if (!~['==', '===', '>', '>=', '<', '<=', '!=', '!=='].indexOf(operator)) {
      throw new Error('Invalid operator "' + operator + '"');
    }
    var test = new Assertion(eval(val + operator + val2), msg);
    test.assert(
        true === flag(test, 'object')
      , 'expected ' + util.inspect(val) + ' to be ' + operator + ' ' + util.inspect(val2)
      , 'expected ' + util.inspect(val) + ' to not be ' + operator + ' ' + util.inspect(val2) );
  };

  /**
   * ### .closeTo(actual, expected, delta, [message])
   *
   * Asserts that the target is equal `expected`, to within a +/- `delta` range.
   *
   *     assert.closeTo(1.5, 1, 0.5, 'numbers are close');
   *
   * @name closeTo
   * @param {Number} actual
   * @param {Number} expected
   * @param {Number} delta
   * @param {String} message
   * @api public
   */

  assert.closeTo = function (act, exp, delta, msg) {
    new Assertion(act, msg).to.be.closeTo(exp, delta);
  };

  /**
   * ### .sameMembers(set1, set2, [message])
   *
   * Asserts that `set1` and `set2` have the same members.
   * Order is not taken into account.
   *
   *     assert.sameMembers([ 1, 2, 3 ], [ 2, 1, 3 ], 'same members');
   *
   * @name sameMembers
   * @param {Array} superset
   * @param {Array} subset
   * @param {String} message
   * @api public
   */

  assert.sameMembers = function (set1, set2, msg) {
    new Assertion(set1, msg).to.have.same.members(set2);
  }

  /**
   * ### .includeMembers(superset, subset, [message])
   *
   * Asserts that `subset` is included in `superset`.
   * Order is not taken into account.
   *
   *     assert.includeMembers([ 1, 2, 3 ], [ 2, 1 ], 'include members');
   *
   * @name includeMembers
   * @param {Array} superset
   * @param {Array} subset
   * @param {String} message
   * @api public
   */

  assert.includeMembers = function (superset, subset, msg) {
    new Assertion(superset, msg).to.include.members(subset);
  }

  /*!
   * Undocumented / untested
   */

  assert.ifError = function (val, msg) {
    new Assertion(val, msg).to.not.be.ok;
  };

  /*!
   * Aliases.
   */

  (function alias(name, as){
    assert[as] = assert[name];
    return alias;
  })
  ('Throw', 'throw')
  ('Throw', 'throws');
};

},{}],27:[function(require,module,exports){
/*!
 * chai
 * Copyright(c) 2011-2014 Jake Luer <jake@alogicalparadox.com>
 * MIT Licensed
 */

module.exports = function (chai, util) {
  chai.expect = function (val, message) {
    return new chai.Assertion(val, message);
  };
};


},{}],28:[function(require,module,exports){
/*!
 * chai
 * Copyright(c) 2011-2014 Jake Luer <jake@alogicalparadox.com>
 * MIT Licensed
 */

module.exports = function (chai, util) {
  var Assertion = chai.Assertion;

  function loadShould () {
    // explicitly define this method as function as to have it's name to include as `ssfi`
    function shouldGetter() {
      if (this instanceof String || this instanceof Number) {
        return new Assertion(this.constructor(this), null, shouldGetter);
      } else if (this instanceof Boolean) {
        return new Assertion(this == true, null, shouldGetter);
      }
      return new Assertion(this, null, shouldGetter);
    }
    function shouldSetter(value) {
      // See https://github.com/chaijs/chai/issues/86: this makes
      // `whatever.should = someValue` actually set `someValue`, which is
      // especially useful for `global.should = require('chai').should()`.
      //
      // Note that we have to use [[DefineProperty]] instead of [[Put]]
      // since otherwise we would trigger this very setter!
      Object.defineProperty(this, 'should', {
        value: value,
        enumerable: true,
        configurable: true,
        writable: true
      });
    }
    // modify Object.prototype to have `should`
    Object.defineProperty(Object.prototype, 'should', {
      set: shouldSetter
      , get: shouldGetter
      , configurable: true
    });

    var should = {};

    should.equal = function (val1, val2, msg) {
      new Assertion(val1, msg).to.equal(val2);
    };

    should.Throw = function (fn, errt, errs, msg) {
      new Assertion(fn, msg).to.Throw(errt, errs);
    };

    should.exist = function (val, msg) {
      new Assertion(val, msg).to.exist;
    }

    // negation
    should.not = {}

    should.not.equal = function (val1, val2, msg) {
      new Assertion(val1, msg).to.not.equal(val2);
    };

    should.not.Throw = function (fn, errt, errs, msg) {
      new Assertion(fn, msg).to.not.Throw(errt, errs);
    };

    should.not.exist = function (val, msg) {
      new Assertion(val, msg).to.not.exist;
    }

    should['throw'] = should['Throw'];
    should.not['throw'] = should.not['Throw'];

    return should;
  };

  chai.should = loadShould;
  chai.Should = loadShould;
};

},{}],29:[function(require,module,exports){
/*!
 * Chai - addChainingMethod utility
 * Copyright(c) 2012-2014 Jake Luer <jake@alogicalparadox.com>
 * MIT Licensed
 */

/*!
 * Module dependencies
 */

var transferFlags = require('./transferFlags');
var flag = require('./flag');
var config = require('../config');

/*!
 * Module variables
 */

// Check whether `__proto__` is supported
var hasProtoSupport = '__proto__' in Object;

// Without `__proto__` support, this module will need to add properties to a function.
// However, some Function.prototype methods cannot be overwritten,
// and there seems no easy cross-platform way to detect them (@see chaijs/chai/issues/69).
var excludeNames = /^(?:length|name|arguments|caller)$/;

// Cache `Function` properties
var call  = Function.prototype.call,
    apply = Function.prototype.apply;

/**
 * ### addChainableMethod (ctx, name, method, chainingBehavior)
 *
 * Adds a method to an object, such that the method can also be chained.
 *
 *     utils.addChainableMethod(chai.Assertion.prototype, 'foo', function (str) {
 *       var obj = utils.flag(this, 'object');
 *       new chai.Assertion(obj).to.be.equal(str);
 *     });
 *
 * Can also be accessed directly from `chai.Assertion`.
 *
 *     chai.Assertion.addChainableMethod('foo', fn, chainingBehavior);
 *
 * The result can then be used as both a method assertion, executing both `method` and
 * `chainingBehavior`, or as a language chain, which only executes `chainingBehavior`.
 *
 *     expect(fooStr).to.be.foo('bar');
 *     expect(fooStr).to.be.foo.equal('foo');
 *
 * @param {Object} ctx object to which the method is added
 * @param {String} name of method to add
 * @param {Function} method function to be used for `name`, when called
 * @param {Function} chainingBehavior function to be called every time the property is accessed
 * @name addChainableMethod
 * @api public
 */

module.exports = function (ctx, name, method, chainingBehavior) {
  if (typeof chainingBehavior !== 'function') {
    chainingBehavior = function () { };
  }

  var chainableBehavior = {
      method: method
    , chainingBehavior: chainingBehavior
  };

  // save the methods so we can overwrite them later, if we need to.
  if (!ctx.__methods) {
    ctx.__methods = {};
  }
  ctx.__methods[name] = chainableBehavior;

  Object.defineProperty(ctx, name,
    { get: function () {
        chainableBehavior.chainingBehavior.call(this);

        var assert = function assert() {
          var old_ssfi = flag(this, 'ssfi');
          if (old_ssfi && config.includeStack === false)
            flag(this, 'ssfi', assert);
          var result = chainableBehavior.method.apply(this, arguments);
          return result === undefined ? this : result;
        };

        // Use `__proto__` if available
        if (hasProtoSupport) {
          // Inherit all properties from the object by replacing the `Function` prototype
          var prototype = assert.__proto__ = Object.create(this);
          // Restore the `call` and `apply` methods from `Function`
          prototype.call = call;
          prototype.apply = apply;
        }
        // Otherwise, redefine all properties (slow!)
        else {
          var asserterNames = Object.getOwnPropertyNames(ctx);
          asserterNames.forEach(function (asserterName) {
            if (!excludeNames.test(asserterName)) {
              var pd = Object.getOwnPropertyDescriptor(ctx, asserterName);
              Object.defineProperty(assert, asserterName, pd);
            }
          });
        }

        transferFlags(this, assert);
        return assert;
      }
    , configurable: true
  });
};

},{"../config":24,"./flag":32,"./transferFlags":46}],30:[function(require,module,exports){
/*!
 * Chai - addMethod utility
 * Copyright(c) 2012-2014 Jake Luer <jake@alogicalparadox.com>
 * MIT Licensed
 */

var config = require('../config');

/**
 * ### .addMethod (ctx, name, method)
 *
 * Adds a method to the prototype of an object.
 *
 *     utils.addMethod(chai.Assertion.prototype, 'foo', function (str) {
 *       var obj = utils.flag(this, 'object');
 *       new chai.Assertion(obj).to.be.equal(str);
 *     });
 *
 * Can also be accessed directly from `chai.Assertion`.
 *
 *     chai.Assertion.addMethod('foo', fn);
 *
 * Then can be used as any other assertion.
 *
 *     expect(fooStr).to.be.foo('bar');
 *
 * @param {Object} ctx object to which the method is added
 * @param {String} name of method to add
 * @param {Function} method function to be used for name
 * @name addMethod
 * @api public
 */
var flag = require('./flag');

module.exports = function (ctx, name, method) {
  ctx[name] = function () {
    var old_ssfi = flag(this, 'ssfi');
    if (old_ssfi && config.includeStack === false)
      flag(this, 'ssfi', ctx[name]);
    var result = method.apply(this, arguments);
    return result === undefined ? this : result;
  };
};

},{"../config":24,"./flag":32}],31:[function(require,module,exports){
/*!
 * Chai - addProperty utility
 * Copyright(c) 2012-2014 Jake Luer <jake@alogicalparadox.com>
 * MIT Licensed
 */

/**
 * ### addProperty (ctx, name, getter)
 *
 * Adds a property to the prototype of an object.
 *
 *     utils.addProperty(chai.Assertion.prototype, 'foo', function () {
 *       var obj = utils.flag(this, 'object');
 *       new chai.Assertion(obj).to.be.instanceof(Foo);
 *     });
 *
 * Can also be accessed directly from `chai.Assertion`.
 *
 *     chai.Assertion.addProperty('foo', fn);
 *
 * Then can be used as any other assertion.
 *
 *     expect(myFoo).to.be.foo;
 *
 * @param {Object} ctx object to which the property is added
 * @param {String} name of property to add
 * @param {Function} getter function to be used for name
 * @name addProperty
 * @api public
 */

module.exports = function (ctx, name, getter) {
  Object.defineProperty(ctx, name,
    { get: function () {
        var result = getter.call(this);
        return result === undefined ? this : result;
      }
    , configurable: true
  });
};

},{}],32:[function(require,module,exports){
/*!
 * Chai - flag utility
 * Copyright(c) 2012-2014 Jake Luer <jake@alogicalparadox.com>
 * MIT Licensed
 */

/**
 * ### flag(object ,key, [value])
 *
 * Get or set a flag value on an object. If a
 * value is provided it will be set, else it will
 * return the currently set value or `undefined` if
 * the value is not set.
 *
 *     utils.flag(this, 'foo', 'bar'); // setter
 *     utils.flag(this, 'foo'); // getter, returns `bar`
 *
 * @param {Object} object (constructed Assertion
 * @param {String} key
 * @param {Mixed} value (optional)
 * @name flag
 * @api private
 */

module.exports = function (obj, key, value) {
  var flags = obj.__flags || (obj.__flags = Object.create(null));
  if (arguments.length === 3) {
    flags[key] = value;
  } else {
    return flags[key];
  }
};

},{}],33:[function(require,module,exports){
/*!
 * Chai - getActual utility
 * Copyright(c) 2012-2014 Jake Luer <jake@alogicalparadox.com>
 * MIT Licensed
 */

/**
 * # getActual(object, [actual])
 *
 * Returns the `actual` value for an Assertion
 *
 * @param {Object} object (constructed Assertion)
 * @param {Arguments} chai.Assertion.prototype.assert arguments
 */

module.exports = function (obj, args) {
  return args.length > 4 ? args[4] : obj._obj;
};

},{}],34:[function(require,module,exports){
/*!
 * Chai - getEnumerableProperties utility
 * Copyright(c) 2012-2014 Jake Luer <jake@alogicalparadox.com>
 * MIT Licensed
 */

/**
 * ### .getEnumerableProperties(object)
 *
 * This allows the retrieval of enumerable property names of an object,
 * inherited or not.
 *
 * @param {Object} object
 * @returns {Array}
 * @name getEnumerableProperties
 * @api public
 */

module.exports = function getEnumerableProperties(object) {
  var result = [];
  for (var name in object) {
    result.push(name);
  }
  return result;
};

},{}],35:[function(require,module,exports){
/*!
 * Chai - message composition utility
 * Copyright(c) 2012-2014 Jake Luer <jake@alogicalparadox.com>
 * MIT Licensed
 */

/*!
 * Module dependancies
 */

var flag = require('./flag')
  , getActual = require('./getActual')
  , inspect = require('./inspect')
  , objDisplay = require('./objDisplay');

/**
 * ### .getMessage(object, message, negateMessage)
 *
 * Construct the error message based on flags
 * and template tags. Template tags will return
 * a stringified inspection of the object referenced.
 *
 * Message template tags:
 * - `#{this}` current asserted object
 * - `#{act}` actual value
 * - `#{exp}` expected value
 *
 * @param {Object} object (constructed Assertion)
 * @param {Arguments} chai.Assertion.prototype.assert arguments
 * @name getMessage
 * @api public
 */

module.exports = function (obj, args) {
  var negate = flag(obj, 'negate')
    , val = flag(obj, 'object')
    , expected = args[3]
    , actual = getActual(obj, args)
    , msg = negate ? args[2] : args[1]
    , flagMsg = flag(obj, 'message');

  msg = msg || '';
  msg = msg
    .replace(/#{this}/g, objDisplay(val))
    .replace(/#{act}/g, objDisplay(actual))
    .replace(/#{exp}/g, objDisplay(expected));

  return flagMsg ? flagMsg + ': ' + msg : msg;
};

},{"./flag":32,"./getActual":33,"./inspect":40,"./objDisplay":41}],36:[function(require,module,exports){
/*!
 * Chai - getName utility
 * Copyright(c) 2012-2014 Jake Luer <jake@alogicalparadox.com>
 * MIT Licensed
 */

/**
 * # getName(func)
 *
 * Gets the name of a function, in a cross-browser way.
 *
 * @param {Function} a function (usually a constructor)
 */

module.exports = function (func) {
  if (func.name) return func.name;

  var match = /^\s?function ([^(]*)\(/.exec(func);
  return match && match[1] ? match[1] : "";
};

},{}],37:[function(require,module,exports){
/*!
 * Chai - getPathValue utility
 * Copyright(c) 2012-2014 Jake Luer <jake@alogicalparadox.com>
 * @see https://github.com/logicalparadox/filtr
 * MIT Licensed
 */

/**
 * ### .getPathValue(path, object)
 *
 * This allows the retrieval of values in an
 * object given a string path.
 *
 *     var obj = {
 *         prop1: {
 *             arr: ['a', 'b', 'c']
 *           , str: 'Hello'
 *         }
 *       , prop2: {
 *             arr: [ { nested: 'Universe' } ]
 *           , str: 'Hello again!'
 *         }
 *     }
 *
 * The following would be the results.
 *
 *     getPathValue('prop1.str', obj); // Hello
 *     getPathValue('prop1.att[2]', obj); // b
 *     getPathValue('prop2.arr[0].nested', obj); // Universe
 *
 * @param {String} path
 * @param {Object} object
 * @returns {Object} value or `undefined`
 * @name getPathValue
 * @api public
 */

var getPathValue = module.exports = function (path, obj) {
  var parsed = parsePath(path);
  return _getPathValue(parsed, obj);
};

/*!
 * ## parsePath(path)
 *
 * Helper function used to parse string object
 * paths. Use in conjunction with `_getPathValue`.
 *
 *      var parsed = parsePath('myobject.property.subprop');
 *
 * ### Paths:
 *
 * * Can be as near infinitely deep and nested
 * * Arrays are also valid using the formal `myobject.document[3].property`.
 *
 * @param {String} path
 * @returns {Object} parsed
 * @api private
 */

function parsePath (path) {
  var str = path.replace(/\[/g, '.[')
    , parts = str.match(/(\\\.|[^.]+?)+/g);
  return parts.map(function (value) {
    var re = /\[(\d+)\]$/
      , mArr = re.exec(value)
    if (mArr) return { i: parseFloat(mArr[1]) };
    else return { p: value };
  });
};

/*!
 * ## _getPathValue(parsed, obj)
 *
 * Helper companion function for `.parsePath` that returns
 * the value located at the parsed address.
 *
 *      var value = getPathValue(parsed, obj);
 *
 * @param {Object} parsed definition from `parsePath`.
 * @param {Object} object to search against
 * @returns {Object|Undefined} value
 * @api private
 */

function _getPathValue (parsed, obj) {
  var tmp = obj
    , res;
  for (var i = 0, l = parsed.length; i < l; i++) {
    var part = parsed[i];
    if (tmp) {
      if ('undefined' !== typeof part.p)
        tmp = tmp[part.p];
      else if ('undefined' !== typeof part.i)
        tmp = tmp[part.i];
      if (i == (l - 1)) res = tmp;
    } else {
      res = undefined;
    }
  }
  return res;
};

},{}],38:[function(require,module,exports){
/*!
 * Chai - getProperties utility
 * Copyright(c) 2012-2014 Jake Luer <jake@alogicalparadox.com>
 * MIT Licensed
 */

/**
 * ### .getProperties(object)
 *
 * This allows the retrieval of property names of an object, enumerable or not,
 * inherited or not.
 *
 * @param {Object} object
 * @returns {Array}
 * @name getProperties
 * @api public
 */

module.exports = function getProperties(object) {
  var result = Object.getOwnPropertyNames(subject);

  function addProperty(property) {
    if (result.indexOf(property) === -1) {
      result.push(property);
    }
  }

  var proto = Object.getPrototypeOf(subject);
  while (proto !== null) {
    Object.getOwnPropertyNames(proto).forEach(addProperty);
    proto = Object.getPrototypeOf(proto);
  }

  return result;
};

},{}],39:[function(require,module,exports){
/*!
 * chai
 * Copyright(c) 2011 Jake Luer <jake@alogicalparadox.com>
 * MIT Licensed
 */

/*!
 * Main exports
 */

var exports = module.exports = {};

/*!
 * test utility
 */

exports.test = require('./test');

/*!
 * type utility
 */

exports.type = require('./type');

/*!
 * message utility
 */

exports.getMessage = require('./getMessage');

/*!
 * actual utility
 */

exports.getActual = require('./getActual');

/*!
 * Inspect util
 */

exports.inspect = require('./inspect');

/*!
 * Object Display util
 */

exports.objDisplay = require('./objDisplay');

/*!
 * Flag utility
 */

exports.flag = require('./flag');

/*!
 * Flag transferring utility
 */

exports.transferFlags = require('./transferFlags');

/*!
 * Deep equal utility
 */

exports.eql = require('deep-eql');

/*!
 * Deep path value
 */

exports.getPathValue = require('./getPathValue');

/*!
 * Function name
 */

exports.getName = require('./getName');

/*!
 * add Property
 */

exports.addProperty = require('./addProperty');

/*!
 * add Method
 */

exports.addMethod = require('./addMethod');

/*!
 * overwrite Property
 */

exports.overwriteProperty = require('./overwriteProperty');

/*!
 * overwrite Method
 */

exports.overwriteMethod = require('./overwriteMethod');

/*!
 * Add a chainable method
 */

exports.addChainableMethod = require('./addChainableMethod');

/*!
 * Overwrite chainable method
 */

exports.overwriteChainableMethod = require('./overwriteChainableMethod');


},{"./addChainableMethod":29,"./addMethod":30,"./addProperty":31,"./flag":32,"./getActual":33,"./getMessage":35,"./getName":36,"./getPathValue":37,"./inspect":40,"./objDisplay":41,"./overwriteChainableMethod":42,"./overwriteMethod":43,"./overwriteProperty":44,"./test":45,"./transferFlags":46,"./type":47,"deep-eql":49}],40:[function(require,module,exports){
// This is (almost) directly from Node.js utils
// https://github.com/joyent/node/blob/f8c335d0caf47f16d31413f89aa28eda3878e3aa/lib/util.js

var getName = require('./getName');
var getProperties = require('./getProperties');
var getEnumerableProperties = require('./getEnumerableProperties');

module.exports = inspect;

/**
 * Echos the value of a value. Trys to print the value out
 * in the best way possible given the different types.
 *
 * @param {Object} obj The object to print out.
 * @param {Boolean} showHidden Flag that shows hidden (not enumerable)
 *    properties of objects.
 * @param {Number} depth Depth in which to descend in object. Default is 2.
 * @param {Boolean} colors Flag to turn on ANSI escape codes to color the
 *    output. Default is false (no coloring).
 */
function inspect(obj, showHidden, depth, colors) {
  var ctx = {
    showHidden: showHidden,
    seen: [],
    stylize: function (str) { return str; }
  };
  return formatValue(ctx, obj, (typeof depth === 'undefined' ? 2 : depth));
}

// https://gist.github.com/1044128/
var getOuterHTML = function(element) {
  if ('outerHTML' in element) return element.outerHTML;
  var ns = "http://www.w3.org/1999/xhtml";
  var container = document.createElementNS(ns, '_');
  var elemProto = (window.HTMLElement || window.Element).prototype;
  var xmlSerializer = new XMLSerializer();
  var html;
  if (document.xmlVersion) {
    return xmlSerializer.serializeToString(element);
  } else {
    container.appendChild(element.cloneNode(false));
    html = container.innerHTML.replace('><', '>' + element.innerHTML + '<');
    container.innerHTML = '';
    return html;
  }
};

// Returns true if object is a DOM element.
var isDOMElement = function (object) {
  if (typeof HTMLElement === 'object') {
    return object instanceof HTMLElement;
  } else {
    return object &&
      typeof object === 'object' &&
      object.nodeType === 1 &&
      typeof object.nodeName === 'string';
  }
};

function formatValue(ctx, value, recurseTimes) {
  // Provide a hook for user-specified inspect functions.
  // Check that value is an object with an inspect function on it
  if (value && typeof value.inspect === 'function' &&
      // Filter out the util module, it's inspect function is special
      value.inspect !== exports.inspect &&
      // Also filter out any prototype objects using the circular check.
      !(value.constructor && value.constructor.prototype === value)) {
    var ret = value.inspect(recurseTimes);
    if (typeof ret !== 'string') {
      ret = formatValue(ctx, ret, recurseTimes);
    }
    return ret;
  }

  // Primitive types cannot have properties
  var primitive = formatPrimitive(ctx, value);
  if (primitive) {
    return primitive;
  }

  // If it's DOM elem, get outer HTML.
  if (isDOMElement(value)) {
    return getOuterHTML(value);
  }

  // Look up the keys of the object.
  var visibleKeys = getEnumerableProperties(value);
  var keys = ctx.showHidden ? getProperties(value) : visibleKeys;

  // Some type of object without properties can be shortcutted.
  // In IE, errors have a single `stack` property, or if they are vanilla `Error`,
  // a `stack` plus `description` property; ignore those for consistency.
  if (keys.length === 0 || (isError(value) && (
      (keys.length === 1 && keys[0] === 'stack') ||
      (keys.length === 2 && keys[0] === 'description' && keys[1] === 'stack')
     ))) {
    if (typeof value === 'function') {
      var name = getName(value);
      var nameSuffix = name ? ': ' + name : '';
      return ctx.stylize('[Function' + nameSuffix + ']', 'special');
    }
    if (isRegExp(value)) {
      return ctx.stylize(RegExp.prototype.toString.call(value), 'regexp');
    }
    if (isDate(value)) {
      return ctx.stylize(Date.prototype.toUTCString.call(value), 'date');
    }
    if (isError(value)) {
      return formatError(value);
    }
  }

  var base = '', array = false, braces = ['{', '}'];

  // Make Array say that they are Array
  if (isArray(value)) {
    array = true;
    braces = ['[', ']'];
  }

  // Make functions say that they are functions
  if (typeof value === 'function') {
    var name = getName(value);
    var nameSuffix = name ? ': ' + name : '';
    base = ' [Function' + nameSuffix + ']';
  }

  // Make RegExps say that they are RegExps
  if (isRegExp(value)) {
    base = ' ' + RegExp.prototype.toString.call(value);
  }

  // Make dates with properties first say the date
  if (isDate(value)) {
    base = ' ' + Date.prototype.toUTCString.call(value);
  }

  // Make error with message first say the error
  if (isError(value)) {
    return formatError(value);
  }

  if (keys.length === 0 && (!array || value.length == 0)) {
    return braces[0] + base + braces[1];
  }

  if (recurseTimes < 0) {
    if (isRegExp(value)) {
      return ctx.stylize(RegExp.prototype.toString.call(value), 'regexp');
    } else {
      return ctx.stylize('[Object]', 'special');
    }
  }

  ctx.seen.push(value);

  var output;
  if (array) {
    output = formatArray(ctx, value, recurseTimes, visibleKeys, keys);
  } else {
    output = keys.map(function(key) {
      return formatProperty(ctx, value, recurseTimes, visibleKeys, key, array);
    });
  }

  ctx.seen.pop();

  return reduceToSingleString(output, base, braces);
}


function formatPrimitive(ctx, value) {
  switch (typeof value) {
    case 'undefined':
      return ctx.stylize('undefined', 'undefined');

    case 'string':
      var simple = '\'' + JSON.stringify(value).replace(/^"|"$/g, '')
                                               .replace(/'/g, "\\'")
                                               .replace(/\\"/g, '"') + '\'';
      return ctx.stylize(simple, 'string');

    case 'number':
      return ctx.stylize('' + value, 'number');

    case 'boolean':
      return ctx.stylize('' + value, 'boolean');
  }
  // For some reason typeof null is "object", so special case here.
  if (value === null) {
    return ctx.stylize('null', 'null');
  }
}


function formatError(value) {
  return '[' + Error.prototype.toString.call(value) + ']';
}


function formatArray(ctx, value, recurseTimes, visibleKeys, keys) {
  var output = [];
  for (var i = 0, l = value.length; i < l; ++i) {
    if (Object.prototype.hasOwnProperty.call(value, String(i))) {
      output.push(formatProperty(ctx, value, recurseTimes, visibleKeys,
          String(i), true));
    } else {
      output.push('');
    }
  }
  keys.forEach(function(key) {
    if (!key.match(/^\d+$/)) {
      output.push(formatProperty(ctx, value, recurseTimes, visibleKeys,
          key, true));
    }
  });
  return output;
}


function formatProperty(ctx, value, recurseTimes, visibleKeys, key, array) {
  var name, str;
  if (value.__lookupGetter__) {
    if (value.__lookupGetter__(key)) {
      if (value.__lookupSetter__(key)) {
        str = ctx.stylize('[Getter/Setter]', 'special');
      } else {
        str = ctx.stylize('[Getter]', 'special');
      }
    } else {
      if (value.__lookupSetter__(key)) {
        str = ctx.stylize('[Setter]', 'special');
      }
    }
  }
  if (visibleKeys.indexOf(key) < 0) {
    name = '[' + key + ']';
  }
  if (!str) {
    if (ctx.seen.indexOf(value[key]) < 0) {
      if (recurseTimes === null) {
        str = formatValue(ctx, value[key], null);
      } else {
        str = formatValue(ctx, value[key], recurseTimes - 1);
      }
      if (str.indexOf('\n') > -1) {
        if (array) {
          str = str.split('\n').map(function(line) {
            return '  ' + line;
          }).join('\n').substr(2);
        } else {
          str = '\n' + str.split('\n').map(function(line) {
            return '   ' + line;
          }).join('\n');
        }
      }
    } else {
      str = ctx.stylize('[Circular]', 'special');
    }
  }
  if (typeof name === 'undefined') {
    if (array && key.match(/^\d+$/)) {
      return str;
    }
    name = JSON.stringify('' + key);
    if (name.match(/^"([a-zA-Z_][a-zA-Z_0-9]*)"$/)) {
      name = name.substr(1, name.length - 2);
      name = ctx.stylize(name, 'name');
    } else {
      name = name.replace(/'/g, "\\'")
                 .replace(/\\"/g, '"')
                 .replace(/(^"|"$)/g, "'");
      name = ctx.stylize(name, 'string');
    }
  }

  return name + ': ' + str;
}


function reduceToSingleString(output, base, braces) {
  var numLinesEst = 0;
  var length = output.reduce(function(prev, cur) {
    numLinesEst++;
    if (cur.indexOf('\n') >= 0) numLinesEst++;
    return prev + cur.length + 1;
  }, 0);

  if (length > 60) {
    return braces[0] +
           (base === '' ? '' : base + '\n ') +
           ' ' +
           output.join(',\n  ') +
           ' ' +
           braces[1];
  }

  return braces[0] + base + ' ' + output.join(', ') + ' ' + braces[1];
}

function isArray(ar) {
  return Array.isArray(ar) ||
         (typeof ar === 'object' && objectToString(ar) === '[object Array]');
}

function isRegExp(re) {
  return typeof re === 'object' && objectToString(re) === '[object RegExp]';
}

function isDate(d) {
  return typeof d === 'object' && objectToString(d) === '[object Date]';
}

function isError(e) {
  return typeof e === 'object' && objectToString(e) === '[object Error]';
}

function objectToString(o) {
  return Object.prototype.toString.call(o);
}

},{"./getEnumerableProperties":34,"./getName":36,"./getProperties":38}],41:[function(require,module,exports){
/*!
 * Chai - flag utility
 * Copyright(c) 2012-2014 Jake Luer <jake@alogicalparadox.com>
 * MIT Licensed
 */

/*!
 * Module dependancies
 */

var inspect = require('./inspect');
var config = require('../config');

/**
 * ### .objDisplay (object)
 *
 * Determines if an object or an array matches
 * criteria to be inspected in-line for error
 * messages or should be truncated.
 *
 * @param {Mixed} javascript object to inspect
 * @name objDisplay
 * @api public
 */

module.exports = function (obj) {
  var str = inspect(obj)
    , type = Object.prototype.toString.call(obj);

  if (config.truncateThreshold && str.length >= config.truncateThreshold) {
    if (type === '[object Function]') {
      return !obj.name || obj.name === ''
        ? '[Function]'
        : '[Function: ' + obj.name + ']';
    } else if (type === '[object Array]') {
      return '[ Array(' + obj.length + ') ]';
    } else if (type === '[object Object]') {
      var keys = Object.keys(obj)
        , kstr = keys.length > 2
          ? keys.splice(0, 2).join(', ') + ', ...'
          : keys.join(', ');
      return '{ Object (' + kstr + ') }';
    } else {
      return str;
    }
  } else {
    return str;
  }
};

},{"../config":24,"./inspect":40}],42:[function(require,module,exports){
/*!
 * Chai - overwriteChainableMethod utility
 * Copyright(c) 2012-2014 Jake Luer <jake@alogicalparadox.com>
 * MIT Licensed
 */

/**
 * ### overwriteChainableMethod (ctx, name, fn)
 *
 * Overwites an already existing chainable method
 * and provides access to the previous function or
 * property.  Must return functions to be used for
 * name.
 *
 *     utils.overwriteChainableMethod(chai.Assertion.prototype, 'length',
 *       function (_super) {
 *       }
 *     , function (_super) {
 *       }
 *     );
 *
 * Can also be accessed directly from `chai.Assertion`.
 *
 *     chai.Assertion.overwriteChainableMethod('foo', fn, fn);
 *
 * Then can be used as any other assertion.
 *
 *     expect(myFoo).to.have.length(3);
 *     expect(myFoo).to.have.length.above(3);
 *
 * @param {Object} ctx object whose method / property is to be overwritten
 * @param {String} name of method / property to overwrite
 * @param {Function} method function that returns a function to be used for name
 * @param {Function} chainingBehavior function that returns a function to be used for property
 * @name overwriteChainableMethod
 * @api public
 */

module.exports = function (ctx, name, method, chainingBehavior) {
  var chainableBehavior = ctx.__methods[name];

  var _chainingBehavior = chainableBehavior.chainingBehavior;
  chainableBehavior.chainingBehavior = function () {
    var result = chainingBehavior(_chainingBehavior).call(this);
    return result === undefined ? this : result;
  };

  var _method = chainableBehavior.method;
  chainableBehavior.method = function () {
    var result = method(_method).apply(this, arguments);
    return result === undefined ? this : result;
  };
};

},{}],43:[function(require,module,exports){
/*!
 * Chai - overwriteMethod utility
 * Copyright(c) 2012-2014 Jake Luer <jake@alogicalparadox.com>
 * MIT Licensed
 */

/**
 * ### overwriteMethod (ctx, name, fn)
 *
 * Overwites an already existing method and provides
 * access to previous function. Must return function
 * to be used for name.
 *
 *     utils.overwriteMethod(chai.Assertion.prototype, 'equal', function (_super) {
 *       return function (str) {
 *         var obj = utils.flag(this, 'object');
 *         if (obj instanceof Foo) {
 *           new chai.Assertion(obj.value).to.equal(str);
 *         } else {
 *           _super.apply(this, arguments);
 *         }
 *       }
 *     });
 *
 * Can also be accessed directly from `chai.Assertion`.
 *
 *     chai.Assertion.overwriteMethod('foo', fn);
 *
 * Then can be used as any other assertion.
 *
 *     expect(myFoo).to.equal('bar');
 *
 * @param {Object} ctx object whose method is to be overwritten
 * @param {String} name of method to overwrite
 * @param {Function} method function that returns a function to be used for name
 * @name overwriteMethod
 * @api public
 */

module.exports = function (ctx, name, method) {
  var _method = ctx[name]
    , _super = function () { return this; };

  if (_method && 'function' === typeof _method)
    _super = _method;

  ctx[name] = function () {
    var result = method(_super).apply(this, arguments);
    return result === undefined ? this : result;
  }
};

},{}],44:[function(require,module,exports){
/*!
 * Chai - overwriteProperty utility
 * Copyright(c) 2012-2014 Jake Luer <jake@alogicalparadox.com>
 * MIT Licensed
 */

/**
 * ### overwriteProperty (ctx, name, fn)
 *
 * Overwites an already existing property getter and provides
 * access to previous value. Must return function to use as getter.
 *
 *     utils.overwriteProperty(chai.Assertion.prototype, 'ok', function (_super) {
 *       return function () {
 *         var obj = utils.flag(this, 'object');
 *         if (obj instanceof Foo) {
 *           new chai.Assertion(obj.name).to.equal('bar');
 *         } else {
 *           _super.call(this);
 *         }
 *       }
 *     });
 *
 *
 * Can also be accessed directly from `chai.Assertion`.
 *
 *     chai.Assertion.overwriteProperty('foo', fn);
 *
 * Then can be used as any other assertion.
 *
 *     expect(myFoo).to.be.ok;
 *
 * @param {Object} ctx object whose property is to be overwritten
 * @param {String} name of property to overwrite
 * @param {Function} getter function that returns a getter function to be used for name
 * @name overwriteProperty
 * @api public
 */

module.exports = function (ctx, name, getter) {
  var _get = Object.getOwnPropertyDescriptor(ctx, name)
    , _super = function () {};

  if (_get && 'function' === typeof _get.get)
    _super = _get.get

  Object.defineProperty(ctx, name,
    { get: function () {
        var result = getter(_super).call(this);
        return result === undefined ? this : result;
      }
    , configurable: true
  });
};

},{}],45:[function(require,module,exports){
/*!
 * Chai - test utility
 * Copyright(c) 2012-2014 Jake Luer <jake@alogicalparadox.com>
 * MIT Licensed
 */

/*!
 * Module dependancies
 */

var flag = require('./flag');

/**
 * # test(object, expression)
 *
 * Test and object for expression.
 *
 * @param {Object} object (constructed Assertion)
 * @param {Arguments} chai.Assertion.prototype.assert arguments
 */

module.exports = function (obj, args) {
  var negate = flag(obj, 'negate')
    , expr = args[0];
  return negate ? !expr : expr;
};

},{"./flag":32}],46:[function(require,module,exports){
/*!
 * Chai - transferFlags utility
 * Copyright(c) 2012-2014 Jake Luer <jake@alogicalparadox.com>
 * MIT Licensed
 */

/**
 * ### transferFlags(assertion, object, includeAll = true)
 *
 * Transfer all the flags for `assertion` to `object`. If
 * `includeAll` is set to `false`, then the base Chai
 * assertion flags (namely `object`, `ssfi`, and `message`)
 * will not be transferred.
 *
 *
 *     var newAssertion = new Assertion();
 *     utils.transferFlags(assertion, newAssertion);
 *
 *     var anotherAsseriton = new Assertion(myObj);
 *     utils.transferFlags(assertion, anotherAssertion, false);
 *
 * @param {Assertion} assertion the assertion to transfer the flags from
 * @param {Object} object the object to transfer the flags too; usually a new assertion
 * @param {Boolean} includeAll
 * @name getAllFlags
 * @api private
 */

module.exports = function (assertion, object, includeAll) {
  var flags = assertion.__flags || (assertion.__flags = Object.create(null));

  if (!object.__flags) {
    object.__flags = Object.create(null);
  }

  includeAll = arguments.length === 3 ? includeAll : true;

  for (var flag in flags) {
    if (includeAll ||
        (flag !== 'object' && flag !== 'ssfi' && flag != 'message')) {
      object.__flags[flag] = flags[flag];
    }
  }
};

},{}],47:[function(require,module,exports){
/*!
 * Chai - type utility
 * Copyright(c) 2012-2014 Jake Luer <jake@alogicalparadox.com>
 * MIT Licensed
 */

/*!
 * Detectable javascript natives
 */

var natives = {
    '[object Arguments]': 'arguments'
  , '[object Array]': 'array'
  , '[object Date]': 'date'
  , '[object Function]': 'function'
  , '[object Number]': 'number'
  , '[object RegExp]': 'regexp'
  , '[object String]': 'string'
};

/**
 * ### type(object)
 *
 * Better implementation of `typeof` detection that can
 * be used cross-browser. Handles the inconsistencies of
 * Array, `null`, and `undefined` detection.
 *
 *     utils.type({}) // 'object'
 *     utils.type(null) // `null'
 *     utils.type(undefined) // `undefined`
 *     utils.type([]) // `array`
 *
 * @param {Mixed} object to detect type of
 * @name type
 * @api private
 */

module.exports = function (obj) {
  var str = Object.prototype.toString.call(obj);
  if (natives[str]) return natives[str];
  if (obj === null) return 'null';
  if (obj === undefined) return 'undefined';
  if (obj === Object(obj)) return 'object';
  return typeof obj;
};

},{}],48:[function(require,module,exports){
/*!
 * assertion-error
 * Copyright(c) 2013 Jake Luer <jake@qualiancy.com>
 * MIT Licensed
 */

/*!
 * Return a function that will copy properties from
 * one object to another excluding any originally
 * listed. Returned function will create a new `{}`.
 *
 * @param {String} excluded properties ...
 * @return {Function}
 */

function exclude () {
  var excludes = [].slice.call(arguments);

  function excludeProps (res, obj) {
    Object.keys(obj).forEach(function (key) {
      if (!~excludes.indexOf(key)) res[key] = obj[key];
    });
  }

  return function extendExclude () {
    var args = [].slice.call(arguments)
      , i = 0
      , res = {};

    for (; i < args.length; i++) {
      excludeProps(res, args[i]);
    }

    return res;
  };
};

/*!
 * Primary Exports
 */

module.exports = AssertionError;

/**
 * ### AssertionError
 *
 * An extension of the JavaScript `Error` constructor for
 * assertion and validation scenarios.
 *
 * @param {String} message
 * @param {Object} properties to include (optional)
 * @param {callee} start stack function (optional)
 */

function AssertionError (message, _props, ssf) {
  var extend = exclude('name', 'message', 'stack', 'constructor', 'toJSON')
    , props = extend(_props || {});

  // default values
  this.message = message || 'Unspecified AssertionError';
  this.showDiff = false;

  // copy from properties
  for (var key in props) {
    this[key] = props[key];
  }

  // capture stack trace
  ssf = ssf || arguments.callee;
  if (ssf && Error.captureStackTrace) {
    Error.captureStackTrace(this, ssf);
  }
}

/*!
 * Inherit from Error.prototype
 */

AssertionError.prototype = Object.create(Error.prototype);

/*!
 * Statically set name
 */

AssertionError.prototype.name = 'AssertionError';

/*!
 * Ensure correct constructor
 */

AssertionError.prototype.constructor = AssertionError;

/**
 * Allow errors to be converted to JSON for static transfer.
 *
 * @param {Boolean} include stack (default: `true`)
 * @return {Object} object that can be `JSON.stringify`
 */

AssertionError.prototype.toJSON = function (stack) {
  var extend = exclude('constructor', 'toJSON', 'stack')
    , props = extend({ name: this.name }, this);

  // include stack if exists and not turned off
  if (false !== stack && this.stack) {
    props.stack = this.stack;
  }

  return props;
};

},{}],49:[function(require,module,exports){
module.exports = require('./lib/eql');

},{"./lib/eql":50}],50:[function(require,module,exports){
/*!
 * deep-eql
 * Copyright(c) 2013 Jake Luer <jake@alogicalparadox.com>
 * MIT Licensed
 */

/*!
 * Module dependencies
 */

var type = require('type-detect');

/*!
 * Buffer.isBuffer browser shim
 */

var Buffer;
try { Buffer = require('buffer').Buffer; }
catch(ex) {
  Buffer = {};
  Buffer.isBuffer = function() { return false; }
}

/*!
 * Primary Export
 */

module.exports = deepEqual;

/**
 * Assert super-strict (egal) equality between
 * two objects of any type.
 *
 * @param {Mixed} a
 * @param {Mixed} b
 * @param {Array} memoised (optional)
 * @return {Boolean} equal match
 */

function deepEqual(a, b, m) {
  if (sameValue(a, b)) {
    return true;
  } else if ('date' === type(a)) {
    return dateEqual(a, b);
  } else if ('regexp' === type(a)) {
    return regexpEqual(a, b);
  } else if (Buffer.isBuffer(a)) {
    return bufferEqual(a, b);
  } else if ('arguments' === type(a)) {
    return argumentsEqual(a, b, m);
  } else if (!typeEqual(a, b)) {
    return false;
  } else if (('object' !== type(a) && 'object' !== type(b))
  && ('array' !== type(a) && 'array' !== type(b))) {
    return sameValue(a, b);
  } else {
    return objectEqual(a, b, m);
  }
}

/*!
 * Strict (egal) equality test. Ensures that NaN always
 * equals NaN and `-0` does not equal `+0`.
 *
 * @param {Mixed} a
 * @param {Mixed} b
 * @return {Boolean} equal match
 */

function sameValue(a, b) {
  if (a === b) return a !== 0 || 1 / a === 1 / b;
  return a !== a && b !== b;
}

/*!
 * Compare the types of two given objects and
 * return if they are equal. Note that an Array
 * has a type of `array` (not `object`) and arguments
 * have a type of `arguments` (not `array`/`object`).
 *
 * @param {Mixed} a
 * @param {Mixed} b
 * @return {Boolean} result
 */

function typeEqual(a, b) {
  return type(a) === type(b);
}

/*!
 * Compare two Date objects by asserting that
 * the time values are equal using `saveValue`.
 *
 * @param {Date} a
 * @param {Date} b
 * @return {Boolean} result
 */

function dateEqual(a, b) {
  if ('date' !== type(b)) return false;
  return sameValue(a.getTime(), b.getTime());
}

/*!
 * Compare two regular expressions by converting them
 * to string and checking for `sameValue`.
 *
 * @param {RegExp} a
 * @param {RegExp} b
 * @return {Boolean} result
 */

function regexpEqual(a, b) {
  if ('regexp' !== type(b)) return false;
  return sameValue(a.toString(), b.toString());
}

/*!
 * Assert deep equality of two `arguments` objects.
 * Unfortunately, these must be sliced to arrays
 * prior to test to ensure no bad behavior.
 *
 * @param {Arguments} a
 * @param {Arguments} b
 * @param {Array} memoize (optional)
 * @return {Boolean} result
 */

function argumentsEqual(a, b, m) {
  if ('arguments' !== type(b)) return false;
  a = [].slice.call(a);
  b = [].slice.call(b);
  return deepEqual(a, b, m);
}

/*!
 * Get enumerable properties of a given object.
 *
 * @param {Object} a
 * @return {Array} property names
 */

function enumerable(a) {
  var res = [];
  for (var key in a) res.push(key);
  return res;
}

/*!
 * Simple equality for flat iterable objects
 * such as Arrays or Node.js buffers.
 *
 * @param {Iterable} a
 * @param {Iterable} b
 * @return {Boolean} result
 */

function iterableEqual(a, b) {
  if (a.length !==  b.length) return false;

  var i = 0;
  var match = true;

  for (; i < a.length; i++) {
    if (a[i] !== b[i]) {
      match = false;
      break;
    }
  }

  return match;
}

/*!
 * Extension to `iterableEqual` specifically
 * for Node.js Buffers.
 *
 * @param {Buffer} a
 * @param {Mixed} b
 * @return {Boolean} result
 */

function bufferEqual(a, b) {
  if (!Buffer.isBuffer(b)) return false;
  return iterableEqual(a, b);
}

/*!
 * Block for `objectEqual` ensuring non-existing
 * values don't get in.
 *
 * @param {Mixed} object
 * @return {Boolean} result
 */

function isValue(a) {
  return a !== null && a !== undefined;
}

/*!
 * Recursively check the equality of two objects.
 * Once basic sameness has been established it will
 * defer to `deepEqual` for each enumerable key
 * in the object.
 *
 * @param {Mixed} a
 * @param {Mixed} b
 * @return {Boolean} result
 */

function objectEqual(a, b, m) {
  if (!isValue(a) || !isValue(b)) {
    return false;
  }

  if (a.prototype !== b.prototype) {
    return false;
  }

  var i;
  if (m) {
    for (i = 0; i < m.length; i++) {
      if ((m[i][0] === a && m[i][1] === b)
      ||  (m[i][0] === b && m[i][1] === a)) {
        return true;
      }
    }
  } else {
    m = [];
  }

  try {
    var ka = enumerable(a);
    var kb = enumerable(b);
  } catch (ex) {
    return false;
  }

  ka.sort();
  kb.sort();

  if (!iterableEqual(ka, kb)) {
    return false;
  }

  m.push([ a, b ]);

  var key;
  for (i = ka.length - 1; i >= 0; i--) {
    key = ka[i];
    if (!deepEqual(a[key], b[key], m)) {
      return false;
    }
  }

  return true;
}

},{"buffer":54,"type-detect":51}],51:[function(require,module,exports){
module.exports = require('./lib/type');

},{"./lib/type":52}],52:[function(require,module,exports){
/*!
 * type-detect
 * Copyright(c) 2013 jake luer <jake@alogicalparadox.com>
 * MIT Licensed
 */

/*!
 * Primary Exports
 */

var exports = module.exports = getType;

/*!
 * Detectable javascript natives
 */

var natives = {
    '[object Array]': 'array'
  , '[object RegExp]': 'regexp'
  , '[object Function]': 'function'
  , '[object Arguments]': 'arguments'
  , '[object Date]': 'date'
};

/**
 * ### typeOf (obj)
 *
 * Use several different techniques to determine
 * the type of object being tested.
 *
 *
 * @param {Mixed} object
 * @return {String} object type
 * @api public
 */

function getType (obj) {
  var str = Object.prototype.toString.call(obj);
  if (natives[str]) return natives[str];
  if (obj === null) return 'null';
  if (obj === undefined) return 'undefined';
  if (obj === Object(obj)) return 'object';
  return typeof obj;
}

exports.Library = Library;

/**
 * ### Library
 *
 * Create a repository for custom type detection.
 *
 * ```js
 * var lib = new type.Library;
 * ```
 *
 */

function Library () {
  this.tests = {};
}

/**
 * #### .of (obj)
 *
 * Expose replacement `typeof` detection to the library.
 *
 * ```js
 * if ('string' === lib.of('hello world')) {
 *   // ...
 * }
 * ```
 *
 * @param {Mixed} object to test
 * @return {String} type
 */

Library.prototype.of = getType;

/**
 * #### .define (type, test)
 *
 * Add a test to for the `.test()` assertion.
 *
 * Can be defined as a regular expression:
 *
 * ```js
 * lib.define('int', /^[0-9]+$/);
 * ```
 *
 * ... or as a function:
 *
 * ```js
 * lib.define('bln', function (obj) {
 *   if ('boolean' === lib.of(obj)) return true;
 *   var blns = [ 'yes', 'no', 'true', 'false', 1, 0 ];
 *   if ('string' === lib.of(obj)) obj = obj.toLowerCase();
 *   return !! ~blns.indexOf(obj);
 * });
 * ```
 *
 * @param {String} type
 * @param {RegExp|Function} test
 * @api public
 */

Library.prototype.define = function (type, test) {
  if (arguments.length === 1) return this.tests[type];
  this.tests[type] = test;
  return this;
};

/**
 * #### .test (obj, test)
 *
 * Assert that an object is of type. Will first
 * check natives, and if that does not pass it will
 * use the user defined custom tests.
 *
 * ```js
 * assert(lib.test('1', 'int'));
 * assert(lib.test('yes', 'bln'));
 * ```
 *
 * @param {Mixed} object
 * @param {String} type
 * @return {Boolean} result
 * @api public
 */

Library.prototype.test = function (obj, type) {
  if (type === getType(obj)) return true;
  var test = this.tests[type];

  if (test && 'regexp' === getType(test)) {
    return test.test(obj);
  } else if (test && 'function' === getType(test)) {
    return test(obj);
  } else {
    throw new ReferenceError('Type test "' + type + '" not defined or invalid.');
  }
};

},{}],53:[function(require,module,exports){

},{}],54:[function(require,module,exports){
/*!
 * The buffer module from node.js, for the browser.
 *
 * @author   Feross Aboukhadijeh <feross@feross.org> <http://feross.org>
 * @license  MIT
 */

var base64 = require('base64-js')
var ieee754 = require('ieee754')

exports.Buffer = Buffer
exports.SlowBuffer = Buffer
exports.INSPECT_MAX_BYTES = 50
Buffer.poolSize = 8192

/**
 * If `TYPED_ARRAY_SUPPORT`:
 *   === true    Use Uint8Array implementation (fastest)
 *   === false   Use Object implementation (most compatible, even IE6)
 *
 * Browsers that support typed arrays are IE 10+, Firefox 4+, Chrome 7+, Safari 5.1+,
 * Opera 11.6+, iOS 4.2+.
 *
 * Note:
 *
 * - Implementation must support adding new properties to `Uint8Array` instances.
 *   Firefox 4-29 lacked support, fixed in Firefox 30+.
 *   See: https://bugzilla.mozilla.org/show_bug.cgi?id=695438.
 *
 *  - Chrome 9-10 is missing the `TypedArray.prototype.subarray` function.
 *
 *  - IE10 has a broken `TypedArray.prototype.subarray` function which returns arrays of
 *    incorrect length in some situations.
 *
 * We detect these buggy browsers and set `TYPED_ARRAY_SUPPORT` to `false` so they will
 * get the Object implementation, which is slower but will work correctly.
 */
var TYPED_ARRAY_SUPPORT = (function () {
  try {
    var buf = new ArrayBuffer(0)
    var arr = new Uint8Array(buf)
    arr.foo = function () { return 42 }
    return 42 === arr.foo() && // typed array instances can be augmented
        typeof arr.subarray === 'function' && // chrome 9-10 lack `subarray`
        new Uint8Array(1).subarray(1, 1).byteLength === 0 // ie10 has broken `subarray`
  } catch (e) {
    return false
  }
})()

/**
 * Class: Buffer
 * =============
 *
 * The Buffer constructor returns instances of `Uint8Array` that are augmented
 * with function properties for all the node `Buffer` API functions. We use
 * `Uint8Array` so that square bracket notation works as expected -- it returns
 * a single octet.
 *
 * By augmenting the instances, we can avoid modifying the `Uint8Array`
 * prototype.
 */
function Buffer (subject, encoding, noZero) {
  if (!(this instanceof Buffer))
    return new Buffer(subject, encoding, noZero)

  var type = typeof subject

  // Find the length
  var length
  if (type === 'number')
    length = subject > 0 ? subject >>> 0 : 0
  else if (type === 'string') {
    if (encoding === 'base64')
      subject = base64clean(subject)
    length = Buffer.byteLength(subject, encoding)
  } else if (type === 'object' && subject !== null) { // assume object is array-like
    if (subject.type === 'Buffer' && isArray(subject.data))
      subject = subject.data
    length = +subject.length > 0 ? Math.floor(+subject.length) : 0
  } else
    throw new Error('First argument needs to be a number, array or string.')

  var buf
  if (TYPED_ARRAY_SUPPORT) {
    // Preferred: Return an augmented `Uint8Array` instance for best performance
    buf = Buffer._augment(new Uint8Array(length))
  } else {
    // Fallback: Return THIS instance of Buffer (created by `new`)
    buf = this
    buf.length = length
    buf._isBuffer = true
  }

  var i
  if (TYPED_ARRAY_SUPPORT && typeof subject.byteLength === 'number') {
    // Speed optimization -- use set if we're copying from a typed array
    buf._set(subject)
  } else if (isArrayish(subject)) {
    // Treat array-ish objects as a byte array
    if (Buffer.isBuffer(subject)) {
      for (i = 0; i < length; i++)
        buf[i] = subject.readUInt8(i)
    } else {
      for (i = 0; i < length; i++)
        buf[i] = ((subject[i] % 256) + 256) % 256
    }
  } else if (type === 'string') {
    buf.write(subject, 0, encoding)
  } else if (type === 'number' && !TYPED_ARRAY_SUPPORT && !noZero) {
    for (i = 0; i < length; i++) {
      buf[i] = 0
    }
  }

  return buf
}

// STATIC METHODS
// ==============

Buffer.isEncoding = function (encoding) {
  switch (String(encoding).toLowerCase()) {
    case 'hex':
    case 'utf8':
    case 'utf-8':
    case 'ascii':
    case 'binary':
    case 'base64':
    case 'raw':
    case 'ucs2':
    case 'ucs-2':
    case 'utf16le':
    case 'utf-16le':
      return true
    default:
      return false
  }
}

Buffer.isBuffer = function (b) {
  return !!(b != null && b._isBuffer)
}

Buffer.byteLength = function (str, encoding) {
  var ret
  str = str.toString()
  switch (encoding || 'utf8') {
    case 'hex':
      ret = str.length / 2
      break
    case 'utf8':
    case 'utf-8':
      ret = utf8ToBytes(str).length
      break
    case 'ascii':
    case 'binary':
    case 'raw':
      ret = str.length
      break
    case 'base64':
      ret = base64ToBytes(str).length
      break
    case 'ucs2':
    case 'ucs-2':
    case 'utf16le':
    case 'utf-16le':
      ret = str.length * 2
      break
    default:
      throw new Error('Unknown encoding')
  }
  return ret
}

Buffer.concat = function (list, totalLength) {
  assert(isArray(list), 'Usage: Buffer.concat(list[, length])')

  if (list.length === 0) {
    return new Buffer(0)
  } else if (list.length === 1) {
    return list[0]
  }

  var i
  if (totalLength === undefined) {
    totalLength = 0
    for (i = 0; i < list.length; i++) {
      totalLength += list[i].length
    }
  }

  var buf = new Buffer(totalLength)
  var pos = 0
  for (i = 0; i < list.length; i++) {
    var item = list[i]
    item.copy(buf, pos)
    pos += item.length
  }
  return buf
}

Buffer.compare = function (a, b) {
  assert(Buffer.isBuffer(a) && Buffer.isBuffer(b), 'Arguments must be Buffers')
  var x = a.length
  var y = b.length
  for (var i = 0, len = Math.min(x, y); i < len && a[i] === b[i]; i++) {}
  if (i !== len) {
    x = a[i]
    y = b[i]
  }
  if (x < y) {
    return -1
  }
  if (y < x) {
    return 1
  }
  return 0
}

// BUFFER INSTANCE METHODS
// =======================

function hexWrite (buf, string, offset, length) {
  offset = Number(offset) || 0
  var remaining = buf.length - offset
  if (!length) {
    length = remaining
  } else {
    length = Number(length)
    if (length > remaining) {
      length = remaining
    }
  }

  // must be an even number of digits
  var strLen = string.length
  assert(strLen % 2 === 0, 'Invalid hex string')

  if (length > strLen / 2) {
    length = strLen / 2
  }
  for (var i = 0; i < length; i++) {
    var byte = parseInt(string.substr(i * 2, 2), 16)
    assert(!isNaN(byte), 'Invalid hex string')
    buf[offset + i] = byte
  }
  return i
}

function utf8Write (buf, string, offset, length) {
  var charsWritten = blitBuffer(utf8ToBytes(string), buf, offset, length)
  return charsWritten
}

function asciiWrite (buf, string, offset, length) {
  var charsWritten = blitBuffer(asciiToBytes(string), buf, offset, length)
  return charsWritten
}

function binaryWrite (buf, string, offset, length) {
  return asciiWrite(buf, string, offset, length)
}

function base64Write (buf, string, offset, length) {
  var charsWritten = blitBuffer(base64ToBytes(string), buf, offset, length)
  return charsWritten
}

function utf16leWrite (buf, string, offset, length) {
  var charsWritten = blitBuffer(utf16leToBytes(string), buf, offset, length)
  return charsWritten
}

Buffer.prototype.write = function (string, offset, length, encoding) {
  // Support both (string, offset, length, encoding)
  // and the legacy (string, encoding, offset, length)
  if (isFinite(offset)) {
    if (!isFinite(length)) {
      encoding = length
      length = undefined
    }
  } else {  // legacy
    var swap = encoding
    encoding = offset
    offset = length
    length = swap
  }

  offset = Number(offset) || 0
  var remaining = this.length - offset
  if (!length) {
    length = remaining
  } else {
    length = Number(length)
    if (length > remaining) {
      length = remaining
    }
  }
  encoding = String(encoding || 'utf8').toLowerCase()

  var ret
  switch (encoding) {
    case 'hex':
      ret = hexWrite(this, string, offset, length)
      break
    case 'utf8':
    case 'utf-8':
      ret = utf8Write(this, string, offset, length)
      break
    case 'ascii':
      ret = asciiWrite(this, string, offset, length)
      break
    case 'binary':
      ret = binaryWrite(this, string, offset, length)
      break
    case 'base64':
      ret = base64Write(this, string, offset, length)
      break
    case 'ucs2':
    case 'ucs-2':
    case 'utf16le':
    case 'utf-16le':
      ret = utf16leWrite(this, string, offset, length)
      break
    default:
      throw new Error('Unknown encoding')
  }
  return ret
}

Buffer.prototype.toString = function (encoding, start, end) {
  var self = this

  encoding = String(encoding || 'utf8').toLowerCase()
  start = Number(start) || 0
  end = (end === undefined) ? self.length : Number(end)

  // Fastpath empty strings
  if (end === start)
    return ''

  var ret
  switch (encoding) {
    case 'hex':
      ret = hexSlice(self, start, end)
      break
    case 'utf8':
    case 'utf-8':
      ret = utf8Slice(self, start, end)
      break
    case 'ascii':
      ret = asciiSlice(self, start, end)
      break
    case 'binary':
      ret = binarySlice(self, start, end)
      break
    case 'base64':
      ret = base64Slice(self, start, end)
      break
    case 'ucs2':
    case 'ucs-2':
    case 'utf16le':
    case 'utf-16le':
      ret = utf16leSlice(self, start, end)
      break
    default:
      throw new Error('Unknown encoding')
  }
  return ret
}

Buffer.prototype.toJSON = function () {
  return {
    type: 'Buffer',
    data: Array.prototype.slice.call(this._arr || this, 0)
  }
}

Buffer.prototype.equals = function (b) {
  assert(Buffer.isBuffer(b), 'Argument must be a Buffer')
  return Buffer.compare(this, b) === 0
}

Buffer.prototype.compare = function (b) {
  assert(Buffer.isBuffer(b), 'Argument must be a Buffer')
  return Buffer.compare(this, b)
}

// copy(targetBuffer, targetStart=0, sourceStart=0, sourceEnd=buffer.length)
Buffer.prototype.copy = function (target, target_start, start, end) {
  var source = this

  if (!start) start = 0
  if (!end && end !== 0) end = this.length
  if (!target_start) target_start = 0

  // Copy 0 bytes; we're done
  if (end === start) return
  if (target.length === 0 || source.length === 0) return

  // Fatal error conditions
  assert(end >= start, 'sourceEnd < sourceStart')
  assert(target_start >= 0 && target_start < target.length,
      'targetStart out of bounds')
  assert(start >= 0 && start < source.length, 'sourceStart out of bounds')
  assert(end >= 0 && end <= source.length, 'sourceEnd out of bounds')

  // Are we oob?
  if (end > this.length)
    end = this.length
  if (target.length - target_start < end - start)
    end = target.length - target_start + start

  var len = end - start

  if (len < 100 || !TYPED_ARRAY_SUPPORT) {
    for (var i = 0; i < len; i++) {
      target[i + target_start] = this[i + start]
    }
  } else {
    target._set(this.subarray(start, start + len), target_start)
  }
}

function base64Slice (buf, start, end) {
  if (start === 0 && end === buf.length) {
    return base64.fromByteArray(buf)
  } else {
    return base64.fromByteArray(buf.slice(start, end))
  }
}

function utf8Slice (buf, start, end) {
  var res = ''
  var tmp = ''
  end = Math.min(buf.length, end)

  for (var i = start; i < end; i++) {
    if (buf[i] <= 0x7F) {
      res += decodeUtf8Char(tmp) + String.fromCharCode(buf[i])
      tmp = ''
    } else {
      tmp += '%' + buf[i].toString(16)
    }
  }

  return res + decodeUtf8Char(tmp)
}

function asciiSlice (buf, start, end) {
  var ret = ''
  end = Math.min(buf.length, end)

  for (var i = start; i < end; i++) {
    ret += String.fromCharCode(buf[i])
  }
  return ret
}

function binarySlice (buf, start, end) {
  return asciiSlice(buf, start, end)
}

function hexSlice (buf, start, end) {
  var len = buf.length

  if (!start || start < 0) start = 0
  if (!end || end < 0 || end > len) end = len

  var out = ''
  for (var i = start; i < end; i++) {
    out += toHex(buf[i])
  }
  return out
}

function utf16leSlice (buf, start, end) {
  var bytes = buf.slice(start, end)
  var res = ''
  for (var i = 0; i < bytes.length; i += 2) {
    res += String.fromCharCode(bytes[i] + bytes[i + 1] * 256)
  }
  return res
}

Buffer.prototype.slice = function (start, end) {
  var len = this.length
  start = ~~start
  end = end === undefined ? len : ~~end

  if (start < 0) {
    start += len;
    if (start < 0)
      start = 0
  } else if (start > len) {
    start = len
  }

  if (end < 0) {
    end += len
    if (end < 0)
      end = 0
  } else if (end > len) {
    end = len
  }

  if (end < start)
    end = start

  if (TYPED_ARRAY_SUPPORT) {
    return Buffer._augment(this.subarray(start, end))
  } else {
    var sliceLen = end - start
    var newBuf = new Buffer(sliceLen, undefined, true)
    for (var i = 0; i < sliceLen; i++) {
      newBuf[i] = this[i + start]
    }
    return newBuf
  }
}

// `get` will be removed in Node 0.13+
Buffer.prototype.get = function (offset) {
  console.log('.get() is deprecated. Access using array indexes instead.')
  return this.readUInt8(offset)
}

// `set` will be removed in Node 0.13+
Buffer.prototype.set = function (v, offset) {
  console.log('.set() is deprecated. Access using array indexes instead.')
  return this.writeUInt8(v, offset)
}

Buffer.prototype.readUInt8 = function (offset, noAssert) {
  if (!noAssert) {
    assert(offset !== undefined && offset !== null, 'missing offset')
    assert(offset < this.length, 'Trying to read beyond buffer length')
  }

  if (offset >= this.length)
    return

  return this[offset]
}

function readUInt16 (buf, offset, littleEndian, noAssert) {
  if (!noAssert) {
    assert(typeof littleEndian === 'boolean', 'missing or invalid endian')
    assert(offset !== undefined && offset !== null, 'missing offset')
    assert(offset + 1 < buf.length, 'Trying to read beyond buffer length')
  }

  var len = buf.length
  if (offset >= len)
    return

  var val
  if (littleEndian) {
    val = buf[offset]
    if (offset + 1 < len)
      val |= buf[offset + 1] << 8
  } else {
    val = buf[offset] << 8
    if (offset + 1 < len)
      val |= buf[offset + 1]
  }
  return val
}

Buffer.prototype.readUInt16LE = function (offset, noAssert) {
  return readUInt16(this, offset, true, noAssert)
}

Buffer.prototype.readUInt16BE = function (offset, noAssert) {
  return readUInt16(this, offset, false, noAssert)
}

function readUInt32 (buf, offset, littleEndian, noAssert) {
  if (!noAssert) {
    assert(typeof littleEndian === 'boolean', 'missing or invalid endian')
    assert(offset !== undefined && offset !== null, 'missing offset')
    assert(offset + 3 < buf.length, 'Trying to read beyond buffer length')
  }

  var len = buf.length
  if (offset >= len)
    return

  var val
  if (littleEndian) {
    if (offset + 2 < len)
      val = buf[offset + 2] << 16
    if (offset + 1 < len)
      val |= buf[offset + 1] << 8
    val |= buf[offset]
    if (offset + 3 < len)
      val = val + (buf[offset + 3] << 24 >>> 0)
  } else {
    if (offset + 1 < len)
      val = buf[offset + 1] << 16
    if (offset + 2 < len)
      val |= buf[offset + 2] << 8
    if (offset + 3 < len)
      val |= buf[offset + 3]
    val = val + (buf[offset] << 24 >>> 0)
  }
  return val
}

Buffer.prototype.readUInt32LE = function (offset, noAssert) {
  return readUInt32(this, offset, true, noAssert)
}

Buffer.prototype.readUInt32BE = function (offset, noAssert) {
  return readUInt32(this, offset, false, noAssert)
}

Buffer.prototype.readInt8 = function (offset, noAssert) {
  if (!noAssert) {
    assert(offset !== undefined && offset !== null,
        'missing offset')
    assert(offset < this.length, 'Trying to read beyond buffer length')
  }

  if (offset >= this.length)
    return

  var neg = this[offset] & 0x80
  if (neg)
    return (0xff - this[offset] + 1) * -1
  else
    return this[offset]
}

function readInt16 (buf, offset, littleEndian, noAssert) {
  if (!noAssert) {
    assert(typeof littleEndian === 'boolean', 'missing or invalid endian')
    assert(offset !== undefined && offset !== null, 'missing offset')
    assert(offset + 1 < buf.length, 'Trying to read beyond buffer length')
  }

  var len = buf.length
  if (offset >= len)
    return

  var val = readUInt16(buf, offset, littleEndian, true)
  var neg = val & 0x8000
  if (neg)
    return (0xffff - val + 1) * -1
  else
    return val
}

Buffer.prototype.readInt16LE = function (offset, noAssert) {
  return readInt16(this, offset, true, noAssert)
}

Buffer.prototype.readInt16BE = function (offset, noAssert) {
  return readInt16(this, offset, false, noAssert)
}

function readInt32 (buf, offset, littleEndian, noAssert) {
  if (!noAssert) {
    assert(typeof littleEndian === 'boolean', 'missing or invalid endian')
    assert(offset !== undefined && offset !== null, 'missing offset')
    assert(offset + 3 < buf.length, 'Trying to read beyond buffer length')
  }

  var len = buf.length
  if (offset >= len)
    return

  var val = readUInt32(buf, offset, littleEndian, true)
  var neg = val & 0x80000000
  if (neg)
    return (0xffffffff - val + 1) * -1
  else
    return val
}

Buffer.prototype.readInt32LE = function (offset, noAssert) {
  return readInt32(this, offset, true, noAssert)
}

Buffer.prototype.readInt32BE = function (offset, noAssert) {
  return readInt32(this, offset, false, noAssert)
}

function readFloat (buf, offset, littleEndian, noAssert) {
  if (!noAssert) {
    assert(typeof littleEndian === 'boolean', 'missing or invalid endian')
    assert(offset + 3 < buf.length, 'Trying to read beyond buffer length')
  }

  return ieee754.read(buf, offset, littleEndian, 23, 4)
}

Buffer.prototype.readFloatLE = function (offset, noAssert) {
  return readFloat(this, offset, true, noAssert)
}

Buffer.prototype.readFloatBE = function (offset, noAssert) {
  return readFloat(this, offset, false, noAssert)
}

function readDouble (buf, offset, littleEndian, noAssert) {
  if (!noAssert) {
    assert(typeof littleEndian === 'boolean', 'missing or invalid endian')
    assert(offset + 7 < buf.length, 'Trying to read beyond buffer length')
  }

  return ieee754.read(buf, offset, littleEndian, 52, 8)
}

Buffer.prototype.readDoubleLE = function (offset, noAssert) {
  return readDouble(this, offset, true, noAssert)
}

Buffer.prototype.readDoubleBE = function (offset, noAssert) {
  return readDouble(this, offset, false, noAssert)
}

Buffer.prototype.writeUInt8 = function (value, offset, noAssert) {
  if (!noAssert) {
    assert(value !== undefined && value !== null, 'missing value')
    assert(offset !== undefined && offset !== null, 'missing offset')
    assert(offset < this.length, 'trying to write beyond buffer length')
    verifuint(value, 0xff)
  }

  if (offset >= this.length) return

  this[offset] = value
  return offset + 1
}

function writeUInt16 (buf, value, offset, littleEndian, noAssert) {
  if (!noAssert) {
    assert(value !== undefined && value !== null, 'missing value')
    assert(typeof littleEndian === 'boolean', 'missing or invalid endian')
    assert(offset !== undefined && offset !== null, 'missing offset')
    assert(offset + 1 < buf.length, 'trying to write beyond buffer length')
    verifuint(value, 0xffff)
  }

  var len = buf.length
  if (offset >= len)
    return

  for (var i = 0, j = Math.min(len - offset, 2); i < j; i++) {
    buf[offset + i] =
        (value & (0xff << (8 * (littleEndian ? i : 1 - i)))) >>>
            (littleEndian ? i : 1 - i) * 8
  }
  return offset + 2
}

Buffer.prototype.writeUInt16LE = function (value, offset, noAssert) {
  return writeUInt16(this, value, offset, true, noAssert)
}

Buffer.prototype.writeUInt16BE = function (value, offset, noAssert) {
  return writeUInt16(this, value, offset, false, noAssert)
}

function writeUInt32 (buf, value, offset, littleEndian, noAssert) {
  if (!noAssert) {
    assert(value !== undefined && value !== null, 'missing value')
    assert(typeof littleEndian === 'boolean', 'missing or invalid endian')
    assert(offset !== undefined && offset !== null, 'missing offset')
    assert(offset + 3 < buf.length, 'trying to write beyond buffer length')
    verifuint(value, 0xffffffff)
  }

  var len = buf.length
  if (offset >= len)
    return

  for (var i = 0, j = Math.min(len - offset, 4); i < j; i++) {
    buf[offset + i] =
        (value >>> (littleEndian ? i : 3 - i) * 8) & 0xff
  }
  return offset + 4
}

Buffer.prototype.writeUInt32LE = function (value, offset, noAssert) {
  return writeUInt32(this, value, offset, true, noAssert)
}

Buffer.prototype.writeUInt32BE = function (value, offset, noAssert) {
  return writeUInt32(this, value, offset, false, noAssert)
}

Buffer.prototype.writeInt8 = function (value, offset, noAssert) {
  if (!noAssert) {
    assert(value !== undefined && value !== null, 'missing value')
    assert(offset !== undefined && offset !== null, 'missing offset')
    assert(offset < this.length, 'Trying to write beyond buffer length')
    verifsint(value, 0x7f, -0x80)
  }

  if (offset >= this.length)
    return

  if (value >= 0)
    this.writeUInt8(value, offset, noAssert)
  else
    this.writeUInt8(0xff + value + 1, offset, noAssert)
  return offset + 1
}

function writeInt16 (buf, value, offset, littleEndian, noAssert) {
  if (!noAssert) {
    assert(value !== undefined && value !== null, 'missing value')
    assert(typeof littleEndian === 'boolean', 'missing or invalid endian')
    assert(offset !== undefined && offset !== null, 'missing offset')
    assert(offset + 1 < buf.length, 'Trying to write beyond buffer length')
    verifsint(value, 0x7fff, -0x8000)
  }

  var len = buf.length
  if (offset >= len)
    return

  if (value >= 0)
    writeUInt16(buf, value, offset, littleEndian, noAssert)
  else
    writeUInt16(buf, 0xffff + value + 1, offset, littleEndian, noAssert)
  return offset + 2
}

Buffer.prototype.writeInt16LE = function (value, offset, noAssert) {
  return writeInt16(this, value, offset, true, noAssert)
}

Buffer.prototype.writeInt16BE = function (value, offset, noAssert) {
  return writeInt16(this, value, offset, false, noAssert)
}

function writeInt32 (buf, value, offset, littleEndian, noAssert) {
  if (!noAssert) {
    assert(value !== undefined && value !== null, 'missing value')
    assert(typeof littleEndian === 'boolean', 'missing or invalid endian')
    assert(offset !== undefined && offset !== null, 'missing offset')
    assert(offset + 3 < buf.length, 'Trying to write beyond buffer length')
    verifsint(value, 0x7fffffff, -0x80000000)
  }

  var len = buf.length
  if (offset >= len)
    return

  if (value >= 0)
    writeUInt32(buf, value, offset, littleEndian, noAssert)
  else
    writeUInt32(buf, 0xffffffff + value + 1, offset, littleEndian, noAssert)
  return offset + 4
}

Buffer.prototype.writeInt32LE = function (value, offset, noAssert) {
  return writeInt32(this, value, offset, true, noAssert)
}

Buffer.prototype.writeInt32BE = function (value, offset, noAssert) {
  return writeInt32(this, value, offset, false, noAssert)
}

function writeFloat (buf, value, offset, littleEndian, noAssert) {
  if (!noAssert) {
    assert(value !== undefined && value !== null, 'missing value')
    assert(typeof littleEndian === 'boolean', 'missing or invalid endian')
    assert(offset !== undefined && offset !== null, 'missing offset')
    assert(offset + 3 < buf.length, 'Trying to write beyond buffer length')
    verifIEEE754(value, 3.4028234663852886e+38, -3.4028234663852886e+38)
  }

  var len = buf.length
  if (offset >= len)
    return

  ieee754.write(buf, value, offset, littleEndian, 23, 4)
  return offset + 4
}

Buffer.prototype.writeFloatLE = function (value, offset, noAssert) {
  return writeFloat(this, value, offset, true, noAssert)
}

Buffer.prototype.writeFloatBE = function (value, offset, noAssert) {
  return writeFloat(this, value, offset, false, noAssert)
}

function writeDouble (buf, value, offset, littleEndian, noAssert) {
  if (!noAssert) {
    assert(value !== undefined && value !== null, 'missing value')
    assert(typeof littleEndian === 'boolean', 'missing or invalid endian')
    assert(offset !== undefined && offset !== null, 'missing offset')
    assert(offset + 7 < buf.length,
        'Trying to write beyond buffer length')
    verifIEEE754(value, 1.7976931348623157E+308, -1.7976931348623157E+308)
  }

  var len = buf.length
  if (offset >= len)
    return

  ieee754.write(buf, value, offset, littleEndian, 52, 8)
  return offset + 8
}

Buffer.prototype.writeDoubleLE = function (value, offset, noAssert) {
  return writeDouble(this, value, offset, true, noAssert)
}

Buffer.prototype.writeDoubleBE = function (value, offset, noAssert) {
  return writeDouble(this, value, offset, false, noAssert)
}

// fill(value, start=0, end=buffer.length)
Buffer.prototype.fill = function (value, start, end) {
  if (!value) value = 0
  if (!start) start = 0
  if (!end) end = this.length

  assert(end >= start, 'end < start')

  // Fill 0 bytes; we're done
  if (end === start) return
  if (this.length === 0) return

  assert(start >= 0 && start < this.length, 'start out of bounds')
  assert(end >= 0 && end <= this.length, 'end out of bounds')

  var i
  if (typeof value === 'number') {
    for (i = start; i < end; i++) {
      this[i] = value
    }
  } else {
    var bytes = utf8ToBytes(value.toString())
    var len = bytes.length
    for (i = start; i < end; i++) {
      this[i] = bytes[i % len]
    }
  }

  return this
}

Buffer.prototype.inspect = function () {
  var out = []
  var len = this.length
  for (var i = 0; i < len; i++) {
    out[i] = toHex(this[i])
    if (i === exports.INSPECT_MAX_BYTES) {
      out[i + 1] = '...'
      break
    }
  }
  return '<Buffer ' + out.join(' ') + '>'
}

/**
 * Creates a new `ArrayBuffer` with the *copied* memory of the buffer instance.
 * Added in Node 0.12. Only available in browsers that support ArrayBuffer.
 */
Buffer.prototype.toArrayBuffer = function () {
  if (typeof Uint8Array !== 'undefined') {
    if (TYPED_ARRAY_SUPPORT) {
      return (new Buffer(this)).buffer
    } else {
      var buf = new Uint8Array(this.length)
      for (var i = 0, len = buf.length; i < len; i += 1) {
        buf[i] = this[i]
      }
      return buf.buffer
    }
  } else {
    throw new Error('Buffer.toArrayBuffer not supported in this browser')
  }
}

// HELPER FUNCTIONS
// ================

var BP = Buffer.prototype

/**
 * Augment a Uint8Array *instance* (not the Uint8Array class!) with Buffer methods
 */
Buffer._augment = function (arr) {
  arr._isBuffer = true

  // save reference to original Uint8Array get/set methods before overwriting
  arr._get = arr.get
  arr._set = arr.set

  // deprecated, will be removed in node 0.13+
  arr.get = BP.get
  arr.set = BP.set

  arr.write = BP.write
  arr.toString = BP.toString
  arr.toLocaleString = BP.toString
  arr.toJSON = BP.toJSON
  arr.equals = BP.equals
  arr.compare = BP.compare
  arr.copy = BP.copy
  arr.slice = BP.slice
  arr.readUInt8 = BP.readUInt8
  arr.readUInt16LE = BP.readUInt16LE
  arr.readUInt16BE = BP.readUInt16BE
  arr.readUInt32LE = BP.readUInt32LE
  arr.readUInt32BE = BP.readUInt32BE
  arr.readInt8 = BP.readInt8
  arr.readInt16LE = BP.readInt16LE
  arr.readInt16BE = BP.readInt16BE
  arr.readInt32LE = BP.readInt32LE
  arr.readInt32BE = BP.readInt32BE
  arr.readFloatLE = BP.readFloatLE
  arr.readFloatBE = BP.readFloatBE
  arr.readDoubleLE = BP.readDoubleLE
  arr.readDoubleBE = BP.readDoubleBE
  arr.writeUInt8 = BP.writeUInt8
  arr.writeUInt16LE = BP.writeUInt16LE
  arr.writeUInt16BE = BP.writeUInt16BE
  arr.writeUInt32LE = BP.writeUInt32LE
  arr.writeUInt32BE = BP.writeUInt32BE
  arr.writeInt8 = BP.writeInt8
  arr.writeInt16LE = BP.writeInt16LE
  arr.writeInt16BE = BP.writeInt16BE
  arr.writeInt32LE = BP.writeInt32LE
  arr.writeInt32BE = BP.writeInt32BE
  arr.writeFloatLE = BP.writeFloatLE
  arr.writeFloatBE = BP.writeFloatBE
  arr.writeDoubleLE = BP.writeDoubleLE
  arr.writeDoubleBE = BP.writeDoubleBE
  arr.fill = BP.fill
  arr.inspect = BP.inspect
  arr.toArrayBuffer = BP.toArrayBuffer

  return arr
}

var INVALID_BASE64_RE = /[^+\/0-9A-z]/g

function base64clean (str) {
  // Node strips out invalid characters like \n and \t from the string, base64-js does not
  str = stringtrim(str).replace(INVALID_BASE64_RE, '')
  // Node allows for non-padded base64 strings (missing trailing ===), base64-js does not
  while (str.length % 4 !== 0) {
    str = str + '='
  }
  return str
}

function stringtrim (str) {
  if (str.trim) return str.trim()
  return str.replace(/^\s+|\s+$/g, '')
}

function isArray (subject) {
  return (Array.isArray || function (subject) {
    return Object.prototype.toString.call(subject) === '[object Array]'
  })(subject)
}

function isArrayish (subject) {
  return isArray(subject) || Buffer.isBuffer(subject) ||
      subject && typeof subject === 'object' &&
      typeof subject.length === 'number'
}

function toHex (n) {
  if (n < 16) return '0' + n.toString(16)
  return n.toString(16)
}

function utf8ToBytes (str) {
  var byteArray = []
  for (var i = 0; i < str.length; i++) {
    var b = str.charCodeAt(i)
    if (b <= 0x7F) {
      byteArray.push(b)
    } else {
      var start = i
      if (b >= 0xD800 && b <= 0xDFFF) i++
      var h = encodeURIComponent(str.slice(start, i+1)).substr(1).split('%')
      for (var j = 0; j < h.length; j++) {
        byteArray.push(parseInt(h[j], 16))
      }
    }
  }
  return byteArray
}

function asciiToBytes (str) {
  var byteArray = []
  for (var i = 0; i < str.length; i++) {
    // Node's code seems to be doing this and not & 0x7F..
    byteArray.push(str.charCodeAt(i) & 0xFF)
  }
  return byteArray
}

function utf16leToBytes (str) {
  var c, hi, lo
  var byteArray = []
  for (var i = 0; i < str.length; i++) {
    c = str.charCodeAt(i)
    hi = c >> 8
    lo = c % 256
    byteArray.push(lo)
    byteArray.push(hi)
  }

  return byteArray
}

function base64ToBytes (str) {
  return base64.toByteArray(str)
}

function blitBuffer (src, dst, offset, length) {
  for (var i = 0; i < length; i++) {
    if ((i + offset >= dst.length) || (i >= src.length))
      break
    dst[i + offset] = src[i]
  }
  return i
}

function decodeUtf8Char (str) {
  try {
    return decodeURIComponent(str)
  } catch (err) {
    return String.fromCharCode(0xFFFD) // UTF 8 invalid char
  }
}

/*
 * We have to make sure that the value is a valid integer. This means that it
 * is non-negative. It has no fractional component and that it does not
 * exceed the maximum allowed value.
 */
function verifuint (value, max) {
  assert(typeof value === 'number', 'cannot write a non-number as a number')
  assert(value >= 0, 'specified a negative value for writing an unsigned value')
  assert(value <= max, 'value is larger than maximum value for type')
  assert(Math.floor(value) === value, 'value has a fractional component')
}

function verifsint (value, max, min) {
  assert(typeof value === 'number', 'cannot write a non-number as a number')
  assert(value <= max, 'value larger than maximum allowed value')
  assert(value >= min, 'value smaller than minimum allowed value')
  assert(Math.floor(value) === value, 'value has a fractional component')
}

function verifIEEE754 (value, max, min) {
  assert(typeof value === 'number', 'cannot write a non-number as a number')
  assert(value <= max, 'value larger than maximum allowed value')
  assert(value >= min, 'value smaller than minimum allowed value')
}

function assert (test, message) {
  if (!test) throw new Error(message || 'Failed assertion')
}

},{"base64-js":55,"ieee754":56}],55:[function(require,module,exports){
var lookup = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

;(function (exports) {
	'use strict';

  var Arr = (typeof Uint8Array !== 'undefined')
    ? Uint8Array
    : Array

	var PLUS   = '+'.charCodeAt(0)
	var SLASH  = '/'.charCodeAt(0)
	var NUMBER = '0'.charCodeAt(0)
	var LOWER  = 'a'.charCodeAt(0)
	var UPPER  = 'A'.charCodeAt(0)

	function decode (elt) {
		var code = elt.charCodeAt(0)
		if (code === PLUS)
			return 62 // '+'
		if (code === SLASH)
			return 63 // '/'
		if (code < NUMBER)
			return -1 //no match
		if (code < NUMBER + 10)
			return code - NUMBER + 26 + 26
		if (code < UPPER + 26)
			return code - UPPER
		if (code < LOWER + 26)
			return code - LOWER + 26
	}

	function b64ToByteArray (b64) {
		var i, j, l, tmp, placeHolders, arr

		if (b64.length % 4 > 0) {
			throw new Error('Invalid string. Length must be a multiple of 4')
		}

		// the number of equal signs (place holders)
		// if there are two placeholders, than the two characters before it
		// represent one byte
		// if there is only one, then the three characters before it represent 2 bytes
		// this is just a cheap hack to not do indexOf twice
		var len = b64.length
		placeHolders = '=' === b64.charAt(len - 2) ? 2 : '=' === b64.charAt(len - 1) ? 1 : 0

		// base64 is 4/3 + up to two characters of the original data
		arr = new Arr(b64.length * 3 / 4 - placeHolders)

		// if there are placeholders, only get up to the last complete 4 chars
		l = placeHolders > 0 ? b64.length - 4 : b64.length

		var L = 0

		function push (v) {
			arr[L++] = v
		}

		for (i = 0, j = 0; i < l; i += 4, j += 3) {
			tmp = (decode(b64.charAt(i)) << 18) | (decode(b64.charAt(i + 1)) << 12) | (decode(b64.charAt(i + 2)) << 6) | decode(b64.charAt(i + 3))
			push((tmp & 0xFF0000) >> 16)
			push((tmp & 0xFF00) >> 8)
			push(tmp & 0xFF)
		}

		if (placeHolders === 2) {
			tmp = (decode(b64.charAt(i)) << 2) | (decode(b64.charAt(i + 1)) >> 4)
			push(tmp & 0xFF)
		} else if (placeHolders === 1) {
			tmp = (decode(b64.charAt(i)) << 10) | (decode(b64.charAt(i + 1)) << 4) | (decode(b64.charAt(i + 2)) >> 2)
			push((tmp >> 8) & 0xFF)
			push(tmp & 0xFF)
		}

		return arr
	}

	function uint8ToBase64 (uint8) {
		var i,
			extraBytes = uint8.length % 3, // if we have 1 byte left, pad 2 bytes
			output = "",
			temp, length

		function encode (num) {
			return lookup.charAt(num)
		}

		function tripletToBase64 (num) {
			return encode(num >> 18 & 0x3F) + encode(num >> 12 & 0x3F) + encode(num >> 6 & 0x3F) + encode(num & 0x3F)
		}

		// go through the array every three bytes, we'll deal with trailing stuff later
		for (i = 0, length = uint8.length - extraBytes; i < length; i += 3) {
			temp = (uint8[i] << 16) + (uint8[i + 1] << 8) + (uint8[i + 2])
			output += tripletToBase64(temp)
		}

		// pad the end with zeros, but make sure to not forget the extra bytes
		switch (extraBytes) {
			case 1:
				temp = uint8[uint8.length - 1]
				output += encode(temp >> 2)
				output += encode((temp << 4) & 0x3F)
				output += '=='
				break
			case 2:
				temp = (uint8[uint8.length - 2] << 8) + (uint8[uint8.length - 1])
				output += encode(temp >> 10)
				output += encode((temp >> 4) & 0x3F)
				output += encode((temp << 2) & 0x3F)
				output += '='
				break
		}

		return output
	}

	exports.toByteArray = b64ToByteArray
	exports.fromByteArray = uint8ToBase64
}(typeof exports === 'undefined' ? (this.base64js = {}) : exports))

},{}],56:[function(require,module,exports){
exports.read = function(buffer, offset, isLE, mLen, nBytes) {
  var e, m,
      eLen = nBytes * 8 - mLen - 1,
      eMax = (1 << eLen) - 1,
      eBias = eMax >> 1,
      nBits = -7,
      i = isLE ? (nBytes - 1) : 0,
      d = isLE ? -1 : 1,
      s = buffer[offset + i];

  i += d;

  e = s & ((1 << (-nBits)) - 1);
  s >>= (-nBits);
  nBits += eLen;
  for (; nBits > 0; e = e * 256 + buffer[offset + i], i += d, nBits -= 8);

  m = e & ((1 << (-nBits)) - 1);
  e >>= (-nBits);
  nBits += mLen;
  for (; nBits > 0; m = m * 256 + buffer[offset + i], i += d, nBits -= 8);

  if (e === 0) {
    e = 1 - eBias;
  } else if (e === eMax) {
    return m ? NaN : ((s ? -1 : 1) * Infinity);
  } else {
    m = m + Math.pow(2, mLen);
    e = e - eBias;
  }
  return (s ? -1 : 1) * m * Math.pow(2, e - mLen);
};

exports.write = function(buffer, value, offset, isLE, mLen, nBytes) {
  var e, m, c,
      eLen = nBytes * 8 - mLen - 1,
      eMax = (1 << eLen) - 1,
      eBias = eMax >> 1,
      rt = (mLen === 23 ? Math.pow(2, -24) - Math.pow(2, -77) : 0),
      i = isLE ? 0 : (nBytes - 1),
      d = isLE ? 1 : -1,
      s = value < 0 || (value === 0 && 1 / value < 0) ? 1 : 0;

  value = Math.abs(value);

  if (isNaN(value) || value === Infinity) {
    m = isNaN(value) ? 1 : 0;
    e = eMax;
  } else {
    e = Math.floor(Math.log(value) / Math.LN2);
    if (value * (c = Math.pow(2, -e)) < 1) {
      e--;
      c *= 2;
    }
    if (e + eBias >= 1) {
      value += rt / c;
    } else {
      value += rt * Math.pow(2, 1 - eBias);
    }
    if (value * c >= 2) {
      e++;
      c /= 2;
    }

    if (e + eBias >= eMax) {
      m = 0;
      e = eMax;
    } else if (e + eBias >= 1) {
      m = (value * c - 1) * Math.pow(2, mLen);
      e = e + eBias;
    } else {
      m = value * Math.pow(2, eBias - 1) * Math.pow(2, mLen);
      e = 0;
    }
  }

  for (; mLen >= 8; buffer[offset + i] = m & 0xff, i += d, m /= 256, mLen -= 8);

  e = (e << mLen) | m;
  eLen += mLen;
  for (; eLen > 0; buffer[offset + i] = e & 0xff, i += d, e /= 256, eLen -= 8);

  buffer[offset + i - d] |= s * 128;
};

},{}],57:[function(require,module,exports){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

function EventEmitter() {
  this._events = this._events || {};
  this._maxListeners = this._maxListeners || undefined;
}
module.exports = EventEmitter;

// Backwards-compat with node 0.10.x
EventEmitter.EventEmitter = EventEmitter;

EventEmitter.prototype._events = undefined;
EventEmitter.prototype._maxListeners = undefined;

// By default EventEmitters will print a warning if more than 10 listeners are
// added to it. This is a useful default which helps finding memory leaks.
EventEmitter.defaultMaxListeners = 10;

// Obviously not all Emitters should be limited to 10. This function allows
// that to be increased. Set to zero for unlimited.
EventEmitter.prototype.setMaxListeners = function(n) {
  if (!isNumber(n) || n < 0 || isNaN(n))
    throw TypeError('n must be a positive number');
  this._maxListeners = n;
  return this;
};

EventEmitter.prototype.emit = function(type) {
  var er, handler, len, args, i, listeners;

  if (!this._events)
    this._events = {};

  // If there is no 'error' event listener then throw.
  if (type === 'error') {
    if (!this._events.error ||
        (isObject(this._events.error) && !this._events.error.length)) {
      er = arguments[1];
      if (er instanceof Error) {
        throw er; // Unhandled 'error' event
      } else {
        throw TypeError('Uncaught, unspecified "error" event.');
      }
      return false;
    }
  }

  handler = this._events[type];

  if (isUndefined(handler))
    return false;

  if (isFunction(handler)) {
    switch (arguments.length) {
      // fast cases
      case 1:
        handler.call(this);
        break;
      case 2:
        handler.call(this, arguments[1]);
        break;
      case 3:
        handler.call(this, arguments[1], arguments[2]);
        break;
      // slower
      default:
        len = arguments.length;
        args = new Array(len - 1);
        for (i = 1; i < len; i++)
          args[i - 1] = arguments[i];
        handler.apply(this, args);
    }
  } else if (isObject(handler)) {
    len = arguments.length;
    args = new Array(len - 1);
    for (i = 1; i < len; i++)
      args[i - 1] = arguments[i];

    listeners = handler.slice();
    len = listeners.length;
    for (i = 0; i < len; i++)
      listeners[i].apply(this, args);
  }

  return true;
};

EventEmitter.prototype.addListener = function(type, listener) {
  var m;

  if (!isFunction(listener))
    throw TypeError('listener must be a function');

  if (!this._events)
    this._events = {};

  // To avoid recursion in the case that type === "newListener"! Before
  // adding it to the listeners, first emit "newListener".
  if (this._events.newListener)
    this.emit('newListener', type,
              isFunction(listener.listener) ?
              listener.listener : listener);

  if (!this._events[type])
    // Optimize the case of one listener. Don't need the extra array object.
    this._events[type] = listener;
  else if (isObject(this._events[type]))
    // If we've already got an array, just append.
    this._events[type].push(listener);
  else
    // Adding the second element, need to change to array.
    this._events[type] = [this._events[type], listener];

  // Check for listener leak
  if (isObject(this._events[type]) && !this._events[type].warned) {
    var m;
    if (!isUndefined(this._maxListeners)) {
      m = this._maxListeners;
    } else {
      m = EventEmitter.defaultMaxListeners;
    }

    if (m && m > 0 && this._events[type].length > m) {
      this._events[type].warned = true;
      console.error('(node) warning: possible EventEmitter memory ' +
                    'leak detected. %d listeners added. ' +
                    'Use emitter.setMaxListeners() to increase limit.',
                    this._events[type].length);
      if (typeof console.trace === 'function') {
        // not supported in IE 10
        console.trace();
      }
    }
  }

  return this;
};

EventEmitter.prototype.on = EventEmitter.prototype.addListener;

EventEmitter.prototype.once = function(type, listener) {
  if (!isFunction(listener))
    throw TypeError('listener must be a function');

  var fired = false;

  function g() {
    this.removeListener(type, g);

    if (!fired) {
      fired = true;
      listener.apply(this, arguments);
    }
  }

  g.listener = listener;
  this.on(type, g);

  return this;
};

// emits a 'removeListener' event iff the listener was removed
EventEmitter.prototype.removeListener = function(type, listener) {
  var list, position, length, i;

  if (!isFunction(listener))
    throw TypeError('listener must be a function');

  if (!this._events || !this._events[type])
    return this;

  list = this._events[type];
  length = list.length;
  position = -1;

  if (list === listener ||
      (isFunction(list.listener) && list.listener === listener)) {
    delete this._events[type];
    if (this._events.removeListener)
      this.emit('removeListener', type, listener);

  } else if (isObject(list)) {
    for (i = length; i-- > 0;) {
      if (list[i] === listener ||
          (list[i].listener && list[i].listener === listener)) {
        position = i;
        break;
      }
    }

    if (position < 0)
      return this;

    if (list.length === 1) {
      list.length = 0;
      delete this._events[type];
    } else {
      list.splice(position, 1);
    }

    if (this._events.removeListener)
      this.emit('removeListener', type, listener);
  }

  return this;
};

EventEmitter.prototype.removeAllListeners = function(type) {
  var key, listeners;

  if (!this._events)
    return this;

  // not listening for removeListener, no need to emit
  if (!this._events.removeListener) {
    if (arguments.length === 0)
      this._events = {};
    else if (this._events[type])
      delete this._events[type];
    return this;
  }

  // emit removeListener for all listeners on all events
  if (arguments.length === 0) {
    for (key in this._events) {
      if (key === 'removeListener') continue;
      this.removeAllListeners(key);
    }
    this.removeAllListeners('removeListener');
    this._events = {};
    return this;
  }

  listeners = this._events[type];

  if (isFunction(listeners)) {
    this.removeListener(type, listeners);
  } else {
    // LIFO order
    while (listeners.length)
      this.removeListener(type, listeners[listeners.length - 1]);
  }
  delete this._events[type];

  return this;
};

EventEmitter.prototype.listeners = function(type) {
  var ret;
  if (!this._events || !this._events[type])
    ret = [];
  else if (isFunction(this._events[type]))
    ret = [this._events[type]];
  else
    ret = this._events[type].slice();
  return ret;
};

EventEmitter.listenerCount = function(emitter, type) {
  var ret;
  if (!emitter._events || !emitter._events[type])
    ret = 0;
  else if (isFunction(emitter._events[type]))
    ret = 1;
  else
    ret = emitter._events[type].length;
  return ret;
};

function isFunction(arg) {
  return typeof arg === 'function';
}

function isNumber(arg) {
  return typeof arg === 'number';
}

function isObject(arg) {
  return typeof arg === 'object' && arg !== null;
}

function isUndefined(arg) {
  return arg === void 0;
}

},{}],58:[function(require,module,exports){
if (typeof Object.create === 'function') {
  // implementation from standard node.js 'util' module
  module.exports = function inherits(ctor, superCtor) {
    ctor.super_ = superCtor
    ctor.prototype = Object.create(superCtor.prototype, {
      constructor: {
        value: ctor,
        enumerable: false,
        writable: true,
        configurable: true
      }
    });
  };
} else {
  // old school shim for old browsers
  module.exports = function inherits(ctor, superCtor) {
    ctor.super_ = superCtor
    var TempCtor = function () {}
    TempCtor.prototype = superCtor.prototype
    ctor.prototype = new TempCtor()
    ctor.prototype.constructor = ctor
  }
}

},{}],59:[function(require,module,exports){
// shim for using process in browser

var process = module.exports = {};

process.nextTick = (function () {
    var canSetImmediate = typeof window !== 'undefined'
    && window.setImmediate;
    var canPost = typeof window !== 'undefined'
    && window.postMessage && window.addEventListener
    ;

    if (canSetImmediate) {
        return function (f) { return window.setImmediate(f) };
    }

    if (canPost) {
        var queue = [];
        window.addEventListener('message', function (ev) {
            var source = ev.source;
            if ((source === window || source === null) && ev.data === 'process-tick') {
                ev.stopPropagation();
                if (queue.length > 0) {
                    var fn = queue.shift();
                    fn();
                }
            }
        }, true);

        return function nextTick(fn) {
            queue.push(fn);
            window.postMessage('process-tick', '*');
        };
    }

    return function nextTick(fn) {
        setTimeout(fn, 0);
    };
})();

process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];

function noop() {}

process.on = noop;
process.addListener = noop;
process.once = noop;
process.off = noop;
process.removeListener = noop;
process.removeAllListeners = noop;
process.emit = noop;

process.binding = function (name) {
    throw new Error('process.binding is not supported');
}

// TODO(shtylman)
process.cwd = function () { return '/' };
process.chdir = function (dir) {
    throw new Error('process.chdir is not supported');
};

},{}],60:[function(require,module,exports){
module.exports = function isBuffer(arg) {
  return arg && typeof arg === 'object'
    && typeof arg.copy === 'function'
    && typeof arg.fill === 'function'
    && typeof arg.readUInt8 === 'function';
}
},{}],61:[function(require,module,exports){
(function (process,global){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

var formatRegExp = /%[sdj%]/g;
exports.format = function(f) {
  if (!isString(f)) {
    var objects = [];
    for (var i = 0; i < arguments.length; i++) {
      objects.push(inspect(arguments[i]));
    }
    return objects.join(' ');
  }

  var i = 1;
  var args = arguments;
  var len = args.length;
  var str = String(f).replace(formatRegExp, function(x) {
    if (x === '%%') return '%';
    if (i >= len) return x;
    switch (x) {
      case '%s': return String(args[i++]);
      case '%d': return Number(args[i++]);
      case '%j':
        try {
          return JSON.stringify(args[i++]);
        } catch (_) {
          return '[Circular]';
        }
      default:
        return x;
    }
  });
  for (var x = args[i]; i < len; x = args[++i]) {
    if (isNull(x) || !isObject(x)) {
      str += ' ' + x;
    } else {
      str += ' ' + inspect(x);
    }
  }
  return str;
};


// Mark that a method should not be used.
// Returns a modified function which warns once by default.
// If --no-deprecation is set, then it is a no-op.
exports.deprecate = function(fn, msg) {
  // Allow for deprecating things in the process of starting up.
  if (isUndefined(global.process)) {
    return function() {
      return exports.deprecate(fn, msg).apply(this, arguments);
    };
  }

  if (process.noDeprecation === true) {
    return fn;
  }

  var warned = false;
  function deprecated() {
    if (!warned) {
      if (process.throwDeprecation) {
        throw new Error(msg);
      } else if (process.traceDeprecation) {
        console.trace(msg);
      } else {
        console.error(msg);
      }
      warned = true;
    }
    return fn.apply(this, arguments);
  }

  return deprecated;
};


var debugs = {};
var debugEnviron;
exports.debuglog = function(set) {
  if (isUndefined(debugEnviron))
    debugEnviron = process.env.NODE_DEBUG || '';
  set = set.toUpperCase();
  if (!debugs[set]) {
    if (new RegExp('\\b' + set + '\\b', 'i').test(debugEnviron)) {
      var pid = process.pid;
      debugs[set] = function() {
        var msg = exports.format.apply(exports, arguments);
        console.error('%s %d: %s', set, pid, msg);
      };
    } else {
      debugs[set] = function() {};
    }
  }
  return debugs[set];
};


/**
 * Echos the value of a value. Trys to print the value out
 * in the best way possible given the different types.
 *
 * @param {Object} obj The object to print out.
 * @param {Object} opts Optional options object that alters the output.
 */
/* legacy: obj, showHidden, depth, colors*/
function inspect(obj, opts) {
  // default options
  var ctx = {
    seen: [],
    stylize: stylizeNoColor
  };
  // legacy...
  if (arguments.length >= 3) ctx.depth = arguments[2];
  if (arguments.length >= 4) ctx.colors = arguments[3];
  if (isBoolean(opts)) {
    // legacy...
    ctx.showHidden = opts;
  } else if (opts) {
    // got an "options" object
    exports._extend(ctx, opts);
  }
  // set default options
  if (isUndefined(ctx.showHidden)) ctx.showHidden = false;
  if (isUndefined(ctx.depth)) ctx.depth = 2;
  if (isUndefined(ctx.colors)) ctx.colors = false;
  if (isUndefined(ctx.customInspect)) ctx.customInspect = true;
  if (ctx.colors) ctx.stylize = stylizeWithColor;
  return formatValue(ctx, obj, ctx.depth);
}
exports.inspect = inspect;


// http://en.wikipedia.org/wiki/ANSI_escape_code#graphics
inspect.colors = {
  'bold' : [1, 22],
  'italic' : [3, 23],
  'underline' : [4, 24],
  'inverse' : [7, 27],
  'white' : [37, 39],
  'grey' : [90, 39],
  'black' : [30, 39],
  'blue' : [34, 39],
  'cyan' : [36, 39],
  'green' : [32, 39],
  'magenta' : [35, 39],
  'red' : [31, 39],
  'yellow' : [33, 39]
};

// Don't use 'blue' not visible on cmd.exe
inspect.styles = {
  'special': 'cyan',
  'number': 'yellow',
  'boolean': 'yellow',
  'undefined': 'grey',
  'null': 'bold',
  'string': 'green',
  'date': 'magenta',
  // "name": intentionally not styling
  'regexp': 'red'
};


function stylizeWithColor(str, styleType) {
  var style = inspect.styles[styleType];

  if (style) {
    return '\u001b[' + inspect.colors[style][0] + 'm' + str +
           '\u001b[' + inspect.colors[style][1] + 'm';
  } else {
    return str;
  }
}


function stylizeNoColor(str, styleType) {
  return str;
}


function arrayToHash(array) {
  var hash = {};

  array.forEach(function(val, idx) {
    hash[val] = true;
  });

  return hash;
}


function formatValue(ctx, value, recurseTimes) {
  // Provide a hook for user-specified inspect functions.
  // Check that value is an object with an inspect function on it
  if (ctx.customInspect &&
      value &&
      isFunction(value.inspect) &&
      // Filter out the util module, it's inspect function is special
      value.inspect !== exports.inspect &&
      // Also filter out any prototype objects using the circular check.
      !(value.constructor && value.constructor.prototype === value)) {
    var ret = value.inspect(recurseTimes, ctx);
    if (!isString(ret)) {
      ret = formatValue(ctx, ret, recurseTimes);
    }
    return ret;
  }

  // Primitive types cannot have properties
  var primitive = formatPrimitive(ctx, value);
  if (primitive) {
    return primitive;
  }

  // Look up the keys of the object.
  var keys = Object.keys(value);
  var visibleKeys = arrayToHash(keys);

  if (ctx.showHidden) {
    keys = Object.getOwnPropertyNames(value);
  }

  // IE doesn't make error fields non-enumerable
  // http://msdn.microsoft.com/en-us/library/ie/dww52sbt(v=vs.94).aspx
  if (isError(value)
      && (keys.indexOf('message') >= 0 || keys.indexOf('description') >= 0)) {
    return formatError(value);
  }

  // Some type of object without properties can be shortcutted.
  if (keys.length === 0) {
    if (isFunction(value)) {
      var name = value.name ? ': ' + value.name : '';
      return ctx.stylize('[Function' + name + ']', 'special');
    }
    if (isRegExp(value)) {
      return ctx.stylize(RegExp.prototype.toString.call(value), 'regexp');
    }
    if (isDate(value)) {
      return ctx.stylize(Date.prototype.toString.call(value), 'date');
    }
    if (isError(value)) {
      return formatError(value);
    }
  }

  var base = '', array = false, braces = ['{', '}'];

  // Make Array say that they are Array
  if (isArray(value)) {
    array = true;
    braces = ['[', ']'];
  }

  // Make functions say that they are functions
  if (isFunction(value)) {
    var n = value.name ? ': ' + value.name : '';
    base = ' [Function' + n + ']';
  }

  // Make RegExps say that they are RegExps
  if (isRegExp(value)) {
    base = ' ' + RegExp.prototype.toString.call(value);
  }

  // Make dates with properties first say the date
  if (isDate(value)) {
    base = ' ' + Date.prototype.toUTCString.call(value);
  }

  // Make error with message first say the error
  if (isError(value)) {
    base = ' ' + formatError(value);
  }

  if (keys.length === 0 && (!array || value.length == 0)) {
    return braces[0] + base + braces[1];
  }

  if (recurseTimes < 0) {
    if (isRegExp(value)) {
      return ctx.stylize(RegExp.prototype.toString.call(value), 'regexp');
    } else {
      return ctx.stylize('[Object]', 'special');
    }
  }

  ctx.seen.push(value);

  var output;
  if (array) {
    output = formatArray(ctx, value, recurseTimes, visibleKeys, keys);
  } else {
    output = keys.map(function(key) {
      return formatProperty(ctx, value, recurseTimes, visibleKeys, key, array);
    });
  }

  ctx.seen.pop();

  return reduceToSingleString(output, base, braces);
}


function formatPrimitive(ctx, value) {
  if (isUndefined(value))
    return ctx.stylize('undefined', 'undefined');
  if (isString(value)) {
    var simple = '\'' + JSON.stringify(value).replace(/^"|"$/g, '')
                                             .replace(/'/g, "\\'")
                                             .replace(/\\"/g, '"') + '\'';
    return ctx.stylize(simple, 'string');
  }
  if (isNumber(value))
    return ctx.stylize('' + value, 'number');
  if (isBoolean(value))
    return ctx.stylize('' + value, 'boolean');
  // For some reason typeof null is "object", so special case here.
  if (isNull(value))
    return ctx.stylize('null', 'null');
}


function formatError(value) {
  return '[' + Error.prototype.toString.call(value) + ']';
}


function formatArray(ctx, value, recurseTimes, visibleKeys, keys) {
  var output = [];
  for (var i = 0, l = value.length; i < l; ++i) {
    if (hasOwnProperty(value, String(i))) {
      output.push(formatProperty(ctx, value, recurseTimes, visibleKeys,
          String(i), true));
    } else {
      output.push('');
    }
  }
  keys.forEach(function(key) {
    if (!key.match(/^\d+$/)) {
      output.push(formatProperty(ctx, value, recurseTimes, visibleKeys,
          key, true));
    }
  });
  return output;
}


function formatProperty(ctx, value, recurseTimes, visibleKeys, key, array) {
  var name, str, desc;
  desc = Object.getOwnPropertyDescriptor(value, key) || { value: value[key] };
  if (desc.get) {
    if (desc.set) {
      str = ctx.stylize('[Getter/Setter]', 'special');
    } else {
      str = ctx.stylize('[Getter]', 'special');
    }
  } else {
    if (desc.set) {
      str = ctx.stylize('[Setter]', 'special');
    }
  }
  if (!hasOwnProperty(visibleKeys, key)) {
    name = '[' + key + ']';
  }
  if (!str) {
    if (ctx.seen.indexOf(desc.value) < 0) {
      if (isNull(recurseTimes)) {
        str = formatValue(ctx, desc.value, null);
      } else {
        str = formatValue(ctx, desc.value, recurseTimes - 1);
      }
      if (str.indexOf('\n') > -1) {
        if (array) {
          str = str.split('\n').map(function(line) {
            return '  ' + line;
          }).join('\n').substr(2);
        } else {
          str = '\n' + str.split('\n').map(function(line) {
            return '   ' + line;
          }).join('\n');
        }
      }
    } else {
      str = ctx.stylize('[Circular]', 'special');
    }
  }
  if (isUndefined(name)) {
    if (array && key.match(/^\d+$/)) {
      return str;
    }
    name = JSON.stringify('' + key);
    if (name.match(/^"([a-zA-Z_][a-zA-Z_0-9]*)"$/)) {
      name = name.substr(1, name.length - 2);
      name = ctx.stylize(name, 'name');
    } else {
      name = name.replace(/'/g, "\\'")
                 .replace(/\\"/g, '"')
                 .replace(/(^"|"$)/g, "'");
      name = ctx.stylize(name, 'string');
    }
  }

  return name + ': ' + str;
}


function reduceToSingleString(output, base, braces) {
  var numLinesEst = 0;
  var length = output.reduce(function(prev, cur) {
    numLinesEst++;
    if (cur.indexOf('\n') >= 0) numLinesEst++;
    return prev + cur.replace(/\u001b\[\d\d?m/g, '').length + 1;
  }, 0);

  if (length > 60) {
    return braces[0] +
           (base === '' ? '' : base + '\n ') +
           ' ' +
           output.join(',\n  ') +
           ' ' +
           braces[1];
  }

  return braces[0] + base + ' ' + output.join(', ') + ' ' + braces[1];
}


// NOTE: These type checking functions intentionally don't use `instanceof`
// because it is fragile and can be easily faked with `Object.create()`.
function isArray(ar) {
  return Array.isArray(ar);
}
exports.isArray = isArray;

function isBoolean(arg) {
  return typeof arg === 'boolean';
}
exports.isBoolean = isBoolean;

function isNull(arg) {
  return arg === null;
}
exports.isNull = isNull;

function isNullOrUndefined(arg) {
  return arg == null;
}
exports.isNullOrUndefined = isNullOrUndefined;

function isNumber(arg) {
  return typeof arg === 'number';
}
exports.isNumber = isNumber;

function isString(arg) {
  return typeof arg === 'string';
}
exports.isString = isString;

function isSymbol(arg) {
  return typeof arg === 'symbol';
}
exports.isSymbol = isSymbol;

function isUndefined(arg) {
  return arg === void 0;
}
exports.isUndefined = isUndefined;

function isRegExp(re) {
  return isObject(re) && objectToString(re) === '[object RegExp]';
}
exports.isRegExp = isRegExp;

function isObject(arg) {
  return typeof arg === 'object' && arg !== null;
}
exports.isObject = isObject;

function isDate(d) {
  return isObject(d) && objectToString(d) === '[object Date]';
}
exports.isDate = isDate;

function isError(e) {
  return isObject(e) &&
      (objectToString(e) === '[object Error]' || e instanceof Error);
}
exports.isError = isError;

function isFunction(arg) {
  return typeof arg === 'function';
}
exports.isFunction = isFunction;

function isPrimitive(arg) {
  return arg === null ||
         typeof arg === 'boolean' ||
         typeof arg === 'number' ||
         typeof arg === 'string' ||
         typeof arg === 'symbol' ||  // ES6 symbol
         typeof arg === 'undefined';
}
exports.isPrimitive = isPrimitive;

exports.isBuffer = require('./support/isBuffer');

function objectToString(o) {
  return Object.prototype.toString.call(o);
}


function pad(n) {
  return n < 10 ? '0' + n.toString(10) : n.toString(10);
}


var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep',
              'Oct', 'Nov', 'Dec'];

// 26 Feb 16:19:34
function timestamp() {
  var d = new Date();
  var time = [pad(d.getHours()),
              pad(d.getMinutes()),
              pad(d.getSeconds())].join(':');
  return [d.getDate(), months[d.getMonth()], time].join(' ');
}


// log is just a thin wrapper to console.log that prepends a timestamp
exports.log = function() {
  console.log('%s - %s', timestamp(), exports.format.apply(exports, arguments));
};


/**
 * Inherit the prototype methods from one constructor into another.
 *
 * The Function.prototype.inherits from lang.js rewritten as a standalone
 * function (not on Function.prototype). NOTE: If this file is to be loaded
 * during bootstrapping this function needs to be rewritten using some native
 * functions as prototype setup using normal JavaScript does not work as
 * expected during bootstrapping (see mirror.js in r114903).
 *
 * @param {function} ctor Constructor function which needs to inherit the
 *     prototype.
 * @param {function} superCtor Constructor function to inherit prototype from.
 */
exports.inherits = require('inherits');

exports._extend = function(origin, add) {
  // Don't do anything if add isn't an object
  if (!add || !isObject(add)) return origin;

  var keys = Object.keys(add);
  var i = keys.length;
  while (i--) {
    origin[keys[i]] = add[keys[i]];
  }
  return origin;
};

function hasOwnProperty(obj, prop) {
  return Object.prototype.hasOwnProperty.call(obj, prop);
}

}).call(this,require("JkpR2F"),typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"./support/isBuffer":60,"JkpR2F":59,"inherits":58}],62:[function(require,module,exports){
(function (process,global,Buffer){
var inherits          = require('inherits')
  , AbstractLevelDOWN = require('abstract-leveldown').AbstractLevelDOWN
  , AbstractIterator  = require('abstract-leveldown').AbstractIterator
  , ltgt              = require('ltgt')
  , noop              = function () {}
  , setImmediate      = global.setImmediate || process.nextTick

function toKey (key) {
  return typeof key == 'string' ? '$' + key : JSON.stringify(key)
}

function sortedIndexOf (arr, item) {
  var low = 0, high = arr.length, mid
  while (low < high) {
    mid = (low + high) >>> 1
    arr[mid] < item ? low = mid + 1 : high = mid
  }
  return low
}

function MemIterator (db, options) {
  AbstractIterator.call(this, db)
  this._limit   = options.limit
  this._reverse   = options.reverse
  this._keys    = []
  this._options = options

  this._pos = 0

  this._keys = this.db._keys.filter(ltgt.filter(options))

  if (this._reverse)
    this._keys.reverse()

  if (options.limit > 0)
    this._keys = this._keys.slice(0, options.limit)

}

inherits(MemIterator, AbstractIterator)

MemIterator.prototype._next = function (callback) {
  var self  = this
    , key
    , value

  if (self._pos >= self._keys.length)
    return setImmediate(callback)

  key = self._keys[self._pos]

  value = self.db._store[toKey(key)]

  this._pos++

  setImmediate(function () { callback(null, key, value) })
}

function MemDOWN (location) {
  if (!(this instanceof MemDOWN))
    return new MemDOWN(location)

  AbstractLevelDOWN.call(this, typeof location == 'string' ? location : '')
  this._store = {}
  this._keys  = []
  this._len = 0;
}

inherits(MemDOWN, AbstractLevelDOWN)

MemDOWN.prototype._open = function (options, callback) {
  var self = this
  setImmediate(function () { callback(null, self) })
}

MemDOWN.prototype._put = function (key, value, options, callback) {
  var ix = sortedIndexOf(this._keys, key)
  if (ix >= this._len || this._keys[ix] != key) {
    this._keys.splice(ix, 0, key)
    this._len++;
  }
  key = toKey(key) // safety, to avoid key='__proto__'-type skullduggery 
  this._store[key] = value
  setImmediate(callback)
}

MemDOWN.prototype._get = function (key, options, callback) {
  var value = this._store[toKey(key)]
  if (value === undefined) {
    // 'NotFound' error, consistent with LevelDOWN API
    return setImmediate(function () { callback(new Error('NotFound')) })
  }
  if (options.asBuffer !== false && !Buffer.isBuffer(value))
    value = new Buffer(String(value))
  setImmediate(function () {
    callback(null, value)
  })
}

MemDOWN.prototype._del = function (key, options, callback) {
  var ix = sortedIndexOf(this._keys, key)
  if (this._keys[ix] == key) {
    this._keys.splice(ix, 1)
    this._len--;
  }
  delete this._store[toKey(key)]
  setImmediate(callback)
}

MemDOWN.prototype._batch = function (array, options, callback) {
  var err
    , i = -1
    , key
    , value
    , len = array.length

  while (++i < len) {
    if (array[i]) {
      key = Buffer.isBuffer(array[i].key) ? array[i].key : String(array[i].key)
      err = this._checkKeyValue(key, 'key')
      if (err) return setImmediate(function () { callback(err) })
      if (array[i].type === 'del') {
        this._del(array[i].key, options, noop)
      } else if (array[i].type === 'put') {
        value = Buffer.isBuffer(array[i].value) ? array[i].value : String(array[i].value)
        err = this._checkKeyValue(value, 'value')
        if (err) return setImmediate(function () { callback(err) })
        this._put(key, value, options, noop)
      }
    }
  }
  
  setImmediate(callback)
}

MemDOWN.prototype._iterator = function (options) {
  return new MemIterator(this, options)
}

MemDOWN.prototype._isBuffer = function (obj) {
  return Buffer.isBuffer(obj)
}

module.exports = MemDOWN

}).call(this,require("JkpR2F"),typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {},require("buffer").Buffer)
},{"JkpR2F":59,"abstract-leveldown":65,"buffer":54,"inherits":67,"ltgt":68}],63:[function(require,module,exports){
(function (process){
/* Copyright (c) 2013 Rod Vagg, MIT License */

function AbstractChainedBatch (db) {
  this._db         = db
  this._operations = []
  this._written    = false
}

AbstractChainedBatch.prototype._checkWritten = function () {
  if (this._written)
    throw new Error('write() already called on this batch')
}

AbstractChainedBatch.prototype.put = function (key, value) {
  this._checkWritten()

  var err = this._db._checkKeyValue(key, 'key', this._db._isBuffer)
  if (err) throw err
  err = this._db._checkKeyValue(value, 'value', this._db._isBuffer)
  if (err) throw err

  if (!this._db._isBuffer(key)) key = String(key)
  if (!this._db._isBuffer(value)) value = String(value)

  if (typeof this._put == 'function' )
    this._put(key, value)
  else
    this._operations.push({ type: 'put', key: key, value: value })

  return this
}

AbstractChainedBatch.prototype.del = function (key) {
  this._checkWritten()

  var err = this._db._checkKeyValue(key, 'key', this._db._isBuffer)
  if (err) throw err

  if (!this._db._isBuffer(key)) key = String(key)

  if (typeof this._del == 'function' )
    this._del(key)
  else
    this._operations.push({ type: 'del', key: key })

  return this
}

AbstractChainedBatch.prototype.clear = function () {
  this._checkWritten()

  this._operations = []

  if (typeof this._clear == 'function' )
    this._clear()

  return this
}

AbstractChainedBatch.prototype.write = function (options, callback) {
  this._checkWritten()

  if (typeof options == 'function')
    callback = options
  if (typeof callback != 'function')
    throw new Error('write() requires a callback argument')
  if (typeof options != 'object')
    options = {}

  this._written = true

  if (typeof this._write == 'function' )
    return this._write(callback)

  if (typeof this._db._batch == 'function')
    return this._db._batch(this._operations, options, callback)

  process.nextTick(callback)
}

module.exports = AbstractChainedBatch
}).call(this,require("JkpR2F"))
},{"JkpR2F":59}],64:[function(require,module,exports){
(function (process){
/* Copyright (c) 2013 Rod Vagg, MIT License */

function AbstractIterator (db) {
  this.db = db
  this._ended = false
  this._nexting = false
}

AbstractIterator.prototype.next = function (callback) {
  var self = this

  if (typeof callback != 'function')
    throw new Error('next() requires a callback argument')

  if (self._ended)
    return callback(new Error('cannot call next() after end()'))
  if (self._nexting)
    return callback(new Error('cannot call next() before previous next() has completed'))

  self._nexting = true
  if (typeof self._next == 'function') {
    return self._next(function () {
      self._nexting = false
      callback.apply(null, arguments)
    })
  }

  process.nextTick(function () {
    self._nexting = false
    callback()
  })
}

AbstractIterator.prototype.end = function (callback) {
  if (typeof callback != 'function')
    throw new Error('end() requires a callback argument')

  if (this._ended)
    return callback(new Error('end() already called on iterator'))

  this._ended = true

  if (typeof this._end == 'function')
    return this._end(callback)

  process.nextTick(callback)
}

module.exports = AbstractIterator

}).call(this,require("JkpR2F"))
},{"JkpR2F":59}],65:[function(require,module,exports){
(function (process,Buffer){
/* Copyright (c) 2013 Rod Vagg, MIT License */

var xtend                = require('xtend')
  , AbstractIterator     = require('./abstract-iterator')
  , AbstractChainedBatch = require('./abstract-chained-batch')

function AbstractLevelDOWN (location) {
  if (!arguments.length || location === undefined)
    throw new Error('constructor requires at least a location argument')

  if (typeof location != 'string')
    throw new Error('constructor requires a location string argument')

  this.location = location
}

AbstractLevelDOWN.prototype.open = function (options, callback) {
  if (typeof options == 'function')
    callback = options

  if (typeof callback != 'function')
    throw new Error('open() requires a callback argument')

  if (typeof options != 'object')
    options = {}

  if (typeof this._open == 'function')
    return this._open(options, callback)

  process.nextTick(callback)
}

AbstractLevelDOWN.prototype.close = function (callback) {
  if (typeof callback != 'function')
    throw new Error('close() requires a callback argument')

  if (typeof this._close == 'function')
    return this._close(callback)

  process.nextTick(callback)
}

AbstractLevelDOWN.prototype.get = function (key, options, callback) {
  var err

  if (typeof options == 'function')
    callback = options

  if (typeof callback != 'function')
    throw new Error('get() requires a callback argument')

  if (err = this._checkKeyValue(key, 'key', this._isBuffer))
    return callback(err)

  if (!this._isBuffer(key))
    key = String(key)

  if (typeof options != 'object')
    options = {}

  if (typeof this._get == 'function')
    return this._get(key, options, callback)

  process.nextTick(function () { callback(new Error('NotFound')) })
}

AbstractLevelDOWN.prototype.put = function (key, value, options, callback) {
  var err

  if (typeof options == 'function')
    callback = options

  if (typeof callback != 'function')
    throw new Error('put() requires a callback argument')

  if (err = this._checkKeyValue(key, 'key', this._isBuffer))
    return callback(err)

  if (err = this._checkKeyValue(value, 'value', this._isBuffer))
    return callback(err)

  if (!this._isBuffer(key))
    key = String(key)

  // coerce value to string in node, don't touch it in browser
  // (indexeddb can store any JS type)
  if (!this._isBuffer(value) && !process.browser)
    value = String(value)

  if (typeof options != 'object')
    options = {}

  if (typeof this._put == 'function')
    return this._put(key, value, options, callback)

  process.nextTick(callback)
}

AbstractLevelDOWN.prototype.del = function (key, options, callback) {
  var err

  if (typeof options == 'function')
    callback = options

  if (typeof callback != 'function')
    throw new Error('del() requires a callback argument')

  if (err = this._checkKeyValue(key, 'key', this._isBuffer))
    return callback(err)

  if (!this._isBuffer(key))
    key = String(key)

  if (typeof options != 'object')
    options = {}

  if (typeof this._del == 'function')
    return this._del(key, options, callback)

  process.nextTick(callback)
}

AbstractLevelDOWN.prototype.batch = function (array, options, callback) {
  if (!arguments.length)
    return this._chainedBatch()

  if (typeof options == 'function')
    callback = options

  if (typeof callback != 'function')
    throw new Error('batch(array) requires a callback argument')

  if (!Array.isArray(array))
    return callback(new Error('batch(array) requires an array argument'))

  if (typeof options != 'object')
    options = {}

  var i = 0
    , l = array.length
    , e
    , err

  for (; i < l; i++) {
    e = array[i]
    if (typeof e != 'object')
      continue

    if (err = this._checkKeyValue(e.type, 'type', this._isBuffer))
      return callback(err)

    if (err = this._checkKeyValue(e.key, 'key', this._isBuffer))
      return callback(err)

    if (e.type == 'put') {
      if (err = this._checkKeyValue(e.value, 'value', this._isBuffer))
        return callback(err)
    }
  }

  if (typeof this._batch == 'function')
    return this._batch(array, options, callback)

  process.nextTick(callback)
}

//TODO: remove from here, not a necessary primitive
AbstractLevelDOWN.prototype.approximateSize = function (start, end, callback) {
  if (   start == null
      || end == null
      || typeof start == 'function'
      || typeof end == 'function') {
    throw new Error('approximateSize() requires valid `start`, `end` and `callback` arguments')
  }

  if (typeof callback != 'function')
    throw new Error('approximateSize() requires a callback argument')

  if (!this._isBuffer(start))
    start = String(start)

  if (!this._isBuffer(end))
    end = String(end)

  if (typeof this._approximateSize == 'function')
    return this._approximateSize(start, end, callback)

  process.nextTick(function () {
    callback(null, 0)
  })
}

AbstractLevelDOWN.prototype._setupIteratorOptions = function (options) {
  var self = this

  options = xtend(options)

  ;[ 'start', 'end', 'gt', 'gte', 'lt', 'lte' ].forEach(function (o) {
    if (options[o] && self._isBuffer(options[o]) && options[o].length === 0)
      delete options[o]
  })

  options.reverse = !!options.reverse

  // fix `start` so it takes into account gt, gte, lt, lte as appropriate
  if (options.reverse && options.lt)
    options.start = options.lt
  if (options.reverse && options.lte)
    options.start = options.lte
  if (!options.reverse && options.gt)
    options.start = options.gt
  if (!options.reverse && options.gte)
    options.start = options.gte

  if ((options.reverse && options.lt && !options.lte)
    || (!options.reverse && options.gt && !options.gte))
    options.exclusiveStart = true // start should *not* include matching key

  return options
}

AbstractLevelDOWN.prototype.iterator = function (options) {
  if (typeof options != 'object')
    options = {}

  options = this._setupIteratorOptions(options)

  if (typeof this._iterator == 'function')
    return this._iterator(options)

  return new AbstractIterator(this)
}

AbstractLevelDOWN.prototype._chainedBatch = function () {
  return new AbstractChainedBatch(this)
}

AbstractLevelDOWN.prototype._isBuffer = function (obj) {
  return Buffer.isBuffer(obj)
}

AbstractLevelDOWN.prototype._checkKeyValue = function (obj, type) {
  if (obj === null || obj === undefined)
    return new Error(type + ' cannot be `null` or `undefined`')

  if (obj === null || obj === undefined)
    return new Error(type + ' cannot be `null` or `undefined`')

  if (this._isBuffer(obj)) {
    if (obj.length === 0)
      return new Error(type + ' cannot be an empty Buffer')
  } else if (String(obj) === '')
    return new Error(type + ' cannot be an empty String')
}

module.exports.AbstractLevelDOWN    = AbstractLevelDOWN
module.exports.AbstractIterator     = AbstractIterator
module.exports.AbstractChainedBatch = AbstractChainedBatch

}).call(this,require("JkpR2F"),require("buffer").Buffer)
},{"./abstract-chained-batch":63,"./abstract-iterator":64,"JkpR2F":59,"buffer":54,"xtend":66}],66:[function(require,module,exports){
module.exports = extend

function extend() {
    var target = {}

    for (var i = 0; i < arguments.length; i++) {
        var source = arguments[i]

        for (var key in source) {
            if (source.hasOwnProperty(key)) {
                target[key] = source[key]
            }
        }
    }

    return target
}

},{}],67:[function(require,module,exports){
module.exports=require(58)
},{}],68:[function(require,module,exports){
(function (Buffer){

exports.compare = function (a, b) {

  if(Buffer.isBuffer(a)) {
    var l = Math.min(a.length, b.length)
    for(var i = 0; i < l; i++) {
      var cmp = a[i] - b[i]
      if(cmp) return cmp
    }
    return a.length - b.length
  }

  return a < b ? -1 : a > b ? 1 : 0
}

function has(obj, key) {
  return Object.hasOwnProperty.call(obj, key)
}

// to be compatible with the current abstract-leveldown tests
// nullish or empty strings.
// I could use !!val but I want to permit numbers and booleans,
// if possible.

function isDef (val) {
  return val != null && val !== ''
}

var lowerBound = exports.lowerBound = function (range) {
  return (
      isDef(range.gt)                      ? range.gt
    : isDef(range.gte)                     ? range.gte
    : isDef(range.min)                     ? range.min
    : isDef(range.start) && !range.reverse ? range.start
    : isDef(range.end) && range.reverse    ? range.end
    :                                        undefined
  )
}

exports.lowerBoundInclusive = function (range) {
  return isDef(range.gt) ? false : true
}

exports.upperBoundInclusive =
  function (range) {
    return isDef(range.lt) ? false : true
  }

var lowerBoundExclusive = exports.lowerBoundExclusive =
  function (range) {
    return isDef(range.gt) ? true : false
  }

var upperBoundExclusive = exports.upperBoundExclusive =
  function (range) {
    return isDef(range.lt) ? true : false
  }

var upperBound = exports.upperBound = function (range) {
  return (
      isDef(range.lt)                     ? range.lt
    : isDef(range.lte)                    ? range.lte
    : isDef(range.max)                    ? range.max
    : isDef(range.start) && range.reverse ? range.start
    : isDef(range.end) && !range.reverse  ? range.end
    :                                       undefined
  )
}


exports.contains = function (range, key, compare) {
  compare = compare || exports.compare

  var lb = lowerBound(range)
  if(isDef(lb)) {
    var cmp = compare(key, lb)
    if(cmp < 0 || (cmp === 0 && lowerBoundExclusive(range)))
      return false
  }

  var ub = upperBound(range)
  if(isDef(ub)) {
    var cmp = compare(key, ub)
    if(cmp > 0 || (cmp === 0) && upperBoundExclusive(range))
      return false
  }

  return true
}

exports.filter = function (range, compare) {
  return function (key) {
    return exports.contains(range, key, compare)
  }
}

}).call(this,require("buffer").Buffer)
},{"buffer":54}],69:[function(require,module,exports){
"use strict";

var utils = require('./utils');
var merge = require('./merge');
var errors = require('./deps/errors');
var EventEmitter = require('events').EventEmitter;
var upsert = require('./deps/upsert');
var Changes = require('./changes');
var Promise = utils.Promise;

/*
 * A generic pouch adapter
 */

// returns first element of arr satisfying callback predicate
function arrayFirst(arr, callback) {
  for (var i = 0; i < arr.length; i++) {
    if (callback(arr[i], i) === true) {
      return arr[i];
    }
  }
  return false;
}

// Wrapper for functions that call the bulkdocs api with a single doc,
// if the first result is an error, return an error
function yankError(callback) {
  return function (err, results) {
    if (err || results[0].error) {
      callback(err || results[0]);
    } else {
      callback(null, results[0]);
    }
  };
}

// for every node in a revision tree computes its distance from the closest
// leaf
function computeHeight(revs) {
  var height = {};
  var edges = [];
  merge.traverseRevTree(revs, function (isLeaf, pos, id, prnt) {
    var rev = pos + "-" + id;
    if (isLeaf) {
      height[rev] = 0;
    }
    if (prnt !== undefined) {
      edges.push({from: prnt, to: rev});
    }
    return rev;
  });

  edges.reverse();
  edges.forEach(function (edge) {
    if (height[edge.from] === undefined) {
      height[edge.from] = 1 + height[edge.to];
    } else {
      height[edge.from] = Math.min(height[edge.from], 1 + height[edge.to]);
    }
  });
  return height;
}

function allDocsKeysQuery(api, opts, callback) {
  var keys =  ('limit' in opts) ?
      opts.keys.slice(opts.skip, opts.limit + opts.skip) :
      (opts.skip > 0) ? opts.keys.slice(opts.skip) : opts.keys;
  if (opts.descending) {
    keys.reverse();
  }
  if (!keys.length) {
    return api._allDocs({limit: 0}, callback);
  }
  var finalResults = {
    offset: opts.skip
  };
  return Promise.all(keys.map(function (key, i) {
    var subOpts = utils.extend(true, {key: key, deleted: 'ok'}, opts);
    ['limit', 'skip', 'keys'].forEach(function (optKey) {
      delete subOpts[optKey];
    });
    return new Promise(function (resolve, reject) {
      api._allDocs(subOpts, function (err, res) {
        if (err) {
          return reject(err);
        }
        finalResults.total_rows = res.total_rows;
        resolve(res.rows[0] || {key: key, error: 'not_found'});
      });
    });
  })).then(function (results) {
    finalResults.rows = results;
    return finalResults;
  });
}

utils.inherits(AbstractPouchDB, EventEmitter);
module.exports = AbstractPouchDB;

function AbstractPouchDB() {
  var self = this;
  EventEmitter.call(this);
  self.autoCompact = function (callback) {
    if (!self.auto_compaction) {
      return callback;
    }
    return function (err, res) {
      if (err) {
        callback(err);
      } else {
        var count = res.length;
        var decCount = function () {
          count--;
          if (!count) {
            callback(null, res);
          }
        };
        res.forEach(function (doc) {
          if (doc.ok) {
            // TODO: we need better error handling
            self.compactDocument(doc.id, 1, decCount);
          } else {
            decCount();
          }
        });
      }
    };
  };

  var listeners = 0, changes;
  var eventNames = ['change', 'delete', 'create', 'update'];
  this.on('newListener', function (eventName) {
    if (~eventNames.indexOf(eventName)) {
      if (listeners) {
        listeners++;
        return;
      } else {
        listeners++;
      }
    } else {
      return;
    }
    var lastChange = 0;
    changes = this.changes({
      conflicts: true,
      include_docs: true,
      continuous: true,
      since: 'now',
      onChange: function (change) {
        if (change.seq <= lastChange) {
          return;
        }
        lastChange = change.seq;
        self.emit('change', change);
        if (change.doc._deleted) {
          self.emit('delete', change);
        } else if (change.doc._rev.split('-')[0] === '1') {
          self.emit('create', change);
        } else {
          self.emit('update', change);
        }
      }
    });
  });
  this.on('removeListener', function (eventName) {
    if (~eventNames.indexOf(eventName)) {
      listeners--;
      if (listeners) {
        return;
      }
    } else {
      return;
    }
    changes.cancel();
  });
}

AbstractPouchDB.prototype.post =
  utils.adapterFun('post', function (doc, opts, callback) {
  if (typeof opts === 'function') {
    callback = opts;
    opts = {};
  }
  if (typeof doc !== 'object' || Array.isArray(doc)) {
    return callback(errors.NOT_AN_OBJECT);
  }
  this.bulkDocs({docs: [doc]}, opts,
      this.autoCompact(yankError(callback)));
});

AbstractPouchDB.prototype.put =
  utils.adapterFun('put', utils.getArguments(function (args) {
  var temp, temptype, opts, callback;
  var doc = args.shift();
  var id = '_id' in doc;
  if (typeof doc !== 'object' || Array.isArray(doc)) {
    callback = args.pop();
    return callback(errors.NOT_AN_OBJECT);
  }
  doc = utils.clone(doc);
  while (true) {
    temp = args.shift();
    temptype = typeof temp;
    if (temptype === "string" && !id) {
      doc._id = temp;
      id = true;
    } else if (temptype === "string" && id && !('_rev' in doc)) {
      doc._rev = temp;
    } else if (temptype === "object") {
      opts = temp;
    } else if (temptype === "function") {
      callback = temp;
    }
    if (!args.length) {
      break;
    }
  }
  opts = opts || {};
  var error = utils.invalidIdError(doc._id);
  if (error) {
    return callback(error);
  }
  this.bulkDocs({docs: [doc]}, opts,
      this.autoCompact(yankError(callback)));
}));

AbstractPouchDB.prototype.putAttachment =
  utils.adapterFun('putAttachment', function (docId, attachmentId, rev,
                                              blob, type, callback) {
  var api = this;
  if (typeof type === 'function') {
    callback = type;
    type = blob;
    blob = rev;
    rev = null;
  }
  if (typeof type === 'undefined') {
    type = blob;
    blob = rev;
    rev = null;
  }

  function createAttachment(doc) {
    doc._attachments = doc._attachments || {};
    doc._attachments[attachmentId] = {
      content_type: type,
      data: blob
    };
    return api.put(doc);
  }

  return api.get(docId).then(function (doc) {
    if (doc._rev !== rev) {
      throw errors.REV_CONFLICT;
    }

    return createAttachment(doc);
  }, function (err) {
     // create new doc
    if (err.error === errors.MISSING_DOC.error) {
      return createAttachment({_id: docId});
    } else {
      throw err;
    }
  });
});

AbstractPouchDB.prototype.removeAttachment =
  utils.adapterFun('removeAttachment', function (docId, attachmentId, rev,
                                                 callback) {
  var self = this;
  self.get(docId, function (err, obj) {
    if (err) {
      callback(err);
      return;
    }
    if (obj._rev !== rev) {
      callback(errors.REV_CONFLICT);
      return;
    }
    if (!obj._attachments) {
      return callback();
    }
    delete obj._attachments[attachmentId];
    if (Object.keys(obj._attachments).length === 0) {
      delete obj._attachments;
    }
    self.put(obj, callback);
  });
});

AbstractPouchDB.prototype.remove =
  utils.adapterFun('remove', function (doc, opts, callback) {
  if (typeof opts === 'function') {
    callback = opts;
    opts = {};
  } else if (typeof opts === 'string') {
    doc = {
      _id: doc,
      _rev: opts
    };
  } else if (opts === undefined) {
    opts = {};
  }
  opts = utils.clone(opts);
  opts.was_delete = true;
  var newDoc = {_id: doc._id, _rev: doc._rev};
  newDoc._deleted = true;
  this.bulkDocs({docs: [newDoc]}, opts, yankError(callback));
});

AbstractPouchDB.prototype.revsDiff =
  utils.adapterFun('revsDiff', function (req, opts, callback) {
  if (typeof opts === 'function') {
    callback = opts;
    opts = {};
  }
  opts = utils.clone(opts);
  var ids = Object.keys(req);
  var count = 0;
  var missing = {};

  function addToMissing(id, revId) {
    if (!missing[id]) {
      missing[id] = {missing: []};
    }
    missing[id].missing.push(revId);
  }

  function processDoc(id, rev_tree) {
    // Is this fast enough? Maybe we should switch to a set simulated by a map
    var missingForId = req[id].slice(0);
    merge.traverseRevTree(rev_tree, function (isLeaf, pos, revHash, ctx,
      opts) {
        var rev = pos + '-' + revHash;
        var idx = missingForId.indexOf(rev);
        if (idx === -1) {
          return;
        }

        missingForId.splice(idx, 1);
        if (opts.status !== 'available') {
          addToMissing(id, rev);
        }
      });

    // Traversing the tree is synchronous, so now `missingForId` contains
    // revisions that were not found in the tree
    missingForId.forEach(function (rev) {
      addToMissing(id, rev);
    });
  }

  ids.map(function (id) {
    this._getRevisionTree(id, function (err, rev_tree) {
      if (err && err.name === 'not_found' && err.message === 'missing') {
        missing[id] = {missing: req[id]};
      } else if (err) {
        return callback(err);
      } else {
        processDoc(id, rev_tree);
      }

      if (++count === ids.length) {
        return callback(null, missing);
      }
    });
  }, this);
});

// compact one document and fire callback
// by compacting we mean removing all revisions which
// are further from the leaf in revision tree than max_height
AbstractPouchDB.prototype.compactDocument =
  function (docId, max_height, callback) {
  var self = this;
  this._getRevisionTree(docId, function (err, rev_tree) {
    if (err) {
      return callback(err);
    }
    var height = computeHeight(rev_tree);
    var candidates = [];
    var revs = [];
    Object.keys(height).forEach(function (rev) {
      if (height[rev] > max_height) {
        candidates.push(rev);
      }
    });

    merge.traverseRevTree(rev_tree, function (isLeaf, pos, revHash, ctx, opts) {
      var rev = pos + '-' + revHash;
      if (opts.status === 'available' && candidates.indexOf(rev) !== -1) {
        opts.status = 'missing';
        revs.push(rev);
      }
    });
    self._doCompaction(docId, rev_tree, revs, callback);
  });
};

// compact the whole database using single document
// compaction
AbstractPouchDB.prototype.compact =
  utils.adapterFun('compact', function (opts, callback) {
  if (typeof opts === 'function') {
    callback = opts;
    opts = {};
  }
  var self = this;
  this.changes({complete: function (err, res) {
    if (err) {
      callback(); // TODO: silently fail
      return;
    }
    var count = res.results.length;
    if (!count) {
      callback();
      return;
    }
    res.results.forEach(function (row) {
      self.compactDocument(row.id, 0, function () {
        count--;
        if (!count) {
          callback();
        }
      });
    });
  }});
});

/* Begin api wrappers. Specific functionality to storage belongs in the 
   _[method] */
AbstractPouchDB.prototype.get =
  utils.adapterFun('get', function (id, opts, callback) {
  if (typeof opts === 'function') {
    callback = opts;
    opts = {};
  }
  if (typeof id !== 'string') {
    return callback(errors.INVALID_ID);
  }
  var leaves = [], self = this;
  function finishOpenRevs() {
    var result = [];
    var count = leaves.length;
    if (!count) {
      return callback(null, result);
    }
    // order with open_revs is unspecified
    leaves.forEach(function (leaf) {
      self.get(id,
               {rev: leaf, revs: opts.revs, attachments: opts.attachments},
               function (err, doc) {
        if (!err) {
          result.push({ok: doc});
        } else {
          result.push({missing: leaf});
        }
        count--;
        if (!count) {
          callback(null, result);
        }
      });
    });
  }

  if (opts.open_revs) {
    if (opts.open_revs === "all") {
      this._getRevisionTree(id, function (err, rev_tree) {
        if (err) {
          // if there's no such document we should treat this
          // situation the same way as if revision tree was empty
          rev_tree = [];
        }
        leaves = merge.collectLeaves(rev_tree).map(function (leaf) {
          return leaf.rev;
        });
        finishOpenRevs();
      });
    } else {
      if (Array.isArray(opts.open_revs)) {
        leaves = opts.open_revs;
        for (var i = 0; i < leaves.length; i++) {
          var l = leaves[i];
          // looks like it's the only thing couchdb checks
          if (!(typeof(l) === "string" && /^\d+-/.test(l))) {
            return callback(errors.error(errors.BAD_REQUEST,
              "Invalid rev format"));
          }
        }
        finishOpenRevs();
      } else {
        return callback(errors.error(errors.UNKNOWN_ERROR,
          'function_clause'));
      }
    }
    return; // open_revs does not like other options
  }

  return this._get(id, opts, function (err, result) {
    opts = utils.clone(opts);
    if (err) {
      return callback(err);
    }

    var doc = result.doc;
    if (!doc) {
      // a smoke test for something being very wrong
      return callback(new Error('no doc!'));
    }
    var metadata = result.metadata;
    var ctx = result.ctx;

    if (opts.conflicts) {
      var conflicts = merge.collectConflicts(metadata);
      if (conflicts.length) {
        doc._conflicts = conflicts;
      }
    }

    if (opts.revs || opts.revs_info) {
      var paths = merge.rootToLeaf(metadata.rev_tree);
      var path = arrayFirst(paths, function (arr) {
        return arr.ids.map(function (x) { return x.id; })
          .indexOf(doc._rev.split('-')[1]) !== -1;
      });

      var indexOfRev = path.ids.map(function (x) {return x.id; })
        .indexOf(doc._rev.split('-')[1]) + 1;
      var howMany = path.ids.length - indexOfRev;
      path.ids.splice(indexOfRev, howMany);
      path.ids.reverse();

      if (opts.revs) {
        doc._revisions = {
          start: (path.pos + path.ids.length) - 1,
          ids: path.ids.map(function (rev) {
            return rev.id;
          })
        };
      }
      if (opts.revs_info) {
        var pos =  path.pos + path.ids.length;
        doc._revs_info = path.ids.map(function (rev) {
          pos--;
          return {
            rev: pos + '-' + rev.id,
            status: rev.opts.status
          };
        });
      }
    }

    if (opts.local_seq) {
      doc._local_seq = result.metadata.seq;
    }

    if (opts.attachments && doc._attachments) {
      var attachments = doc._attachments;
      var count = Object.keys(attachments).length;
      if (count === 0) {
        return callback(null, doc);
      }
      Object.keys(attachments).forEach(function (key) {
        this._getAttachment(attachments[key],
                            {encode: true, ctx: ctx}, function (err, data) {
          doc._attachments[key].data = data;
          if (!--count) {
            callback(null, doc);
          }
        });
      }, self);
    } else {
      if (doc._attachments) {
        for (var key in doc._attachments) {
          if (doc._attachments.hasOwnProperty(key)) {
            doc._attachments[key].stub = true;
          }
        }
      }
      callback(null, doc);
    }
  });
});

AbstractPouchDB.prototype.getAttachment =
  utils.adapterFun('getAttachment', function (docId, attachmentId, opts,
                                              callback) {
  var self = this;
  if (opts instanceof Function) {
    callback = opts;
    opts = {};
  }
  opts = utils.clone(opts);
  this._get(docId, opts, function (err, res) {
    if (err) {
      return callback(err);
    }
    if (res.doc._attachments && res.doc._attachments[attachmentId]) {
      opts.ctx = res.ctx;
      self._getAttachment(res.doc._attachments[attachmentId], opts, callback);
    } else {
      return callback(errors.MISSING_DOC);
    }
  });
});

AbstractPouchDB.prototype.allDocs =
  utils.adapterFun('allDocs', function (opts, callback) {
  if (typeof opts === 'function') {
    callback = opts;
    opts = {};
  }
  opts = utils.clone(opts);
  opts.skip = typeof opts.skip !== 'undefined' ? opts.skip : 0;
  if ('keys' in opts) {
    if (!Array.isArray(opts.keys)) {
      return callback(new TypeError('options.keys must be an array'));
    }
    var incompatibleOpt =
      ['startkey', 'endkey', 'key'].filter(function (incompatibleOpt) {
      return incompatibleOpt in opts;
    })[0];
    if (incompatibleOpt) {
      callback(errors.error(errors.QUERY_PARSE_ERROR,
        'Query parameter `' + incompatibleOpt +
        '` is not compatible with multi-get'
      ));
      return;
    }
    if (this.type() !== 'http') {
      return allDocsKeysQuery(this, opts, callback);
    }
  }

  return this._allDocs(opts, callback);
});

AbstractPouchDB.prototype.changes = function (opts, callback) {
  if (typeof opts === 'function') {
    callback = opts;
    opts = {};
  }
  return new Changes(this, opts, callback);
};

AbstractPouchDB.prototype.close =
  utils.adapterFun('close', function (callback) {
  this._closed = true;
  return this._close(callback);
});

AbstractPouchDB.prototype.info = utils.adapterFun('info', function (callback) {
  var self = this;
  this._info(function (err, info) {
    if (err) {
      return callback(err);
    }
    var len = self.prefix.length;
    if (info.db_name.length > len &&
        info.db_name.slice(0, len) === self.prefix) {
      info.db_name = info.db_name.slice(len);
    }
    callback(null, info);
  });
});

AbstractPouchDB.prototype.id = utils.adapterFun('id', function (callback) {
  return this._id(callback);
});

AbstractPouchDB.prototype.type = function () {
  return (typeof this._type === 'function') ? this._type() : this.adapter;
};

AbstractPouchDB.prototype.bulkDocs =
  utils.adapterFun('bulkDocs', function (req, opts, callback) {
  if (typeof opts === 'function') {
    callback = opts;
    opts = {};
  }

  opts = utils.clone(opts);

  if (Array.isArray(req)) {
    req = {
      docs: req
    };
  }

  if (!req || !req.docs || !Array.isArray(req.docs)) {
    return callback(errors.MISSING_BULK_DOCS);
  }

  for (var i = 0; i < req.docs.length; ++i) {
    if (typeof req.docs[i] !== 'object' || Array.isArray(req.docs[i])) {
      return callback(errors.NOT_AN_OBJECT);
    }
  }

  req = utils.clone(req);
  if (!('new_edits' in opts)) {
    if ('new_edits' in req) {
      opts.new_edits = req.new_edits;
    } else {
      opts.new_edits = true;
    }
  }

  return this._bulkDocs(req, opts, this.autoCompact(callback));
});

AbstractPouchDB.prototype.registerDependentDatabase =
  utils.adapterFun('registerDependentDatabase', function (dependentDb,
                                                          callback) {
  var depDB = new this.constructor(dependentDb, {adapter: this._adapter});
  function diffFun(doc) {
    doc.dependentDbs = doc.dependentDbs || {};
    if (doc.dependentDbs[dependentDb]) {
      return false; // no update required
    }
    doc.dependentDbs[dependentDb] = true;
    return doc;
  }
  upsert(this, '_local/_pouch_dependentDbs', diffFun, function (err) {
    if (err) {
      return callback(err);
    }
    return callback(null, {db: depDB});
  });
});

},{"./changes":74,"./deps/errors":78,"./deps/upsert":79,"./merge":84,"./utils":89,"events":57}],70:[function(require,module,exports){
"use strict";

var utils = require('../utils');
var errors = require('../deps/errors');
// parseUri 1.2.2
// (c) Steven Levithan <stevenlevithan.com>
// MIT License
function parseUri(str) {
  var o = parseUri.options;
  var m = o.parser[o.strictMode ? "strict" : "loose"].exec(str);
  var uri = {};
  var i = 14;

  while (i--) {
    uri[o.key[i]] = m[i] || "";
  }

  uri[o.q.name] = {};
  uri[o.key[12]].replace(o.q.parser, function ($0, $1, $2) {
    if ($1) {
      uri[o.q.name][$1] = $2;
    }
  });

  return uri;
}

function encodeDocId(id) {
  if (/^_(design|local)/.test(id)) {
    return id;
  }
  return encodeURIComponent(id);
}

parseUri.options = {
  strictMode: false,
  key: ["source", "protocol", "authority", "userInfo", "user", "password",
        "host", "port", "relative", "path", "directory", "file", "query",
        "anchor"],
  q:   {
    name:   "queryKey",
    parser: /(?:^|&)([^&=]*)=?([^&]*)/g
  },
  parser: {
    /* jshint maxlen: false */
    strict: /^(?:([^:\/?#]+):)?(?:\/\/((?:(([^:@]*)(?::([^:@]*))?)?@)?([^:\/?#]*)(?::(\d*))?))?((((?:[^?#\/]*\/)*)([^?#]*))(?:\?([^#]*))?(?:#(.*))?)/,
    loose:  /^(?:(?![^:@]+:[^:@\/]*@)([^:\/?#.]+):)?(?:\/\/)?((?:(([^:@]*)(?::([^:@]*))?)?@)?([^:\/?#]*)(?::(\d*))?)(((\/(?:[^?#](?![^?#\/]*\.[^?#\/.]+(?:[?#]|$)))*\/?)?([^?#\/]*))(?:\?([^#]*))?(?:#(.*))?)/
  }
};

// Get all the information you possibly can about the URI given by name and
// return it as a suitable object.
function getHost(name, opts) {
  // If the given name contains "http:"
  if (/http(s?):/.test(name)) {
    // Prase the URI into all its little bits
    var uri = parseUri(name);

    // Store the fact that it is a remote URI
    uri.remote = true;

    // Store the user and password as a separate auth object
    if (uri.user || uri.password) {
      uri.auth = {username: uri.user, password: uri.password};
    }

    // Split the path part of the URI into parts using '/' as the delimiter
    // after removing any leading '/' and any trailing '/'
    var parts = uri.path.replace(/(^\/|\/$)/g, '').split('/');

    // Store the first part as the database name and remove it from the parts
    // array
    uri.db = parts.pop();

    // Restore the path by joining all the remaining parts (all the parts
    // except for the database name) with '/'s
    uri.path = parts.join('/');
    opts = opts || {};
    opts = utils.clone(opts);
    uri.headers = opts.headers || {};

    if (opts.auth || uri.auth) {
      var nAuth = opts.auth || uri.auth;
      var token = utils.btoa(nAuth.username + ':' + nAuth.password);
      uri.headers.Authorization = 'Basic ' + token;
    }

    if (opts.headers) {
      uri.headers = opts.headers;
    }

    return uri;
  }

  // If the given name does not contain 'http:' then return a very basic object
  // with no host, the current path, the given name as the database name and no
  // username/password
  return {host: '', path: '/', db: name, auth: false};
}

// Generate a URL with the host data given by opts and the given path
function genDBUrl(opts, path) {
  return genUrl(opts, opts.db + '/' + path);
}

// Generate a URL with the host data given by opts and the given path
function genUrl(opts, path) {
  if (opts.remote) {
    // If the host already has a path, then we need to have a path delimiter
    // Otherwise, the path delimiter is the empty string
    var pathDel = !opts.path ? '' : '/';

    // If the host already has a path, then we need to have a path delimiter
    // Otherwise, the path delimiter is the empty string
    return opts.protocol + '://' + opts.host + ':' + opts.port + '/' +
           opts.path + pathDel + path;
  }

  return '/' + path;
}
// Implements the PouchDB API for dealing with CouchDB instances over HTTP
function HttpPouch(opts, callback) {
  // The functions that will be publicly available for HttpPouch
  var api = this;
  api.getHost = opts.getHost ? opts.getHost : getHost;

  // Parse the URI given by opts.name into an easy-to-use object
  var host = api.getHost(opts.name, opts);

  // Generate the database URL based on the host
  var dbUrl = genDBUrl(host, '');

  api.getUrl = function () {return dbUrl; };

  var ajaxOpts = opts.ajax || {};
  opts = utils.clone(opts);
  function ajax(options, callback) {
    return utils.ajax(utils.extend({}, ajaxOpts, options), callback);
  }

  // Create a new CouchDB database based on the given opts
  var createDB = function () {
    ajax({headers: host.headers, method: 'PUT', url: dbUrl},
         function (err, ret) {
      // If we get an "Unauthorized" error
      if (err && err.status === 401) {
        // Test if the database already exists
        ajax({headers: host.headers, method: 'HEAD', url: dbUrl},
             function (err, ret) {
          // If there is still an error
          if (err) {
            // Give the error to the callback to deal with
            callback(err);
          } else {
            // Continue as if there had been no errors
            callback(null, api);
          }
        });
        // If there were no errros or if the only error is "Precondition Failed"
        // (note: "Precondition Failed" occurs when we try to create a database
        // that already exists)
      } else if (!err || err.status === 412) {
        // Continue as if there had been no errors
        callback(null, api);
      } else {
        callback(err);
      }
    });
  };
  if (!opts.skipSetup) {
    ajax({headers: host.headers, method: 'GET', url: dbUrl},
         function (err, ret) {
      //check if the db exists
      if (err) {
        if (err.status === 404) {
          //if it doesn't, create it
          createDB();
        } else {
          callback(err);
        }
      } else {
        //go do stuff with the db
        callback(null, api);
      }
    });
  }

  api.type = function () {
    return 'http';
  };

  api.id = utils.adapterFun('id', function (callback) {
    ajax({
      headers: host.headers,
      method: 'GET',
      url: genUrl(host, '')
    }, function (err, result) {
      var uuid = (result && result.uuid) ?
        result.uuid + host.db : genDBUrl(host, '');
      callback(null, uuid);
    });
  });

  api.request = utils.adapterFun('request', function (options, callback) {
    options.headers = host.headers;
    options.url = genDBUrl(host, options.url);
    ajax(options, callback);
  });

  // Sends a POST request to the host calling the couchdb _compact function
  //    version: The version of CouchDB it is running
  api.compact = utils.adapterFun('compact', function (opts, callback) {
    if (typeof opts === 'function') {
      callback = opts;
      opts = {};
    }
    opts = utils.clone(opts);
    ajax({
      headers: host.headers,
      url: genDBUrl(host, '_compact'),
      method: 'POST'
    }, function () {
      function ping() {
        api.info(function (err, res) {
          if (!res.compact_running) {
            callback();
          } else {
            setTimeout(ping, opts.interval || 200);
          }
        });
      }
      // Ping the http if it's finished compaction
      if (typeof callback === "function") {
        ping();
      }
    });
  });

  // Calls GET on the host, which gets back a JSON string containing
  //    couchdb: A welcome string
  //    version: The version of CouchDB it is running
  api._info = function (callback) {
    ajax({
      headers: host.headers,
      method: 'GET',
      url: genDBUrl(host, '')
    }, function (err, res) {
      if (err) {
        callback(err);
      } else {
        res.host = genDBUrl(host, '');
        callback(null, res);
      }
    });
  };

  // Get the document with the given id from the database given by host.
  // The id could be solely the _id in the database, or it may be a
  // _design/ID or _local/ID path
  api.get = utils.adapterFun('get', function (id, opts, callback) {
    // If no options were given, set the callback to the second parameter
    if (typeof opts === 'function') {
      callback = opts;
      opts = {};
    }
    opts = utils.clone(opts);
    if (opts.auto_encode === undefined) {
      opts.auto_encode = true;
    }

    // List of parameters to add to the GET request
    var params = [];

    // If it exists, add the opts.revs value to the list of parameters.
    // If revs=true then the resulting JSON will include a field
    // _revisions containing an array of the revision IDs.
    if (opts.revs) {
      params.push('revs=true');
    }

    // If it exists, add the opts.revs_info value to the list of parameters.
    // If revs_info=true then the resulting JSON will include the field
    // _revs_info containing an array of objects in which each object
    // representing an available revision.
    if (opts.revs_info) {
      params.push('revs_info=true');
    }

    if (opts.local_seq) {
      params.push('local_seq=true');
    }
    // If it exists, add the opts.open_revs value to the list of parameters.
    // If open_revs=all then the resulting JSON will include all the leaf
    // revisions. If open_revs=["rev1", "rev2",...] then the resulting JSON
    // will contain an array of objects containing data of all revisions
    if (opts.open_revs) {
      if (opts.open_revs !== "all") {
        opts.open_revs = JSON.stringify(opts.open_revs);
      }
      params.push('open_revs=' + opts.open_revs);
    }

    // If it exists, add the opts.attachments value to the list of parameters.
    // If attachments=true the resulting JSON will include the base64-encoded
    // contents in the "data" property of each attachment.
    if (opts.attachments) {
      params.push('attachments=true');
    }

    // If it exists, add the opts.rev value to the list of parameters.
    // If rev is given a revision number then get the specified revision.
    if (opts.rev) {
      params.push('rev=' + opts.rev);
    }

    // If it exists, add the opts.conflicts value to the list of parameters.
    // If conflicts=true then the resulting JSON will include the field
    // _conflicts containing all the conflicting revisions.
    if (opts.conflicts) {
      params.push('conflicts=' + opts.conflicts);
    }

    // Format the list of parameters into a valid URI query string
    params = params.join('&');
    params = params === '' ? '' : '?' + params;

    if (opts.auto_encode) {
      id = encodeDocId(id);
    }

    // Set the options for the ajax call
    var options = {
      headers: host.headers,
      method: 'GET',
      url: genDBUrl(host, id + params)
    };

    // If the given id contains at least one '/' and the part before the '/'
    // is NOT "_design" and is NOT "_local"
    // OR
    // If the given id contains at least two '/' and the part before the first
    // '/' is "_design".
    // TODO This second condition seems strange since if parts[0] === '_design'
    // then we already know that parts[0] !== '_local'.
    var parts = id.split('/');
    if ((parts.length > 1 && parts[0] !== '_design' && parts[0] !== '_local') ||
        (parts.length > 2 && parts[0] === '_design' && parts[0] !== '_local')) {
      // Binary is expected back from the server
      options.binary = true;
    }

    // Get the document
    ajax(options, function (err, doc, xhr) {
      // If the document does not exist, send an error to the callback
      if (err) {
        return callback(err);
      }

      // Send the document to the callback
      callback(null, doc, xhr);
    });
  });

  // Delete the document given by doc from the database given by host.
  api.remove = utils.adapterFun('remove', function (doc, opts, callback) {
    // If no options were given, set the callback to be the second parameter
    if (typeof opts === 'function') {
      callback = opts;
      opts = {};
    }  else if (typeof opts === 'string') {
      doc = {
        _id: doc,
        _rev: opts
      };
    } else if (opts === undefined) {
      opts = {};
    }
    // Delete the document
    ajax({
      headers: host.headers,
      method: 'DELETE',
      url: genDBUrl(host, encodeDocId(doc._id)) + '?rev=' + doc._rev
    }, callback);
  });

  // Get the attachment
  api.getAttachment =
    utils.adapterFun('getAttachment', function (docId, attachmentId, opts,
                                                callback) {
    if (typeof opts === 'function') {
      callback = opts;
      opts = {};
    }
    opts = utils.clone(opts);
    if (opts.auto_encode === undefined) {
      opts.auto_encode = true;
    }
    if (opts.auto_encode) {
      docId = encodeDocId(docId);
    }
    opts.auto_encode = false;
    api.get(docId + '/' + attachmentId, opts, callback);
  });

  // Remove the attachment given by the id and rev
  api.removeAttachment =
    utils.adapterFun('removeAttachment', function (docId, attachmentId, rev,
                                                   callback) {
    ajax({
      headers: host.headers,
      method: 'DELETE',
      url: genDBUrl(host, encodeDocId(docId) + '/' + attachmentId) + '?rev=' +
           rev
    }, callback);
  });

  // Add the attachment given by blob and its contentType property
  // to the document with the given id, the revision given by rev, and
  // add it to the database given by host.
  api.putAttachment =
    utils.adapterFun('putAttachment', function (docId, attachmentId, rev, blob,
                                                type, callback) {
    if (typeof type === 'function') {
      callback = type;
      type = blob;
      blob = rev;
      rev = null;
    }
    if (typeof type === 'undefined') {
      type = blob;
      blob = rev;
      rev = null;
    }
    var id = encodeDocId(docId) + '/' + attachmentId;
    var url = genDBUrl(host, id);
    if (rev) {
      url += '?rev=' + rev;
    }

    var opts = {
      headers: host.headers,
      method: 'PUT',
      url: url,
      processData: false,
      body: blob,
      timeout: 60000
    };
    opts.headers['Content-Type'] = type;
    // Add the attachment
    ajax(opts, callback);
  });

  // Add the document given by doc (in JSON string format) to the database
  // given by host. This fails if the doc has no _id field.
  api.put = utils.adapterFun('put', utils.getArguments(function (args) {
    var temp, temptype, opts, callback;
    var doc = args.shift();
    var id = '_id' in doc;
    if (typeof doc !== 'object' || Array.isArray(doc)) {
      callback = args.pop();
      return callback(errors.NOT_AN_OBJECT);
    }
    doc = utils.clone(doc);
    while (true) {
      temp = args.shift();
      temptype = typeof temp;
      if (temptype === "string" && !id) {
        doc._id = temp;
        id = true;
      } else if (temptype === "string" && id && !('_rev' in doc)) {
        doc._rev = temp;
      } else if (temptype === "object") {
        opts = utils.clone(temp);
      } else if (temptype === "function") {
        callback = temp;
      }
      if (!args.length) {
        break;
      }
    }
    opts = opts || {};
    var error = utils.invalidIdError(doc._id);
    if (error) {
      return callback(error);
    }

    // List of parameter to add to the PUT request
    var params = [];

    // If it exists, add the opts.new_edits value to the list of parameters.
    // If new_edits = false then the database will NOT assign this document a
    // new revision number
    if (opts && typeof opts.new_edits !== 'undefined') {
      params.push('new_edits=' + opts.new_edits);
    }

    // Format the list of parameters into a valid URI query string
    params = params.join('&');
    if (params !== '') {
      params = '?' + params;
    }

    // Add the document
    ajax({
      headers: host.headers,
      method: 'PUT',
      url: genDBUrl(host, encodeDocId(doc._id)) + params,
      body: doc
    }, callback);
  }));

  // Add the document given by doc (in JSON string format) to the database
  // given by host. This does not assume that doc is a new document 
  // (i.e. does not have a _id or a _rev field.)
  api.post = utils.adapterFun('post', function (doc, opts, callback) {
    // If no options were given, set the callback to be the second parameter
    if (typeof opts === 'function') {
      callback = opts;
      opts = {};
    }
    opts = utils.clone(opts);
    if (typeof doc !== 'object') {
      return callback(errors.NOT_AN_OBJECT);
    }
    if (! ("_id" in doc)) {
      doc._id = utils.uuid();
    }
    api.put(doc, opts, callback);
    
  });

  // Update/create multiple documents given by req in the database
  // given by host.
  api._bulkDocs = function (req, opts, callback) {
    // If opts.new_edits exists add it to the document data to be
    // send to the database.
    // If new_edits=false then it prevents the database from creating
    // new revision numbers for the documents. Instead it just uses
    // the old ones. This is used in database replication.
    if (typeof opts.new_edits !== 'undefined') {
      req.new_edits = opts.new_edits;
    }

    // Update/create the documents
    ajax({
      headers: host.headers,
      method: 'POST',
      url: genDBUrl(host, '_bulk_docs'),
      body: req
    }, callback);
  };

  // Get a listing of the documents in the database given
  // by host and ordered by increasing id.
  api.allDocs = utils.adapterFun('allDocs', function (opts, callback) {
    if (typeof opts === 'function') {
      callback = opts;
      opts = {};
    }
    opts = utils.clone(opts);
    // List of parameters to add to the GET request
    var params = [];
    var body;
    var method = 'GET';

    // TODO I don't see conflicts as a valid parameter for a
    // _all_docs request 
    // (see http://wiki.apache.org/couchdb/HTTP_Document_API#all_docs)
    if (opts.conflicts) {
      params.push('conflicts=true');
    }

    // If opts.descending is truthy add it to params
    if (opts.descending) {
      params.push('descending=true');
    }

    // If opts.include_docs exists, add the include_docs value to the
    // list of parameters.
    // If include_docs=true then include the associated document with each
    // result.
    if (opts.include_docs) {
      params.push('include_docs=true');
    }

    if (opts.key) {
      params.push('key=' + encodeURIComponent(JSON.stringify(opts.key)));
    }

    // If opts.startkey exists, add the startkey value to the list of
    // parameters.
    // If startkey is given then the returned list of documents will
    // start with the document whose id is startkey.
    if (opts.startkey) {
      params.push('startkey=' +
        encodeURIComponent(JSON.stringify(opts.startkey)));
    }

    // If opts.endkey exists, add the endkey value to the list of parameters.
    // If endkey is given then the returned list of docuemnts will
    // end with the document whose id is endkey.
    if (opts.endkey) {
      params.push('endkey=' + encodeURIComponent(JSON.stringify(opts.endkey)));
    }

    if (typeof opts.inclusive_end !== 'undefined') {
      params.push('inclusive_end=' + !!opts.inclusive_end);
    }

    // If opts.limit exists, add the limit value to the parameter list.
    if (typeof opts.limit !== 'undefined') {
      params.push('limit=' + opts.limit);
    }

    if (typeof opts.skip !== 'undefined') {
      params.push('skip=' + opts.skip);
    }

    // Format the list of parameters into a valid URI query string
    params = params.join('&');
    if (params !== '') {
      params = '?' + params;
    }

    if (typeof opts.keys !== 'undefined') {

      var MAX_URL_LENGTH = 2000;
      // according to http://stackoverflow.com/a/417184/680742,
      // the de factor URL length limit is 2000 characters

      var keysAsString =
        'keys=' + encodeURIComponent(JSON.stringify(opts.keys));
      if (keysAsString.length + params.length + 1 <= MAX_URL_LENGTH) {
        // If the keys are short enough, do a GET. we do this to work around
        // Safari not understanding 304s on POSTs (see issue #1239)
        params += (params.indexOf('?') !== -1 ? '&' : '?') + keysAsString;
      } else {
        // If keys are too long, issue a POST request to circumvent GET
        // query string limits
        // see http://wiki.apache.org/couchdb/HTTP_view_API#Querying_Options
        method = 'POST';
        body = JSON.stringify({keys: opts.keys});
      }
    }

    // Get the document listing
    ajax({
      headers: host.headers,
      method: method,
      url: genDBUrl(host, '_all_docs' + params),
      body: body
    }, callback);
  });

  // Get a list of changes made to documents in the database given by host.
  // TODO According to the README, there should be two other methods here,
  // api.changes.addListener and api.changes.removeListener.
  api._changes = function (opts) {
    // We internally page the results of a changes request, this means
    // if there is a large set of changes to be returned we can start
    // processing them quicker instead of waiting on the entire
    // set of changes to return and attempting to process them at once
    var CHANGES_LIMIT = 25;

    opts = utils.clone(opts);
    opts.timeout = opts.timeout || 30 * 1000;

    // We give a 5 second buffer for CouchDB changes to respond with
    // an ok timeout
    var params = { timeout: opts.timeout - (5 * 1000) };
    var limit = (typeof opts.limit !== 'undefined') ? opts.limit : false;
    if (limit === 0) {
      limit = 1;
    }
    var returnDocs;
    if ('returnDocs' in opts) {
      returnDocs = opts.returnDocs;
    } else {
      returnDocs = true;
    }
    //
    var leftToFetch = limit;

    if (opts.style) {
      params.style = opts.style;
    }

    if (opts.include_docs || opts.filter && typeof opts.filter === 'function') {
      params.include_docs = true;
    }

    if (opts.continuous) {
      params.feed = 'longpoll';
    }

    if (opts.conflicts) {
      params.conflicts = true;
    }

    if (opts.descending) {
      params.descending = true;
    }

    if (opts.filter && typeof opts.filter === 'string') {
      params.filter = opts.filter;
      if (opts.filter === '_view' &&
          opts.view &&
          typeof opts.view === 'string') {
        params.view = opts.view;
      }
    }

    // If opts.query_params exists, pass it through to the changes request.
    // These parameters may be used by the filter on the source database.
    if (opts.query_params && typeof opts.query_params === 'object') {
      for (var param_name in opts.query_params) {
        if (opts.query_params.hasOwnProperty(param_name)) {
          params[param_name] = opts.query_params[param_name];
        }
      }
    }

    var xhr;
    var lastFetchedSeq;

    // Get all the changes starting wtih the one immediately after the
    // sequence number given by since.
    var fetch = function (since, callback) {
      if (opts.aborted) {
        return;
      }
      params.since = since;
      if (opts.descending) {
        if (limit) {
          params.limit = leftToFetch;
        }
      } else {
        params.limit = (!limit || leftToFetch > CHANGES_LIMIT) ?
          CHANGES_LIMIT : leftToFetch;
      }

      var paramStr = '?' + Object.keys(params).map(function (k) {
        return k + '=' + params[k];
      }).join('&');

      // Set the options for the ajax call
      var xhrOpts = {
        headers: host.headers,
        method: 'GET',
        url: genDBUrl(host, '_changes' + paramStr),
        // _changes can take a long time to generate, especially when filtered
        timeout: opts.timeout
      };
      lastFetchedSeq = since;

      if (opts.aborted) {
        return;
      }

      // Get the changes
      xhr = ajax(xhrOpts, callback);
    };

    // If opts.since exists, get all the changes from the sequence
    // number given by opts.since. Otherwise, get all the changes
    // from the sequence number 0.
    var fetchTimeout = 10;
    var fetchRetryCount = 0;

    var results = {results: []};

    var fetched = function (err, res) {
      if (opts.aborted) {
        return;
      }
      var raw_results_length = 0;
      // If the result of the ajax call (res) contains changes (res.results)
      if (res && res.results) {
        raw_results_length = res.results.length;
        results.last_seq = res.last_seq;
        // For each change
        var req = {};
        req.query = opts.query_params;
        res.results = res.results.filter(function (c) {
          leftToFetch--;
          var ret = utils.filterChange(opts)(c);
          if (ret) {
            if (returnDocs) {
              results.results.push(c);
            }
            utils.call(opts.onChange, c);
          }
          return ret;
        });
      } else if (err) {
        // In case of an error, stop listening for changes and call
        // opts.complete
        opts.aborted = true;
        utils.call(opts.complete, err);
        return;
      }

      // The changes feed may have timed out with no results
      // if so reuse last update sequence
      if (res && res.last_seq) {
        lastFetchedSeq = res.last_seq;
      }

      var finished = (limit && leftToFetch <= 0) ||
        (res && raw_results_length < CHANGES_LIMIT) ||
        (opts.descending);

      if ((opts.continuous && !(limit && leftToFetch <= 0)) || !finished) {
        // Increase retry delay exponentially as long as errors persist
        if (err) {
          fetchRetryCount += 1;
        } else {
          fetchRetryCount = 0;
        }
        var timeoutMultiplier = 1 << fetchRetryCount;
        var retryWait = fetchTimeout * timeoutMultiplier;
        var maximumWait = opts.maximumWait || 30000;

        if (retryWait > maximumWait) {
          utils.call(opts.complete, err || errors.UNKNOWN_ERROR);
          return;
        }

        // Queue a call to fetch again with the newest sequence number
        setTimeout(function () { fetch(lastFetchedSeq, fetched); }, retryWait);
      } else {
        // We're done, call the callback
        utils.call(opts.complete, null, results);
      }
    };

    fetch(opts.since || 0, fetched);

    // Return a method to cancel this method from processing any more
    return {
      cancel: function () {
        opts.aborted = true;
        if (xhr) {
          xhr.abort();
        }
      }
    };
  };

  // Given a set of document/revision IDs (given by req), tets the subset of
  // those that do NOT correspond to revisions stored in the database.
  // See http://wiki.apache.org/couchdb/HttpPostRevsDiff
  api.revsDiff = utils.adapterFun('revsDif', function (req, opts, callback) {
    // If no options were given, set the callback to be the second parameter
    if (typeof opts === 'function') {
      callback = opts;
      opts = {};
    }

    // Get the missing document/revision IDs
    ajax({
      headers: host.headers,
      method: 'POST',
      url: genDBUrl(host, '_revs_diff'),
      body: req
    }, function (err, res) {
      callback(err, res);
    });
  });

  api._close = function (callback) {
    callback();
  };

  function replicateOnServer(target, opts, promise, targetHostUrl) {
    opts = utils.clone(opts);
    var targetHost = api.getHost(targetHostUrl);
    var params = {
      source: host.db,
      target: targetHost.protocol === host.protocol &&
        targetHost.authority ===
          host.authority ? targetHost.db : targetHost.source
    };

    if (opts.continuous) {
      params.continuous = true;
    }

    if (opts.create_target) {
      params.create_target = true;
    }

    if (opts.doc_ids) {
      params.doc_ids = opts.doc_ids;
    }

    if (opts.filter && typeof opts.filter === 'string') {
      params.filter = opts.filter;
    }

    if (opts.query_params) {
      params.query_params = opts.query_params;
    }

    var result = {};
    var repOpts = {
      headers: host.headers,
      method: 'POST',
      url: genUrl(host, '_replicate'),
      body: params
    };

    var xhr;
    promise.cancel = function () {
      this.cancelled = true;
      if (xhr && !result.ok) {
        xhr.abort();
      }
      if (result._local_id) {
        repOpts.body = {
          replication_id: result._local_id
        };
      }
      repOpts.body.cancel = true;
      ajax(repOpts, function (err, resp, xhr) {
        // If the replication cancel request fails, send an error to the
        // callback
        if (err) {
          return callback(err);
        }
        // Send the replication cancel result to the complete callback
        utils.call(opts.complete, null, result, xhr);
      });
    };

    if (promise.cancelled) {
      return;
    }

    xhr = ajax(repOpts, function (err, resp, xhr) {
      // If the replication fails, send an error to the callback
      if (err) {
        return callback(err);
      }

      result.ok = true;

      // Provided by CouchDB from 1.2.0 onward to cancel replication
      if (resp._local_id) {
        result._local_id = resp._local_id;
      }

      // Send the replication result to the complete callback
      utils.call(opts.complete, null, resp, xhr);
    });
  }

  api.replicateOnServer = function (target, opts, promise) {
    if (!api.taskqueue.isReady) {
      api.taskqueue.addTask('replicateOnServer', [target, opts, promise]);
      return promise;
    }
    target.info(function (err, info) {
      replicateOnServer(target, opts, promise, info.host);
    });
  };
  api.destroy = utils.adapterFun('destroy', function (callback) {
    ajax({
      url: genDBUrl(host, ''),
      method: 'DELETE',
      headers: host.headers
    }, function (err, resp) {
      if (err) {
        api.emit('error', err);
        callback(err);
      } else {
        api.emit('destroyed');
        callback(null, resp);
      }
    });
  });
}

// Delete the HttpPouch specified by the given name.
HttpPouch.destroy = utils.toPromise(function (name, opts, callback) {
  var host = getHost(name, opts);
  opts = opts || {};
  if (typeof opts === 'function') {
    callback = opts;
    opts = {};
  }
  opts = utils.clone(opts);
  opts.headers = host.headers;
  opts.method = 'DELETE';
  opts.url = genDBUrl(host, '');
  var ajaxOpts = opts.ajax || {};
  opts = utils.extend({}, opts, ajaxOpts);
  utils.ajax(opts, callback);
});

// HttpPouch is a valid adapter.
HttpPouch.valid = function () {
  return true;
};

module.exports = HttpPouch;

},{"../deps/errors":78,"../utils":89}],71:[function(require,module,exports){
(function (process,global){
'use strict';

var utils = require('../utils');
var merge = require('../merge');
var errors = require('../deps/errors');

var cachedDBs = {};
var taskQueue = {
  running: false,
  queue: []
};

function tryCode(fun, that, args) {
  try {
    fun.apply(that, args);
  } catch (err) { // shouldn't happen
    if (window.PouchDB) {
      window.PouchDB.emit('error', err);
    }
  }
}

function applyNext() {
  if (taskQueue.running || !taskQueue.queue.length) {
    return;
  }
  taskQueue.running = true;
  var item = taskQueue.queue.shift();
  item.action(function (err, res) {
    tryCode(item.callback, this, [err, res]);
    taskQueue.running = false;
    process.nextTick(applyNext);
  });
}

function idbError(callback) {
  return function (event) {
    var message = (event.target && event.target.error &&
      event.target.error.name) || event.target;
    callback(errors.error(errors.IDB_ERROR, message, event.type));
  };
}

function isModernIdb() {
  // check for outdated implementations of IDB
  // that rely on the setVersion method instead of onupgradeneeded (issue #1207)

  // cache based on appVersion, in case the browser is updated
  var cacheKey = "_pouch__checkModernIdb_" +
    (global.navigator && global.navigator.appVersion);
  var cached = utils.hasLocalStorage() && global.localStorage[cacheKey];
  if (cached) {
    return JSON.parse(cached);
  }

  var dbName = '_pouch__checkModernIdb';
  var result = global.indexedDB.open(dbName, 1).onupgradeneeded === null;

  if (global.indexedDB.deleteDatabase) {
    global.indexedDB.deleteDatabase(dbName); // db no longer needed
  }
  if (utils.hasLocalStorage()) {
    global.localStorage[cacheKey] = JSON.stringify(result); // cache
  }
  return result;
}

function IdbPouch(opts, callback) {
  var api = this;

  taskQueue.queue.push({
    action: function (thisCallback) {
      init(api, opts, thisCallback);
    },
    callback: callback
  });
  applyNext();
}

function init(api, opts, callback) {

  // IndexedDB requires a versioned database structure, so we use the
  // version here to manage migrations.
  var ADAPTER_VERSION = 2;

  // The object stores created for each database
  // DOC_STORE stores the document meta data, its revision history and state
  // Keyed by document id
  var DOC_STORE = 'document-store';
  // BY_SEQ_STORE stores a particular version of a document, keyed by its
  // sequence id
  var BY_SEQ_STORE = 'by-sequence';
  // Where we store attachments
  var ATTACH_STORE = 'attach-store';
  // Where we store database-wide meta data in a single record
  // keyed by id: META_STORE
  var META_STORE = 'meta-store';
  // Where we detect blob support
  var DETECT_BLOB_SUPPORT_STORE = 'detect-blob-support';

  var name = opts.name;

  var blobSupport = null;
  var instanceId = null;
  var idStored = false;
  var idb = null;
  var docCount = -1;

  function createSchema(db) {
    db.createObjectStore(DOC_STORE, {keyPath : 'id'})
      .createIndex('seq', 'seq', {unique: true});
    db.createObjectStore(BY_SEQ_STORE, {autoIncrement: true})
      .createIndex('_doc_id_rev', '_doc_id_rev', {unique: true});
    db.createObjectStore(ATTACH_STORE, {keyPath: 'digest'});
    db.createObjectStore(META_STORE, {keyPath: 'id', autoIncrement: false});
    db.createObjectStore(DETECT_BLOB_SUPPORT_STORE);
  }

  function addDeletedOrLocalIndex(e) {
    var docStore = e.currentTarget.transaction.objectStore(DOC_STORE);

    docStore.openCursor().onsuccess = function (event) {
      var cursor = event.target.result;
      if (cursor) {
        var metadata = cursor.value;
        var deleted = utils.isDeleted(metadata);
        var local = utils.isLocalId(metadata.id);
        metadata.deletedOrLocal = (deleted || local) ? "1" : "0";
        docStore.put(metadata);
        cursor["continue"]();
      } else {
        docStore.createIndex('deletedOrLocal',
                             'deletedOrLocal', {unique : false});
      }
    };
  }

  api.type = function () {
    return 'idb';
  };

  api._id = utils.toPromise(function (callback) {
    callback(null, instanceId);
  });

  api._bulkDocs = function idb_bulkDocs(req, opts, callback) {
    var newEdits = opts.new_edits;
    var userDocs = req.docs;
    // Parse the docs, give them a sequence number for the result
    var docInfos = userDocs.map(function (doc, i) {
      var newDoc = utils.parseDoc(doc, newEdits);
      newDoc._bulk_seq = i;
      return newDoc;
    });

    var docInfoErrors = docInfos.filter(function (docInfo) {
      return docInfo.error;
    });
    if (docInfoErrors.length) {
      return callback(docInfoErrors[0]);
    }

    var results = [];
    var fetchedDocs = {};
    var docsWritten = 0;

    function writeMetaData(e) {
      var meta = e.target.result;
      meta.updateSeq = (meta.updateSeq || 0) + docsWritten;
      txn.objectStore(META_STORE).put(meta);
    }

    function processDocs() {
      if (!docInfos.length) {
        txn.objectStore(META_STORE).get(META_STORE).onsuccess = writeMetaData;
        return;
      }
      var currentDoc = docInfos.shift();
      var id = currentDoc.metadata.id;

      if (id in fetchedDocs) {
        // if newEdits=false, can re-use the same id from this batch
        return updateDoc(fetchedDocs[id], currentDoc);
      }

      var req = txn.objectStore(DOC_STORE).get(id);
      req.onsuccess = function process_docRead(event) {
        var oldDoc = event.target.result;
        if (!oldDoc) {
          insertDoc(currentDoc);
        } else {
          updateDoc(oldDoc, currentDoc);
        }
      };
    }

    function complete(event) {
      var aresults = [];
      results.sort(sortByBulkSeq);
      results.forEach(function (result) {
        delete result._bulk_seq;
        if (result.error) {
          aresults.push(result);
          return;
        }
        var metadata = result.metadata;
        var rev = merge.winningRev(metadata);

        aresults.push({
          ok: true,
          id: metadata.id,
          rev: rev
        });

        if (utils.isLocalId(metadata.id)) {
          return;
        }
      });
      IdbPouch.Changes.notify(name);
      docCount = -1; // invalidate
      callback(null, aresults);
    }

    function preprocessAttachment(att, finish) {
      if (att.stub) {
        return finish();
      }
      if (typeof att.data === 'string') {
        var data;
        try {
          data = atob(att.data);
        } catch (e) {
          var err = errors.error(errors.BAD_ARG,
                                "Attachments need to be base64 encoded");
          return callback(err);
        }
        att.digest = 'md5-' + utils.MD5(data);
        if (blobSupport) {
          var type = att.content_type;
          data = utils.fixBinary(data);
          att.data = utils.createBlob([data], {type: type});
        }
        return finish();
      }
      var reader = new FileReader();
      reader.onloadend = function (e) {
        var binary = utils.arrayBufferToBinaryString(this.result);
        att.digest = 'md5-' + utils.MD5(binary);
        if (!blobSupport) {
          att.data = btoa(binary);
        }
        finish();
      };
      reader.readAsArrayBuffer(att.data);
    }

    function preprocessAttachments(callback) {
      if (!docInfos.length) {
        return callback();
      }

      var docv = 0;
      docInfos.forEach(function (docInfo) {
        var attachments = docInfo.data && docInfo.data._attachments ?
          Object.keys(docInfo.data._attachments) : [];

        if (!attachments.length) {
          return done();
        }

        var recv = 0;
        function attachmentProcessed() {
          recv++;
          if (recv === attachments.length) {
            done();
          }
        }

        for (var key in docInfo.data._attachments) {
          if (docInfo.data._attachments.hasOwnProperty(key)) {
            preprocessAttachment(docInfo.data._attachments[key],
                                 attachmentProcessed);
          }
        }
      });

      function done() {
        docv++;
        if (docInfos.length === docv) {
          callback();
        }
      }
    }

    function writeDoc(docInfo, winningRev, deleted, callback) {
      var err = null;
      var recv = 0;
      docInfo.data._id = docInfo.metadata.id;
      docInfo.data._rev = docInfo.metadata.rev;

      docsWritten++;

      if (deleted) {
        docInfo.data._deleted = true;
      }

      var attachments = docInfo.data._attachments ?
        Object.keys(docInfo.data._attachments) : [];

      function collectResults(attachmentErr) {
        if (!err) {
          if (attachmentErr) {
            err = attachmentErr;
            callback(err);
          } else if (recv === attachments.length) {
            finish();
          }
        }
      }

      function attachmentSaved(err) {
        recv++;
        collectResults(err);
      }

      for (var key in docInfo.data._attachments) {
        if (!docInfo.data._attachments[key].stub) {
          var data = docInfo.data._attachments[key].data;
          delete docInfo.data._attachments[key].data;
          var digest = docInfo.data._attachments[key].digest;
          saveAttachment(docInfo, digest, data, attachmentSaved);
        } else {
          recv++;
          collectResults();
        }
      }

      function finish() {

        docInfo.data._doc_id_rev = docInfo.data._id + "::" + docInfo.data._rev;
        var index = txn.objectStore(BY_SEQ_STORE).index('_doc_id_rev');

        index.getKey(docInfo.data._doc_id_rev).onsuccess = function (e) {

          var dataReq = e.target.result ?
            txn.objectStore(BY_SEQ_STORE).put(docInfo.data, e.target.result) :
            txn.objectStore(BY_SEQ_STORE).put(docInfo.data);

          dataReq.onsuccess = function (e) {
            var metadata = docInfo.metadata;
            metadata.seq = e.target.result;
            // Current _rev is calculated from _rev_tree on read
            delete metadata.rev;
            var local = utils.isLocalId(metadata.id);
            metadata.deletedOrLocal = (deleted || local) ? "1" : "0";
            metadata.winningRev = winningRev;
            var metaDataReq = txn.objectStore(DOC_STORE).put(metadata);
            metaDataReq.onsuccess = function () {
              delete metadata.deletedOrLocal;
              delete metadata.winningRev;
              results.push(docInfo);
              fetchedDocs[docInfo.metadata.id] = docInfo.metadata;
              utils.call(callback);
            };
          };
        };
      }

      if (!attachments.length) {
        finish();
      }
    }

    function updateDoc(oldDoc, docInfo) {
      var merged =
        merge.merge(oldDoc.rev_tree, docInfo.metadata.rev_tree[0], 1000);
      var wasPreviouslyDeleted = utils.isDeleted(oldDoc);
      var deleted = utils.isDeleted(docInfo.metadata);
      var inConflict = (wasPreviouslyDeleted && deleted && newEdits) ||
        (!wasPreviouslyDeleted && newEdits && merged.conflicts !== 'new_leaf');

      if (inConflict) {
        results.push(makeErr(errors.REV_CONFLICT, docInfo._bulk_seq));
        return processDocs();
      }

      docInfo.metadata.rev_tree = merged.tree;

      // recalculate
      var winningRev = merge.winningRev(docInfo.metadata);
      deleted = utils.isDeleted(docInfo.metadata, winningRev);

      writeDoc(docInfo, winningRev, deleted, processDocs);
    }

    function insertDoc(docInfo) {
      var winningRev = merge.winningRev(docInfo.metadata);
      var deleted = utils.isDeleted(docInfo.metadata, winningRev);
      // Cant insert new deleted documents
      if ('was_delete' in opts && deleted) {
        results.push(errors.MISSING_DOC);
        return processDocs();
      }

      writeDoc(docInfo, winningRev, deleted, processDocs);
    }

    // Insert sequence number into the error so we can sort later
    function makeErr(err, seq) {
      err._bulk_seq = seq;
      return err;
    }

    function saveAttachment(docInfo, digest, data, callback) {
      var objectStore = txn.objectStore(ATTACH_STORE);
      objectStore.get(digest).onsuccess = function (e) {
        var originalRefs = e.target.result && e.target.result.refs || {};
        var ref = [docInfo.metadata.id, docInfo.metadata.rev].join('@');
        var newAtt = {
          digest: digest,
          body: data,
          refs: originalRefs
        };
        newAtt.refs[ref] = true;
        objectStore.put(newAtt).onsuccess = function (e) {
          utils.call(callback);
        };
      };
    }

    var txn;
    preprocessAttachments(function () {
      txn = idb.transaction([DOC_STORE, BY_SEQ_STORE, ATTACH_STORE, META_STORE],
                            'readwrite');
      txn.onerror = idbError(callback);
      txn.ontimeout = idbError(callback);
      txn.oncomplete = complete;

      processDocs();
    });
  };

  function sortByBulkSeq(a, b) {
    return a._bulk_seq - b._bulk_seq;
  }

  // First we look up the metadata in the ids database, then we fetch the
  // current revision(s) from the by sequence store
  api._get = function idb_get(id, opts, callback) {
    var doc;
    var metadata;
    var err;
    var txn;
    opts = utils.clone(opts);
    if (opts.ctx) {
      txn = opts.ctx;
    } else {
      txn =
        idb.transaction([DOC_STORE, BY_SEQ_STORE, ATTACH_STORE], 'readonly');
    }

    function finish() {
      callback(err, {doc: doc, metadata: metadata, ctx: txn});
    }

    txn.objectStore(DOC_STORE).get(id).onsuccess = function (e) {
      metadata = e.target.result;
      // we can determine the result here if:
      // 1. there is no such document
      // 2. the document is deleted and we don't ask about specific rev
      // When we ask with opts.rev we expect the answer to be either
      // doc (possibly with _deleted=true) or missing error
      if (!metadata) {
        err = errors.MISSING_DOC;
        return finish();
      }
      if (utils.isDeleted(metadata) && !opts.rev) {
        err = errors.error(errors.MISSING_DOC, "deleted");
        return finish();
      }
      var objectStore = txn.objectStore(BY_SEQ_STORE);

      // metadata.winningRev was added later, so older DBs might not have it
      var rev = opts.rev || metadata.winningRev || merge.winningRev(metadata);
      var key = metadata.id + '::' + rev;

      objectStore.index('_doc_id_rev').get(key).onsuccess = function (e) {
        doc = e.target.result;
        if (doc && doc._doc_id_rev) {
          delete(doc._doc_id_rev);
        }
        if (!doc) {
          err = errors.MISSING_DOC;
          return finish();
        }
        finish();
      };
    };
  };

  api._getAttachment = function (attachment, opts, callback) {
    var result;
    var txn;
    opts = utils.clone(opts);
    if (opts.ctx) {
      txn = opts.ctx;
    } else {
      txn =
        idb.transaction([DOC_STORE, BY_SEQ_STORE, ATTACH_STORE], 'readonly');
    }
    var digest = attachment.digest;
    var type = attachment.content_type;

    txn.objectStore(ATTACH_STORE).get(digest).onsuccess = function (e) {
      var data = e.target.result.body;
      if (opts.encode) {
        if (blobSupport) {
          var reader = new FileReader();
          reader.onloadend = function (e) {
            var binary = utils.arrayBufferToBinaryString(this.result);
            result = btoa(binary);
            callback(null, result);
          };
          reader.readAsArrayBuffer(data);
        } else {
          result = data;
          callback(null, result);
        }
      } else {
        if (blobSupport) {
          result = data;
        } else {
          data = utils.fixBinary(atob(data));
          result = utils.createBlob([data], {type: type});
        }
        callback(null, result);
      }
    };
  };

  function allDocsQuery(totalRows, opts, callback) {
    var start = 'startkey' in opts ? opts.startkey : false;
    var end = 'endkey' in opts ? opts.endkey : false;
    var key = 'key' in opts ? opts.key : false;
    var skip = opts.skip || 0;
    var limit = typeof opts.limit === 'number' ? opts.limit : -1;
    var inclusiveEnd = opts.inclusive_end !== false;
    var descending = 'descending' in opts && opts.descending ? 'prev' : null;

    var manualDescEnd = false;
    if (descending && start && end) {
      // unfortunately IDB has a quirk where IDBKeyRange.bound is invalid if the
      // start is less than the end, even in descending mode.  Best bet
      // is just to handle it manually in that case.
      manualDescEnd = end;
      end = false;
    }

    var keyRange = null;
    try {
      if (start && end) {
        keyRange = global.IDBKeyRange.bound(start, end, false, !inclusiveEnd);
      } else if (start) {
        if (descending) {
          keyRange = global.IDBKeyRange.upperBound(start);
        } else {
          keyRange = global.IDBKeyRange.lowerBound(start);
        }
      } else if (end) {
        if (descending) {
          keyRange = global.IDBKeyRange.lowerBound(end, !inclusiveEnd);
        } else {
          keyRange = global.IDBKeyRange.upperBound(end, !inclusiveEnd);
        }
      } else if (key) {
        keyRange = global.IDBKeyRange.only(key);
      }
    } catch (e) {
      if (e.name === "DataError" && e.code === 0) {
        // data error, start is less than end
        return callback(null, {
          total_rows : totalRows,
          offset : opts.skip,
          rows : []
        });
      } else {
        return callback(errors.error(errors.IDB_ERROR, e.name, e.message));
      }
    }

    var transaction = idb.transaction([DOC_STORE, BY_SEQ_STORE], 'readonly');
    transaction.oncomplete = function () {
      callback(null, {
        total_rows: totalRows,
        offset: opts.skip,
        rows: results
      });
    };

    var oStore = transaction.objectStore(DOC_STORE);
    var oCursor = descending ? oStore.openCursor(keyRange, descending)
      : oStore.openCursor(keyRange);
    var results = [];
    oCursor.onsuccess = function (e) {
      if (!e.target.result) {
        return;
      }
      var cursor = e.target.result;
      var metadata = cursor.value;
      // metadata.winningRev added later, some dbs might be missing it
      var winningRev = metadata.winningRev || merge.winningRev(metadata);

      function allDocsInner(metadata, data) {
        if (utils.isLocalId(metadata.id)) {
          return cursor["continue"]();
        }
        var doc = {
          id: metadata.id,
          key: metadata.id,
          value: {
            rev: winningRev
          }
        };
        if (opts.include_docs) {
          doc.doc = data;
          doc.doc._rev = winningRev;
          if (doc.doc._doc_id_rev) {
            delete(doc.doc._doc_id_rev);
          }
          if (opts.conflicts) {
            doc.doc._conflicts = merge.collectConflicts(metadata);
          }
          for (var att in doc.doc._attachments) {
            if (doc.doc._attachments.hasOwnProperty(att)) {
              doc.doc._attachments[att].stub = true;
            }
          }
        }
        var deleted = utils.isDeleted(metadata, winningRev);
        if (opts.deleted === 'ok') {
          // deleted docs are okay with keys_requests
          if (deleted) {
            doc.value.deleted = true;
            doc.doc = null;
          }
          results.push(doc);
        } else if (!deleted && skip-- <= 0) {
          if (manualDescEnd) {
            if (inclusiveEnd && doc.key < manualDescEnd) {
              return;
            } else if (!inclusiveEnd && doc.key <= manualDescEnd) {
              return;
            }
          }
          results.push(doc);
          if (--limit === 0) {
            return;
          }
        }
        cursor["continue"]();
      }

      if (!opts.include_docs) {
        allDocsInner(metadata);
      } else {
        var index = transaction.objectStore(BY_SEQ_STORE).index('_doc_id_rev');
        var key = metadata.id + "::" + winningRev;
        index.get(key).onsuccess = function (event) {
          allDocsInner(cursor.value, event.target.result);
        };
      }
    };
  }

  function countDocs(callback) {
    if (docCount !== -1) {
      return callback(null, docCount);
    }

    var count;
    var txn = idb.transaction([DOC_STORE], 'readonly');
    var index = txn.objectStore(DOC_STORE).index('deletedOrLocal');
    index.count(global.IDBKeyRange.only("0")).onsuccess = function (e) {
      count = e.target.result;
    };
    txn.onerror = idbError(callback);
    txn.oncomplete = function () {
      docCount = count;
      callback(null, docCount);
    };
  }

  api._allDocs = function idb_allDocs(opts, callback) {

    // first count the total_rows
    countDocs(function (err, totalRows) {
      if (err) {
        return callback(err);
      }
      if (opts.limit === 0) {
        return callback(null, {
          total_rows : totalRows,
          offset : opts.skip,
          rows : []
        });
      }
      allDocsQuery(totalRows, opts, callback);
    });
  };

  api._info = function idb_info(callback) {

    countDocs(function (err, count) {
      if (err) {
        return callback(err);
      }
      if (idb === null) {
        var error = new Error('db isn\'t open');
        error.id = 'idbNull';
        return callback(error);
      }
      var updateSeq = 0;
      var txn = idb.transaction([META_STORE], 'readonly');

      txn.objectStore(META_STORE).get(META_STORE).onsuccess = function (e) {
        updateSeq = e.target.result && e.target.result.updateSeq || 0;
      };

      txn.oncomplete = function () {
        callback(null, {
          db_name: name,
          doc_count: count,
          update_seq: updateSeq
        });
      };
    });
  };

  api._changes = function (opts) {
    opts = utils.clone(opts);

    if (opts.continuous) {
      var id = name + ':' + utils.uuid();
      IdbPouch.Changes.addListener(name, id, api, opts);
      IdbPouch.Changes.notify(name);
      return {
        cancel: function () {
          IdbPouch.Changes.removeListener(name, id);
        }
      };
    }

    var descending = opts.descending ? 'prev' : null;
    var lastSeq = 0;

    // Ignore the `since` parameter when `descending` is true
    opts.since = opts.since && !descending ? opts.since : 0;

    var limit = 'limit' in opts ? opts.limit : -1;
    if (limit === 0) {
      limit = 1; // per CouchDB _changes spec
    }
    var returnDocs;
    if ('returnDocs' in opts) {
      returnDocs = opts.returnDocs;
    } else {
      returnDocs = true;
    }

    var results = [];
    var numResults = 0;
    var filter = utils.filterChange(opts);

    var txn;

    function fetchChanges() {
      txn = idb.transaction([DOC_STORE, BY_SEQ_STORE]);
      txn.oncomplete = onTxnComplete;

      var req;

      if (descending) {
        req = txn.objectStore(BY_SEQ_STORE)
            .openCursor(global.IDBKeyRange.lowerBound(opts.since, true),
                        descending);
      } else {
        req = txn.objectStore(BY_SEQ_STORE)
            .openCursor(global.IDBKeyRange.lowerBound(opts.since, true));
      }

      req.onsuccess = onsuccess;
      req.onerror = onerror;
    }

    fetchChanges();

    function onsuccess(event) {
      var cursor = event.target.result;

      if (!cursor) {
        return;
      }

      var doc = cursor.value;

      if (utils.isLocalId(doc._id) ||
          (opts.doc_ids && opts.doc_ids.indexOf(doc._id) === -1)) {
        return cursor["continue"]();
      }

      var index = txn.objectStore(DOC_STORE);
      index.get(doc._id).onsuccess = function (event) {
        var metadata = event.target.result;

        if (lastSeq < metadata.seq) {
          lastSeq = metadata.seq;
        }
        // metadata.winningRev was only added later
        var winningRev = metadata.winningRev || merge.winningRev(metadata);
        if (doc._rev !== winningRev) {
          return cursor["continue"]();
        }

        delete doc['_doc_id_rev'];

        var change = opts.processChange(doc, metadata, opts);
        change.seq = cursor.key;
        if (filter(change)) {
          numResults++;
          if (returnDocs) {
            results.push(change);
          }
          opts.onChange(change);
        }
        if (numResults !== limit) {
          cursor["continue"]();
        }
      };
    }

    function onTxnComplete() {
      if (!opts.continuous) {
        opts.complete(null, {
          results: results,
          last_seq: lastSeq
        });
      }
    }
  };

  api._close = function (callback) {
    if (idb === null) {
      return callback(errors.NOT_OPEN);
    }

    // https://developer.mozilla.org/en-US/docs/IndexedDB/IDBDatabase#close
    // "Returns immediately and closes the connection in a separate thread..."
    idb.close();
    delete cachedDBs[name];
    idb = null;
    callback();
  };

  api._getRevisionTree = function (docId, callback) {
    var txn = idb.transaction([DOC_STORE], 'readonly');
    var req = txn.objectStore(DOC_STORE).get(docId);
    req.onsuccess = function (event) {
      var doc = event.target.result;
      if (!doc) {
        callback(errors.MISSING_DOC);
      } else {
        callback(null, doc.rev_tree);
      }
    };
  };

  // This function removes revisions of document docId
  // which are listed in revs and sets this document
  // revision to to rev_tree
  api._doCompaction = function (docId, rev_tree, revs, callback) {
    var txn = idb.transaction([DOC_STORE, BY_SEQ_STORE], 'readwrite');

    var index = txn.objectStore(DOC_STORE);
    index.get(docId).onsuccess = function (event) {
      var metadata = event.target.result;
      metadata.rev_tree = rev_tree;

      var count = revs.length;
      revs.forEach(function (rev) {
        var index = txn.objectStore(BY_SEQ_STORE).index('_doc_id_rev');
        var key = docId + "::" + rev;
        index.getKey(key).onsuccess = function (e) {
          var seq = e.target.result;
          if (!seq) {
            return;
          }
          txn.objectStore(BY_SEQ_STORE)['delete'](seq);

          count--;
          if (!count) {
            txn.objectStore(DOC_STORE).put(metadata);
          }
        };
      });
    };
    txn.oncomplete = function () {
      utils.call(callback);
    };
  };

  var cached = cachedDBs[name];

  if (cached) {
    idb = cached.idb;
    blobSupport = cached.blobSupport;
    instanceId = cached.instanceId;
    idStored = cached.idStored;
    process.nextTick(function () {
      callback(null, api);
    });
    return;
  }

  var req = global.indexedDB.open(name, ADAPTER_VERSION);

  if (!('openReqList' in IdbPouch)) {
    IdbPouch.openReqList = {};
  }
  IdbPouch.openReqList[name] = req;

  req.onupgradeneeded = function (e) {
    var db = e.target.result;
    if (e.oldVersion < 1) {
      // initial schema
      createSchema(db);
    }
    if (e.oldVersion < 2) {
      // version 2 adds the deletedOrLocal index
      addDeletedOrLocalIndex(e);
    }
  };

  req.onsuccess = function (e) {

    idb = e.target.result;

    idb.onversionchange = function () {
      idb.close();
      delete cachedDBs[name];
    };
    idb.onabort = function () {
      idb.close();
      delete cachedDBs[name];
    };

    var txn = idb.transaction([META_STORE, DETECT_BLOB_SUPPORT_STORE],
      'readwrite');

    var req = txn.objectStore(META_STORE).get(META_STORE);

    req.onsuccess = function (e) {

      var checkSetupComplete = function () {
        if (blobSupport === null || !idStored) {
          return;
        } else {
          cachedDBs[name] = {
            idb: idb,
            blobSupport: blobSupport,
            instanceId: instanceId,
            idStored: idStored,
            loaded: true
          };
          callback(null, api);
        }
      };

      var meta = e.target.result || {id: META_STORE};
      if (name  + '_id' in meta) {
        instanceId = meta[name + '_id'];
        idStored = true;
        checkSetupComplete();
      } else {
        instanceId = utils.uuid();
        meta[name + '_id'] = instanceId;
        txn.objectStore(META_STORE).put(meta).onsuccess = function () {
          idStored = true;
          checkSetupComplete();
        };
      }

      // detect blob support
      try {
        txn.objectStore(DETECT_BLOB_SUPPORT_STORE).put(utils.createBlob(),
          "key");
        blobSupport = true;
      } catch (err) {
        blobSupport = false;
      } finally {
        checkSetupComplete();
      }
    };
  };

  req.onerror = idbError(callback);

}

IdbPouch.valid = function () {
  return global.indexedDB && isModernIdb();
};

function destroy(name, opts, callback) {
  if (!('openReqList' in IdbPouch)) {
    IdbPouch.openReqList = {};
  }
  IdbPouch.Changes.removeAllListeners(name);

  //Close open request for "name" database to fix ie delay.
  if (IdbPouch.openReqList[name] && IdbPouch.openReqList[name].result) {
    IdbPouch.openReqList[name].result.close();
  }
  var req = global.indexedDB.deleteDatabase(name);

  req.onsuccess = function () {
    //Remove open request from the list.
    if (IdbPouch.openReqList[name]) {
      IdbPouch.openReqList[name] = null;
    }
    if (utils.hasLocalStorage()) {
      delete global.localStorage[name];
    }
    delete cachedDBs[name];
    callback(null, { 'ok': true });
  };

  req.onerror = idbError(callback);
}

IdbPouch.destroy = utils.toPromise(function (name, opts, callback) {
  taskQueue.queue.push({
    action: function (thisCallback) {
      destroy(name, opts, thisCallback);
    },
    callback: callback
  });
  applyNext();
});

IdbPouch.Changes = new utils.Changes();

module.exports = IdbPouch;

}).call(this,require("JkpR2F"),typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"../deps/errors":78,"../merge":84,"../utils":89,"JkpR2F":59}],72:[function(require,module,exports){
module.exports = ['idb', 'websql'];
},{}],73:[function(require,module,exports){
(function (global){
'use strict';

var utils = require('../utils');
var merge = require('../merge');
var errors = require('../deps/errors');
function quote(str) {
  return "'" + str + "'";
}

var cachedDatabases = {};

var openDB = utils.getArguments(function (args) {
  if (typeof global !== 'undefined') {
    if (global.navigator && global.navigator.sqlitePlugin &&
        global.navigator.sqlitePlugin.openDatabase) {
      return navigator.sqlitePlugin.openDatabase
        .apply(navigator.sqlitePlugin, args);
    } else if (global.sqlitePlugin && global.sqlitePlugin.openDatabase) {
      return global.sqlitePlugin.openDatabase
        .apply(global.sqlitePlugin, args);
    } else {
      var db = cachedDatabases[args[0]];
      if (!db) {
        db = cachedDatabases[args[0]] =
          global.openDatabase.apply(global, args);
      }
      return db;
    }
  }
});

var POUCH_VERSION = 1;
var POUCH_SIZE = 0; // doesn't matter as long as it's <= 5000000
var ADAPTER_VERSION = 2; // used to manage migrations

// The object stores created for each database
// DOC_STORE stores the document meta data, its revision history and state
var DOC_STORE = quote('document-store');
// BY_SEQ_STORE stores a particular version of a document, keyed by its
// sequence id
var BY_SEQ_STORE = quote('by-sequence');
// Where we store attachments
var ATTACH_STORE = quote('attach-store');
var META_STORE = quote('metadata-store');

// these indexes cover the ground for most allDocs queries
var BY_SEQ_STORE_DELETED_INDEX_SQL =
  'CREATE INDEX IF NOT EXISTS \'by-seq-deleted-idx\' ON ' +
  BY_SEQ_STORE + ' (seq, deleted)';
var DOC_STORE_LOCAL_INDEX_SQL =
  'CREATE INDEX IF NOT EXISTS \'doc-store-local-idx\' ON ' +
  DOC_STORE + ' (local, id)';
var DOC_STORE_WINNINGSEQ_INDEX_SQL =
  'CREATE INDEX IF NOT EXISTS \'doc-winningseq-idx\' ON ' +
  DOC_STORE + ' (winningseq)';

var DOC_STORE_AND_BY_SEQ_JOINER = BY_SEQ_STORE +
  '.seq = ' + DOC_STORE + '.winningseq';

var SELECT_DOCS = BY_SEQ_STORE + '.seq AS seq, ' +
  BY_SEQ_STORE + '.deleted AS deleted, ' +
  BY_SEQ_STORE + '.json AS data, ' +
  DOC_STORE + '.json AS metadata';

function select(selector, table, joiner, where, orderBy) {
  return 'SELECT ' + selector + ' FROM ' +
    (typeof table === 'string' ? table : table.join(' JOIN ')) +
    (joiner ? (' ON ' + joiner) : '') +
    (where ? (' WHERE ' +
      (typeof where === 'string' ? where : where.join(' AND '))) : '') +
    (orderBy ? (' ORDER BY ' + orderBy) : '');
}

function unknownError(callback) {
  return function (event) {
    // event may actually be a SQLError object, so report is as such
    var errorNameMatch = event && event.constructor.toString()
      .match(/function ([^\(]+)/);
    var errorName = (errorNameMatch && errorNameMatch[1]) || event.type;
    var errorReason = event.target || event.message;
    callback(errors.error(errors.WSQ_ERROR, errorReason, errorName));
  };
}
function decodeUtf8(str) {
  return decodeURIComponent(window.escape(str));
}
function parseHexString(str, encoding) {
  var result = '';
  var charWidth = encoding === 'UTF-8' ? 2 : 4;
  for (var i = 0, len = str.length; i < len; i += charWidth) {
    var substring = str.substring(i, i + charWidth);
    if (charWidth === 4) { // UTF-16, twiddle the bits
      substring = substring.substring(2, 4) + substring.substring(0, 2);
    }
    result += String.fromCharCode(parseInt(substring, 16));
  }
  result = encoding === 'UTF-8' ? decodeUtf8(result) : result;
  return result;
}

function WebSqlPouch(opts, callback) {
  var api = this;
  var instanceId = null;
  var name = opts.name;
  var idRequests = [];
  var docCount = -1; // cache sqlite count(*) for performance
  var encoding;

  var db = openDB(name, POUCH_VERSION, name, POUCH_SIZE);
  if (!db) {
    return callback(errors.UNKNOWN_ERROR);
  } else if (typeof db.readTransaction !== 'function') {
    // doesn't exist in sqlite plugin
    db.readTransaction = db.transaction;
  }

  function dbCreated() {
    // note the db name in case the browser upgrades to idb
    if (utils.hasLocalStorage()) {
      global.localStorage['_pouch__websqldb_' + name] = true;
    }
    callback(null, api);
  }

  // In this migration, we added the 'deleted' and 'local' columns to the
  // by-seq and doc store tables.
  // To preserve existing user data, we re-process all the existing JSON
  // and add these values.
  // Called migration2 because it corresponds to adapter version (db_version) #2
  function runMigration2(tx) {
    // index used for the join in the allDocs query
    tx.executeSql(DOC_STORE_WINNINGSEQ_INDEX_SQL);

    tx.executeSql('ALTER TABLE ' + BY_SEQ_STORE +
      ' ADD COLUMN deleted TINYINT(1) DEFAULT 0', [], function () {
      tx.executeSql(BY_SEQ_STORE_DELETED_INDEX_SQL);
      tx.executeSql('ALTER TABLE ' + DOC_STORE +
        ' ADD COLUMN local TINYINT(1) DEFAULT 0', [], function () {
        tx.executeSql(DOC_STORE_LOCAL_INDEX_SQL);

        var sql = 'SELECT ' + DOC_STORE + '.winningseq AS seq, ' + DOC_STORE +
          '.json AS metadata FROM ' + BY_SEQ_STORE + ' JOIN ' + DOC_STORE +
          ' ON ' + BY_SEQ_STORE + '.seq = ' + DOC_STORE + '.winningseq';

        tx.executeSql(sql, [], function (tx, result) {

          var deleted = [];
          var local = [];

          for (var i = 0; i < result.rows.length; i++) {
            var item = result.rows.item(i);
            var seq = item.seq;
            var metadata = JSON.parse(item.metadata);
            if (utils.isDeleted(metadata)) {
              deleted.push(seq);
            }
            if (utils.isLocalId(metadata.id)) {
              local.push(metadata.id);
            }
          }

          tx.executeSql('UPDATE ' + DOC_STORE + 'SET local = 1 WHERE id IN (' +
            local.map(function () {
            return '?';
          }).join(',') + ')', local);
          tx.executeSql('UPDATE ' + BY_SEQ_STORE +
            ' SET deleted = 1 WHERE seq IN (' + deleted.map(function () {
            return '?';
          }).join(',') + ')', deleted);
        });
      });
    });
  }

  function onGetInstanceId(tx) {
    while (idRequests.length > 0) {
      var idCallback = idRequests.pop();
      idCallback(null, instanceId);
    }
    checkDbEncoding(tx);
  }

  function checkDbEncoding(tx) {
    // check db encoding - utf-8 (chrome, opera) or utf-16 (safari)?
    tx.executeSql('SELECT dbid, hex(dbid) AS hexId FROM ' + META_STORE, [],
      function (err, result) {
        var id = result.rows.item(0).dbid;
        var hexId = result.rows.item(0).hexId;
        encoding = (hexId.length === id.length * 2) ? 'UTF-8' : 'UTF-16';
      }
    );
  }

  function onGetVersion(tx, dbVersion) {
    if (dbVersion === 0) {
      // initial schema

      var meta = 'CREATE TABLE IF NOT EXISTS ' + META_STORE +
        ' (update_seq, dbid, db_version INTEGER)';
      var attach = 'CREATE TABLE IF NOT EXISTS ' + ATTACH_STORE +
        ' (digest, json, body BLOB)';
      var doc = 'CREATE TABLE IF NOT EXISTS ' + DOC_STORE +
        ' (id unique, json, winningseq, local TINYINT(1))';
      var seq = 'CREATE TABLE IF NOT EXISTS ' + BY_SEQ_STORE +
        ' (seq INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT, ' +
        'doc_id_rev UNIQUE, json, deleted TINYINT(1))';

      // creates
      tx.executeSql(attach);
      tx.executeSql(doc, [], function () {
        tx.executeSql(DOC_STORE_WINNINGSEQ_INDEX_SQL);
        tx.executeSql(DOC_STORE_LOCAL_INDEX_SQL);
      });
      tx.executeSql(seq, [], function () {
        tx.executeSql(BY_SEQ_STORE_DELETED_INDEX_SQL);
      });
      tx.executeSql(meta, [], function () {
        // mark the update_seq, db version, and new dbid
        var initSeq = 'INSERT INTO ' + META_STORE +
          ' (update_seq, db_version, dbid) VALUES (?, ?, ?)';
        instanceId = utils.uuid();
        tx.executeSql(initSeq, [0, ADAPTER_VERSION, instanceId]);
        onGetInstanceId(tx);
      });
    } else { // version > 0

      if (dbVersion === 1) {
        runMigration2(tx);
        // mark the db version within this transaction
        tx.executeSql('UPDATE ' + META_STORE + ' SET db_version = ' +
                      ADAPTER_VERSION);
      } // in the future, add more migrations here

      // notify db.id() callers
      tx.executeSql('SELECT dbid FROM ' + META_STORE, [],
                    function (tx, result) {
        instanceId = result.rows.item(0).dbid;
        onGetInstanceId(tx);
      });
    }
  }

  function setup() {

    db.transaction(function (tx) {
      // first get the version
      tx.executeSql('SELECT sql FROM sqlite_master WHERE tbl_name = ' +
                    META_STORE, [], function (tx, result) {
        if (!result.rows.length) {
          // database hasn't even been created yet (version 0)
          onGetVersion(tx, 0);
        } else if (!/db_version/.test(result.rows.item(0).sql)) {
          // table was created, but without the new db_version column,
          // so add it.
          tx.executeSql('ALTER TABLE ' + META_STORE +
            ' ADD COLUMN db_version INTEGER', [], function () {
            // before version 2, this column didn't even exist
            onGetVersion(tx, 1);
          });
        } else { // column exists, we can safely get it
          tx.executeSql('SELECT db_version FROM ' + META_STORE, [],
            function (tx, result) {
            var dbVersion = result.rows.item(0).db_version;
            onGetVersion(tx, dbVersion);
          });
        }
      });
    }, unknownError(callback), dbCreated);
  }

  if (utils.isCordova() && typeof global !== 'undefined') {
    //to wait until custom api is made in pouch.adapters before doing setup
    global.addEventListener(name + '_pouch', function cordova_init() {
      global.removeEventListener(name + '_pouch', cordova_init, false);
      setup();
    }, false);
  } else {
    setup();
  }

  api.type = function () {
    return 'websql';
  };

  api._id = utils.toPromise(function (callback) {
    callback(null, instanceId);
  });

  api._info = function (callback) {
    db.readTransaction(function (tx) {
      countDocs(tx, function (docCount) {
        var sql = 'SELECT update_seq FROM ' + META_STORE;
        tx.executeSql(sql, [], function (tx, result) {
          var updateSeq = result.rows.item(0).update_seq;
          callback(null, {
            db_name: name,
            doc_count: docCount,
            update_seq: updateSeq
          });
        });
      });
    }, unknownError(callback));
  };

  api._bulkDocs = function (req, opts, callback) {

    var newEdits = opts.new_edits;
    var userDocs = req.docs;
    var docsWritten = 0;

    // Parse the docs, give them a sequence number for the result
    var docInfos = userDocs.map(function (doc, i) {
      var newDoc = utils.parseDoc(doc, newEdits);
      newDoc._bulk_seq = i;
      return newDoc;
    });

    var docInfoErrors = docInfos.filter(function (docInfo) {
      return docInfo.error;
    });
    if (docInfoErrors.length) {
      return callback(docInfoErrors[0]);
    }

    var tx;
    var results = [];
    var fetchedDocs = {};

    function sortByBulkSeq(a, b) {
      return a._bulk_seq - b._bulk_seq;
    }

    function complete(event) {
      var aresults = [];
      results.sort(sortByBulkSeq);
      results.forEach(function (result) {
        delete result._bulk_seq;
        if (result.error) {
          aresults.push(result);
          return;
        }
        var metadata = result.metadata;
        var rev = merge.winningRev(metadata);

        aresults.push({
          ok: true,
          id: metadata.id,
          rev: rev
        });

        if (utils.isLocalId(metadata.id)) {
          return;
        }

        docsWritten++;

      });
      WebSqlPouch.Changes.notify(name);

      var updateseq = 'SELECT update_seq FROM ' + META_STORE;
      tx.executeSql(updateseq, [], function (tx, result) {
        var update_seq = result.rows.item(0).update_seq + docsWritten;
        var sql = 'UPDATE ' + META_STORE + ' SET update_seq=?';
        tx.executeSql(sql, [update_seq], function () {
          callback(null, aresults);
        });
      });
    }

    function preprocessAttachment(att, finish) {
      if (att.stub) {
        return finish();
      }
      if (typeof att.data === 'string') {
        try {
          att.data = atob(att.data);
        } catch (e) {
          var err = errors.error(errors.BAD_ARG,
                                "Attachments need to be base64 encoded");
          return callback(err);
        }
        var data = utils.fixBinary(att.data);
        att.data = utils.createBlob([data], {type: att.content_type});
      }
      var reader = new FileReader();
      reader.onloadend = function (e) {
        var binary = utils.arrayBufferToBinaryString(this.result);
        att.data = binary;
        att.digest = 'md5-' + utils.MD5(binary);
        finish();
      };
      reader.readAsArrayBuffer(att.data);
    }

    function preprocessAttachments(callback) {
      if (!docInfos.length) {
        return callback();
      }

      var docv = 0;

      docInfos.forEach(function (docInfo) {
        var attachments = docInfo.data && docInfo.data._attachments ?
          Object.keys(docInfo.data._attachments) : [];
        var recv = 0;

        if (!attachments.length) {
          return done();
        }

        function processedAttachment() {
          recv++;
          if (recv === attachments.length) {
            done();
          }
        }

        for (var key in docInfo.data._attachments) {
          if (docInfo.data._attachments.hasOwnProperty(key)) {
            preprocessAttachment(docInfo.data._attachments[key],
                                 processedAttachment);
          }
        }
      });

      function done() {
        docv++;
        if (docInfos.length === docv) {
          callback();
        }
      }
    }

    function writeDoc(docInfo, winningRev, deleted, callback, isUpdate) {

      function finish() {
        var data = docInfo.data;
        var doc_id_rev = data._id + "::" + data._rev;
        var deletedInt = deleted ? 1 : 0;
        var fetchSql = select('seq', BY_SEQ_STORE, null, 'doc_id_rev=?');

        tx.executeSql(fetchSql, [doc_id_rev], function (err, res) {
          var sql, sqlArgs;
          if (res.rows.length) {
            sql = 'UPDATE ' + BY_SEQ_STORE +
              ' SET json=?, deleted=? WHERE doc_id_rev=?;';
            sqlArgs = [JSON.stringify(data), deletedInt, doc_id_rev];
            tx.executeSql(sql, sqlArgs, function (tx) {
              dataWritten(tx, res.rows.item(0).seq);
            });
          } else {
            sql = 'INSERT INTO ' + BY_SEQ_STORE +
              ' (doc_id_rev, json, deleted) VALUES (?, ?, ?);';
            sqlArgs = [doc_id_rev, JSON.stringify(data), deletedInt];
            tx.executeSql(sql, sqlArgs, function (tx, result) {
              dataWritten(tx, result.insertId);
            });
          }
        });
      }

      function collectResults(attachmentErr) {
        if (!err) {
          if (attachmentErr) {
            err = attachmentErr;
            callback(err);
          } else if (recv === attachments.length) {
            finish();
          }
        }
      }

      var err = null;
      var recv = 0;

      docInfo.data._id = docInfo.metadata.id;
      docInfo.data._rev = docInfo.metadata.rev;

      if (deleted) {
        docInfo.data._deleted = true;
      }

      var attachments = docInfo.data._attachments ?
        Object.keys(docInfo.data._attachments) : [];

      function attachmentSaved(err) {
        recv++;
        collectResults(err);
      }

      for (var key in docInfo.data._attachments) {
        if (!docInfo.data._attachments[key].stub) {
          var data = docInfo.data._attachments[key].data;
          delete docInfo.data._attachments[key].data;
          var digest = docInfo.data._attachments[key].digest;
          saveAttachment(docInfo, digest, data, attachmentSaved);
        } else {
          recv++;
          collectResults();
        }
      }

      if (!attachments.length) {
        finish();
      }

      function dataWritten(tx, seq) {
        docInfo.metadata.seq = seq;
        delete docInfo.metadata.rev;

        var sql = isUpdate ?
          'UPDATE ' + DOC_STORE +
          ' SET json=?, winningseq=(SELECT seq FROM ' + BY_SEQ_STORE +
          ' WHERE doc_id_rev=?) WHERE id=?'
          : 'INSERT INTO ' + DOC_STORE +
          ' (id, winningseq, json, local) VALUES (?, ?, ?, ?);';
        var metadataStr = JSON.stringify(docInfo.metadata);
        var key = docInfo.metadata.id + "::" + winningRev;
        var local = utils.isLocalId(docInfo.metadata.id) ? 1 : 0;
        var params = isUpdate ?
          [metadataStr, key, docInfo.metadata.id] :
          [docInfo.metadata.id, seq, metadataStr, local];
        tx.executeSql(sql, params, function () {
          results.push(docInfo);
          fetchedDocs[docInfo.metadata.id] = docInfo.metadata;
          callback();
        });
      }
    }

    function updateDoc(oldDoc, docInfo) {
      var merged =
        merge.merge(oldDoc.rev_tree, docInfo.metadata.rev_tree[0], 1000);
      var deleted = utils.isDeleted(docInfo.metadata);
      var oldDocDeleted = utils.isDeleted(oldDoc);
      var inConflict = (oldDocDeleted && deleted && newEdits) ||
        (!oldDocDeleted && newEdits && merged.conflicts !== 'new_leaf');
      if (inConflict) {
        results.push(makeErr(errors.REV_CONFLICT, docInfo._bulk_seq));
        return processDocs();
      }

      docInfo.metadata.rev_tree = merged.tree;

      // recalculate
      var winningRev = merge.winningRev(docInfo.metadata);
      deleted = utils.isDeleted(docInfo.metadata, winningRev);

      writeDoc(docInfo, winningRev, deleted, processDocs, true);
    }

    function insertDoc(docInfo) {
      // Cant insert new deleted documents
      var winningRev = merge.winningRev(docInfo.metadata);
      var deleted = utils.isDeleted(docInfo.metadata, winningRev);
      if ('was_delete' in opts && deleted) {
        results.push(errors.MISSING_DOC);
        return processDocs();
      }
      writeDoc(docInfo, winningRev, deleted, processDocs, false);
    }

    function processDocs() {
      if (!docInfos.length) {
        return complete();
      }
      var currentDoc = docInfos.shift();
      var id = currentDoc.metadata.id;

      if (id in fetchedDocs) {
        // if newEdits=false, can re-use the same id from this batch
        return updateDoc(fetchedDocs[id], currentDoc);
      }

      tx.executeSql('SELECT json FROM ' + DOC_STORE +
        ' WHERE id = ?', [id], function (tx, result) {

        if (result.rows.length) {
          var metadata = JSON.parse(result.rows.item(0).json);
          updateDoc(metadata, currentDoc);
        } else {
          insertDoc(currentDoc);
        }
      });
    }

    // Insert sequence number into the error so we can sort later
    function makeErr(err, seq) {
      err._bulk_seq = seq;
      return err;
    }

    function saveAttachment(docInfo, digest, data, callback) {
      var ref = [docInfo.metadata.id, docInfo.metadata.rev].join('@');
      var newAtt = {digest: digest};
      var sql = 'SELECT digest, json FROM ' + ATTACH_STORE + ' WHERE digest=?';
      tx.executeSql(sql, [digest], function (tx, result) {
        if (!result.rows.length) {
          newAtt.refs = {};
          newAtt.refs[ref] = true;
          sql = 'INSERT INTO ' + ATTACH_STORE +
                '(digest, json, body) VALUES (?, ?, ?)';
          tx.executeSql(sql, [digest, JSON.stringify(newAtt), data],
            function () {
            callback();
          });
        } else {
          newAtt.refs = JSON.parse(result.rows.item(0).json).refs;
          sql = 'UPDATE ' + ATTACH_STORE + ' SET json=?, body=? WHERE digest=?';
          tx.executeSql(sql, [JSON.stringify(newAtt), data, digest],
            function () {
            callback();
          });
        }
      });
    }

    preprocessAttachments(function () {
      db.transaction(function (txn) {
        tx = txn;
        processDocs();
      }, unknownError(callback), function () {
        docCount = -1;
      });
    });
  };

  api._get = function (id, opts, callback) {
    opts = utils.clone(opts);
    var doc;
    var metadata;
    var err;
    if (!opts.ctx) {
      db.readTransaction(function (txn) {
        opts.ctx = txn;
        api._get(id, opts, callback);
      });
      return;
    }
    var tx = opts.ctx;

    function finish() {
      callback(err, {doc: doc, metadata: metadata, ctx: tx});
    }

    var sql;
    var sqlArgs;
    if (opts.rev) {
      sql = select(
        SELECT_DOCS,
        [DOC_STORE, BY_SEQ_STORE],
        null,
        [BY_SEQ_STORE + '.doc_id_rev=?', DOC_STORE + '.id=?']);
      sqlArgs = [id + '::' + opts.rev, id];
    } else {
      sql = select(
        SELECT_DOCS,
        [DOC_STORE, BY_SEQ_STORE],
        DOC_STORE_AND_BY_SEQ_JOINER,
        DOC_STORE + '.id=?');
      sqlArgs = [id];
    }
    tx.executeSql(sql, sqlArgs, function (a, results) {
      if (!results.rows.length) {
        err = errors.MISSING_DOC;
        return finish();
      }
      var item = results.rows.item(0);
      metadata = JSON.parse(item.metadata);
      if (item.deleted && !opts.rev) {
        err = errors.error(errors.MISSING_DOC, 'deleted');
        return finish();
      }
      doc = JSON.parse(item.data);
      finish();
    });
  };

  function countDocs(tx, callback) {

    if (docCount !== -1) {
      return callback(docCount);
    }

    // count the total rows
    var sql = select(
      'COUNT(' + DOC_STORE + '.id) AS \'num\'',
      [DOC_STORE, BY_SEQ_STORE],
      DOC_STORE_AND_BY_SEQ_JOINER,
      [BY_SEQ_STORE + '.deleted=0', DOC_STORE + '.local=0']);

    tx.executeSql(sql, [], function (tx, result) {
      docCount = result.rows.item(0).num;
      callback(docCount);
    });
  }

  api._allDocs = function (opts, callback) {
    var results = [];
    var totalRows;

    var start = 'startkey' in opts ? opts.startkey : false;
    var end = 'endkey' in opts ? opts.endkey : false;
    var key = 'key' in opts ? opts.key : false;
    var descending = 'descending' in opts ? opts.descending : false;
    var limit = 'limit' in opts ? opts.limit : -1;
    var offset = 'skip' in opts ? opts.skip : 0;
    var inclusiveEnd = opts.inclusive_end !== false;

    var sqlArgs = [];
    var criteria = [DOC_STORE + '.local = 0'];

    if (key !== false) {
      criteria.push(DOC_STORE + '.id = ?');
      sqlArgs.push(key);
    } else if (start !== false || end !== false) {
      if (start !== false) {
        criteria.push(DOC_STORE + '.id ' + (descending ? '<=' : '>=') + ' ?');
        sqlArgs.push(start);
      }
      if (end !== false) {
        var comparator = descending ? '>' : '<';
        if (inclusiveEnd) {
          comparator += '=';
        }
        criteria.push(DOC_STORE + '.id ' + comparator + ' ?');
        sqlArgs.push(end);
      }
      if (key !== false) {
        criteria.push(DOC_STORE + '.id = ?');
        sqlArgs.push(key);
      }
    }

    if (opts.deleted !== 'ok') {
      // report deleted if keys are specified
      criteria.push(BY_SEQ_STORE + '.deleted = 0');
    }

    db.readTransaction(function (tx) {

      // first count up the total rows
      countDocs(tx, function (count) {
        totalRows = count;

        if (limit === 0) {
          return;
        }

        // then actually fetch the documents
        var sql = select(
          SELECT_DOCS,
          [DOC_STORE, BY_SEQ_STORE],
          DOC_STORE_AND_BY_SEQ_JOINER,
          criteria,
          DOC_STORE + '.id ' + (descending ? 'DESC' : 'ASC')
          );
        sql += ' LIMIT ' + limit + ' OFFSET ' + offset;

        tx.executeSql(sql, sqlArgs, function (tx, result) {
          for (var i = 0, l = result.rows.length; i < l; i++) {
            var item = result.rows.item(i);
            var metadata = JSON.parse(item.metadata);
            var data = JSON.parse(item.data);
            var winningRev = data._rev;
            var doc = {
              id: metadata.id,
              key: metadata.id,
              value: {rev: winningRev}
            };
            if (opts.include_docs) {
              doc.doc = data;
              doc.doc._rev = winningRev;
              if (opts.conflicts) {
                doc.doc._conflicts = merge.collectConflicts(metadata);
              }
              for (var att in doc.doc._attachments) {
                if (doc.doc._attachments.hasOwnProperty(att)) {
                  doc.doc._attachments[att].stub = true;
                }
              }
            }
            if (item.deleted) {
              if (opts.deleted === 'ok') {
                doc.value.deleted = true;
                doc.doc = null;
              } else {
                continue;
              }
            }
            results.push(doc);
          }
        });
      });
    }, unknownError(callback), function () {
      callback(null, {
        total_rows: totalRows,
        offset: opts.skip,
        rows: results
      });
    });
  };

  api._changes = function (opts) {
    opts = utils.clone(opts);

    if (opts.continuous) {
      var id = name + ':' + utils.uuid();
      WebSqlPouch.Changes.addListener(name, id, api, opts);
      WebSqlPouch.Changes.notify(name);
      return {
        cancel: function () {
          WebSqlPouch.Changes.removeListener(name, id);
        }
      };
    }

    var descending = opts.descending;

    // Ignore the `since` parameter when `descending` is true
    opts.since = opts.since && !descending ? opts.since : 0;

    var limit = 'limit' in opts ? opts.limit : -1;
    if (limit === 0) {
      limit = 1; // per CouchDB _changes spec
    }

    var returnDocs;
    if ('returnDocs' in opts) {
      returnDocs = opts.returnDocs;
    } else {
      returnDocs = true;
    }
    var results = [];
    var numResults = 0;
    function fetchChanges() {

      var criteria = [
        DOC_STORE + '.winningseq > ' + opts.since,
        DOC_STORE + '.local = 0'
      ];
      var sqlArgs = [];
      if (opts.doc_ids) {
        criteria.push(DOC_STORE + '.id IN (' + opts.doc_ids.map(function () {
          return '?';
        }).join(',') + ')');
        sqlArgs = opts.doc_ids;
      }

      var sql = select(SELECT_DOCS, [DOC_STORE, BY_SEQ_STORE],
        DOC_STORE_AND_BY_SEQ_JOINER, criteria,
        DOC_STORE + '.winningseq ' + (descending ? 'DESC' : 'ASC'));

      var filter = utils.filterChange(opts);
      if (!opts.view && !opts.filter) {
        // we can just limit in the query
        sql += ' LIMIT ' + limit;
      }

      db.readTransaction(function (tx) {
        tx.executeSql(sql, sqlArgs, function (tx, result) {
          var lastSeq = 0;
          for (var i = 0, l = result.rows.length; i < l; i++) {
            var res = result.rows.item(i);
            var metadata = JSON.parse(res.metadata);
            if (lastSeq < res.seq) {
              lastSeq = res.seq;
            }
            var doc = JSON.parse(res.data);
            var change = opts.processChange(doc, metadata, opts);
            change.seq = res.seq;
            if (filter(change)) {
              numResults++;
              if (returnDocs) {
                results.push(change);
              }
              opts.onChange(change);
            }
            if (numResults === limit) {
              break;
            }
          }
          if (!opts.continuous) {
            opts.complete(null, {
              results: results,
              last_seq: lastSeq
            });
          }
        });
      });
    }

    fetchChanges();
  };

  api._close = function (callback) {
    //WebSQL databases do not need to be closed
    callback();
  };

  api._getAttachment = function (attachment, opts, callback) {
    var res;
    var tx = opts.ctx;
    var digest = attachment.digest;
    var type = attachment.content_type;
    var sql = 'SELECT hex(body) as body FROM ' + ATTACH_STORE +
              ' WHERE digest=?';
    tx.executeSql(sql, [digest], function (tx, result) {
      // sqlite normally stores data as utf8, so even the hex() function
      // "encodes" the binary data in utf8/16 before returning it. yet hex()
      // is the only way to get the full data, so we do this.
      var data = parseHexString(result.rows.item(0).body, encoding);
      if (opts.encode) {
        res = btoa(data);
      } else {
        data = utils.fixBinary(data);
        res = utils.createBlob([data], {type: type});
      }
      callback(null, res);
    });
  };

  api._getRevisionTree = function (docId, callback) {
    db.readTransaction(function (tx) {
      var sql = 'SELECT json AS metadata FROM ' + DOC_STORE + ' WHERE id = ?';
      tx.executeSql(sql, [docId], function (tx, result) {
        if (!result.rows.length) {
          callback(errors.MISSING_DOC);
        } else {
          var data = JSON.parse(result.rows.item(0).metadata);
          callback(null, data.rev_tree);
        }
      });
    });
  };

  api._doCompaction = function (docId, rev_tree, revs, callback) {
    if (!revs.length) {
      return callback();
    }
    db.transaction(function (tx) {
      var sql = 'SELECT json AS metadata FROM ' + DOC_STORE + ' WHERE id = ?';
      tx.executeSql(sql, [docId], function (tx, result) {
        if (!result.rows.length) {
          return utils.call(callback);
        }
        var metadata = JSON.parse(result.rows.item(0).metadata);
        metadata.rev_tree = rev_tree;

        // websql never calls callback if we do WHERE doc_id_rev IN (...)
        var numDone = 0;
        revs.forEach(function (rev) {
          var docIdRev = docId + '::' + rev;
          var sql = 'DELETE FROM ' + BY_SEQ_STORE + ' WHERE doc_id_rev = ?';
          tx.executeSql(sql, [docIdRev], function (tx) {
            if (++numDone === revs.length) {
              var sql = 'UPDATE ' + DOC_STORE + ' SET json = ? WHERE id = ?';
              tx.executeSql(sql, [JSON.stringify(metadata), docId],
                function () {
                callback();
              });
            }
          });
        });
      });
    });
  };
}

WebSqlPouch.valid = function () {
  if (typeof global !== 'undefined') {
    if (global.navigator &&
        global.navigator.sqlitePlugin &&
        global.navigator.sqlitePlugin.openDatabase) {
      return true;
    } else if (global.sqlitePlugin && global.sqlitePlugin.openDatabase) {
      return true;
    } else if (global.openDatabase) {
      return true;
    }
  }
  return false;
};

WebSqlPouch.destroy = utils.toPromise(function (name, opts, callback) {
  WebSqlPouch.Changes.removeAllListeners(name);
  var db = openDB(name, POUCH_VERSION, name, POUCH_SIZE);
  db.transaction(function (tx) {
    var stores = [DOC_STORE, BY_SEQ_STORE, ATTACH_STORE, META_STORE];
    stores.forEach(function (store) {
      tx.executeSql('DROP TABLE IF EXISTS ' + store, []);
    });
  }, unknownError(callback), function () {
    if (utils.hasLocalStorage()) {
      delete global.localStorage['_pouch__websqldb_' + name];
      delete global.localStorage[name];
    }
    callback(null, {'ok': true});
  });
});

WebSqlPouch.Changes = new utils.Changes();

module.exports = WebSqlPouch;

}).call(this,typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"../deps/errors":78,"../merge":84,"../utils":89}],74:[function(require,module,exports){
'use strict';
var utils = require('./utils');
var merge = require('./merge');
var errors = require('./deps/errors');
var EE = require('events').EventEmitter;
var evalFilter = require('./evalFilter');
var evalView = require('./evalView');
module.exports = Changes;
utils.inherits(Changes, EE);

function Changes(db, opts, callback) {
  EE.call(this);
  var self = this;
  this.db = db;
  opts = opts ? utils.clone(opts) : {};
  var oldComplete = callback || opts.complete || function () {};
  var complete = opts.complete = utils.once(function (err, resp) {
    if (err) {
      self.emit('error', err);
    } else {
      self.emit('complete', resp);
    }
    self.removeAllListeners();
    db.removeListener('destroyed', onDestroy);
  });
  if (oldComplete) {
    self.on('complete', function (resp) {
      oldComplete(null, resp);
    });
    self.on('error', function (err) {
      oldComplete(err);
    });
  }
  var oldOnChange = opts.onChange;
  if (oldOnChange) {
    self.on('change', oldOnChange);
  }
  function onDestroy() {
    self.cancel();
  }
  db.once('destroyed', onDestroy);

  opts.onChange = function (change) {
    if (opts.isCancelled) {
      return;
    }
    self.emit('change', change);
    if (self.startSeq && self.startSeq <= change.seq) {
      self.emit('uptodate');
      self.startSeq = false;
    }
    if (change.deleted) {
      self.emit('delete', change);
    } else if (change.changes.length === 1 &&
      change.changes[0].rev.slice(0, 2) === '1-') {
      self.emit('create', change);
    } else {
      self.emit('update', change);
    }
  };

  var promise = new utils.Promise(function (fulfill, reject) {
    opts.complete = function (err, res) {
      if (err) {
        reject(err);
      } else {
        fulfill(res);
      }
    };
  });
  self.once('cancel', function () {
    if (oldOnChange) {
      self.removeListener('change', oldOnChange);
    }
    opts.complete(null, {status: 'cancelled'});
  });
  this.then = promise.then.bind(promise);
  this['catch'] = promise['catch'].bind(promise);
  this.then(function (result) {
    complete(null, result);
  }, complete);



  if (!db.taskqueue.isReady) {
    db.taskqueue.addTask(function () {
      if (self.isCancelled) {
        self.emit('cancel');
      } else {
        self.doChanges(opts);
      }
    });
  } else {
    self.doChanges(opts);
  }
}
Changes.prototype.cancel = function () {
  this.isCancelled = true;
  if (this.db.taskqueue.isReady) {
    this.emit('cancel');
  }
};
function processChange(doc, metadata, opts) {
  var changeList = [{rev: doc._rev}];
  if (opts.style === 'all_docs') {
    changeList = merge.collectLeaves(metadata.rev_tree)
    .map(function (x) { return {rev: x.rev}; });
  }
  var change = {
    id: metadata.id,
    changes: changeList,
    doc: doc
  };

  if (utils.isDeleted(metadata, doc._rev)) {
    change.deleted = true;
  }
  if (opts.conflicts) {
    change.doc._conflicts = merge.collectConflicts(metadata);
    if (!change.doc._conflicts.length) {
      delete change.doc._conflicts;
    }
  }
  return change;
}

Changes.prototype.doChanges = function (opts) {
  var self = this;
  var callback = opts.complete;

  opts = utils.clone(opts);
  if ('live' in opts && !('continuous' in opts)) {
    opts.continuous = opts.live;
  }
  opts.processChange = processChange;

  if (opts.since === 'latest') {
    opts.since = 'now';
  }
  if (!opts.since) {
    opts.since = 0;
  }
  if (opts.since === 'now') {
    this.db.info().then(function (info) {
      if (self.isCancelled) {
        callback(null, {status: 'cancelled'});
        return;
      }
      opts.since = info.update_seq  - 1;
      self.doChanges(opts);
    }, callback);
    return;
  }

  if (opts.continuous && opts.since !== 'now') {
    this.db.info().then(function (info) {
      self.startSeq = info.update_seq - 1;
    }, function (err) {
      if (err.id === 'idbNull') {
        //db closed before this returned
        //thats ok
        return;
      }
      throw err;
    });
  }

  if (this.db.type() !== 'http' &&
    opts.filter && typeof opts.filter === 'string') {
    return this.filterChanges(opts);
  }

  if (!('descending' in opts)) {
    opts.descending = false;
  }

  // 0 and 1 should return 1 document
  opts.limit = opts.limit === 0 ? 1 : opts.limit;
  opts.complete = callback;
  var newPromise = this.db._changes(opts);
  if (newPromise && typeof newPromise.cancel === 'function') {
    var cancel = self.cancel;
    self.cancel = utils.getArguments(function (args) {
      newPromise.cancel();
      cancel.apply(this, args);
    });
  }
};

Changes.prototype.filterChanges = function (opts) {
  var self = this;
  var callback = opts.complete;
  if (opts.filter === '_view') {
    if (!opts.view || typeof opts.view !== 'string') {
      var err = new  Error('`view` filter parameter is not provided.');
      err.status = errors.BAD_REQUEST.status;
      err.name = errors.BAD_REQUEST.name;
      err.error = true;
      callback(err);
      return;
    }
    // fetch a view from a design doc, make it behave like a filter
    var viewName = opts.view.split('/');
    this.db.get('_design/' + viewName[0], function (err, ddoc) {
      if (self.isCancelled) {
        callback(null, {status: 'cancelled'});
        return;
      }
      if (err) {
        callback(err);
        return;
      }
      if (ddoc && ddoc.views && ddoc.views[viewName[1]]) {
        
        var filter = evalView(ddoc.views[viewName[1]].map);
        opts.filter = filter;
        self.doChanges(opts);
        return;
      }
      var msg = ddoc.views ? 'missing json key: ' + viewName[1] :
        'missing json key: views';
      if (!err) {
        err = new  Error(msg);
        err.status = errors.MISSING_DOC.status;
        err.name = errors.MISSING_DOC.name;
        err.error = true;
      }
      callback(err);
      return;
    });
  } else {
    // fetch a filter from a design doc
    var filterName = opts.filter.split('/');
    this.db.get('_design/' + filterName[0], function (err, ddoc) {
      if (self.isCancelled) {
        callback(null, {status: 'cancelled'});
        return;
      }
      if (err) {
        callback(err);
        return;
      }
      if (ddoc && ddoc.filters && ddoc.filters[filterName[1]]) {
        var filter = evalFilter(ddoc.filters[filterName[1]]);
        opts.filter = filter;
        self.doChanges(opts);
        return;
      } else {
        var msg = (ddoc && ddoc.filters) ? 'missing json key: ' + filterName[1]
          : 'missing json key: filters';
        if (!err) {
          err = new  Error(msg);
          err.status = errors.MISSING_DOC.status;
          err.name = errors.MISSING_DOC.name;
          err.error = true;
        }
        callback(err);
        return;
      }
    });
  }
};
},{"./deps/errors":78,"./evalFilter":81,"./evalView":82,"./merge":84,"./utils":89,"events":57}],75:[function(require,module,exports){
(function (global){
/*globals cordova */
"use strict";

var Adapter = require('./adapter');
var utils = require('./utils');
var TaskQueue = require('./taskqueue');
var Promise = utils.Promise;

function defaultCallback(err) {
  if (err && global.debug) {
    console.error(err);
  }
}

utils.inherits(PouchDB, Adapter);
function PouchDB(name, opts, callback) {

  if (!(this instanceof PouchDB)) {
    return new PouchDB(name, opts, callback);
  }
  var self = this;
  if (typeof opts === 'function' || typeof opts === 'undefined') {
    callback = opts;
    opts = {};
  }

  if (typeof name === 'object') {
    opts = name;
    name = undefined;
  }
  if (typeof callback === 'undefined') {
    callback = defaultCallback;
  }
  opts = opts || {};
  var oldCB = callback;
  self.auto_compaction = opts.auto_compaction;
  self.prefix = PouchDB.prefix;
  Adapter.call(self);
  self.taskqueue = new TaskQueue();
  var promise = new Promise(function (fulfill, reject) {
    callback = function (err, resp) {
      if (err) {
        return reject(err);
      }
      delete resp.then;
      fulfill(resp);
    };
  
    opts = utils.clone(opts);
    var originalName = opts.name || name;
    var backend, error;
    (function () {
      try {

        if (typeof originalName !== 'string') {
          error = new Error('Missing/invalid DB name');
          error.code = 400;
          throw error;
        }

        backend = PouchDB.parseAdapter(originalName, opts);
        
        opts.originalName = originalName;
        opts.name = backend.name;
        opts.adapter = opts.adapter || backend.adapter;
        self._adapter = opts.adapter;
        if (!PouchDB.adapters[opts.adapter]) {
          error = new Error('Adapter is missing');
          error.code = 404;
          throw error;
        }

        if (!PouchDB.adapters[opts.adapter].valid()) {
          error = new Error('Invalid Adapter');
          error.code = 404;
          throw error;
        }
      } catch (err) {
        self.taskqueue.fail(err);
        self.changes = utils.toPromise(function (opts) {
          if (opts.complete) {
            opts.complete(err);
          }
        });
      }
    }());
    if (error) {
      return reject(error); // constructor error, see above
    }
    self.adapter = opts.adapter;

    // needs access to PouchDB;
    self.replicate = {};

    self.replicate.from = function (url, opts, callback) {
      return PouchDB.replicate(url, self, opts, callback);
    };

    self.replicate.to = function (url, opts, callback) {
      return PouchDB.replicate(self, url, opts, callback);
    };

    self.sync = function (dbName, opts, callback) {
      return PouchDB.sync(self, dbName, opts, callback);
    };

    self.replicate.sync = self.sync;

    self.destroy = utils.adapterFun('destroy', function (callback) {
      var self = this;
      self.info(function (err, info) {
        if (err) {
          return callback(err);
        }
        PouchDB.destroy(info.db_name, callback);
      });
    });

    PouchDB.adapters[opts.adapter].call(self, opts, function (err, db) {
      if (err) {
        if (callback) {
          self.taskqueue.fail(err);
          callback(err);
        }
        return;
      }
      function destructionListener(event) {
        if (event === 'destroyed') {
          self.emit('destroyed');
          PouchDB.removeListener(opts.name, destructionListener);
        }
      }
      PouchDB.on(opts.name, destructionListener);
      self.emit('created', self);
      PouchDB.emit('created', opts.originalName);
      self.taskqueue.ready(self);
      callback(null, self);
      
    });
    if (opts.skipSetup) {
      self.taskqueue.ready(self);
    }

    if (utils.isCordova()) {
      //to inform websql adapter that we can use api
      cordova.fireWindowEvent(opts.name + "_pouch", {});
    }
  });
  promise.then(function (resp) {
    oldCB(null, resp);
  }, oldCB);
  self.then = promise.then.bind(promise);
  self["catch"] = promise["catch"].bind(promise);

}

module.exports = PouchDB;

}).call(this,typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"./adapter":69,"./taskqueue":88,"./utils":89}],76:[function(require,module,exports){
"use strict";

var createBlob = require('./blob.js');
var errors = require('./errors');
var utils = require("../utils");
var hasUpload;

function ajax(options, adapterCallback) {

  var requestCompleted = false;
  var callback = utils.getArguments(function (args) {
    if (requestCompleted) {
      return;
    }
    adapterCallback.apply(this, args);
    requestCompleted = true;
  });

  if (typeof options === "function") {
    callback = options;
    options = {};
  }

  options = utils.clone(options);

  var defaultOptions = {
    method : "GET",
    headers: {},
    json: true,
    processData: true,
    timeout: 10000,
    cache: false
  };

  options = utils.extend(true, defaultOptions, options);

  // cache-buster, specifically designed to work around IE's aggressive caching
  // see http://www.dashbay.com/2011/05/internet-explorer-caches-ajax/
  if (options.method === 'GET' && !options.cache) {
    var hasArgs = options.url.indexOf('?') !== -1;
    options.url += (hasArgs ? '&' : '?') + '_nonce=' + utils.uuid(16);
  }

  function onSuccess(obj, resp, cb) {
    if (!options.binary && !options.json && options.processData &&
      typeof obj !== 'string') {
      obj = JSON.stringify(obj);
    } else if (!options.binary && options.json && typeof obj === 'string') {
      try {
        obj = JSON.parse(obj);
      } catch (e) {
        // Probably a malformed JSON from server
        return cb(e);
      }
    }
    if (Array.isArray(obj)) {
      obj = obj.map(function (v) {
        var obj;
        if (v.ok) {
          return v;
        } else if (v.error && v.error === 'conflict') {
          obj = errors.REV_CONFLICT;
          obj.id = v.id;
          return obj;
        } else if (v.error && v.error === 'forbidden') {
          obj = errors.FORBIDDEN;
          obj.id = v.id;
          obj.reason = v.reason;
          return obj;
        } else if (v.missing) {
          obj = errors.MISSING_DOC;
          obj.missing = v.missing;
          return obj;
        } else {
          return v;
        }
      });
    }
    cb(null, obj, resp);
  }

  function onError(err, cb) {
    var errParsed, errObj, errType, key;
    try {
      errParsed = JSON.parse(err.responseText);
      //would prefer not to have a try/catch clause
      for (key in errors) {
        if (errors.hasOwnProperty(key) &&
            errors[key].name === errParsed.error) {
          errType = errors[key];
          break;
        }
      }
      if (!errType) {
        errType = errors.UNKNOWN_ERROR;
        if (err.status) {
          errType.status = err.status;
        }
        if (err.statusText) {
          err.name = err.statusText;
        }
      }
      errObj = errors.error(errType, errParsed.reason);
    } catch (e) {
      for (var key in errors) {
        if (errors.hasOwnProperty(key) && errors[key].status === err.status) {
          errType = errors[key];
          break;
        }
      }
      if (!errType) {
        errType = errors.UNKNOWN_ERROR;
        if (err.status) {
          errType.status = err.status;
        }
        if (err.statusText) {
          err.name = err.statusText;
        }
      }
      errObj = errors.error(errType);
    }
    cb(errObj);
  }

  var timer;
  var xhr;
  if (options.xhr) {
    xhr = new options.xhr();
  } else {
    xhr = new XMLHttpRequest();
  }
  xhr.open(options.method, options.url);
  xhr.withCredentials = true;

  if (options.json) {
    options.headers.Accept = 'application/json';
    options.headers['Content-Type'] = options.headers['Content-Type'] ||
      'application/json';
    if (options.body &&
        options.processData &&
        typeof options.body !== "string") {
      options.body = JSON.stringify(options.body);
    }
  }

  if (options.binary) {
    xhr.responseType = 'arraybuffer';
  }

  var createCookie = function (name, value, days) {
    var expires = "";
    if (days) {
      var date = new Date();
      date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
      expires = "; expires=" + date.toGMTString();
    }
    document.cookie = name + "=" + value + expires + "; path=/";
  };

  for (var key in options.headers) {
    if (key === 'Cookie') {
      var cookie = options.headers[key].split('=');
      createCookie(cookie[0], cookie[1], 10);
    } else {
      xhr.setRequestHeader(key, options.headers[key]);
    }
  }

  if (!("body" in options)) {
    options.body = null;
  }

  var abortReq = function () {
    if (requestCompleted) {
      return;
    }
    xhr.abort();
    onError(xhr, callback);
  };

  xhr.onreadystatechange = function () {
    if (xhr.readyState !== 4 || requestCompleted) {
      return;
    }
    clearTimeout(timer);
    if (xhr.status >= 200 && xhr.status < 300) {
      var data;
      if (options.binary) {
        data = createBlob([xhr.response || ''], {
          type: xhr.getResponseHeader('Content-Type')
        });
      } else {
        data = xhr.responseText;
      }
      onSuccess(data, xhr, callback);
    } else {
      onError(xhr, callback);
    }
  };

  if (options.timeout > 0) {
    timer = setTimeout(abortReq, options.timeout);
    xhr.onprogress = function () {
      clearTimeout(timer);
      timer = setTimeout(abortReq, options.timeout);
    };
    if (typeof hasUpload === 'undefined') {
      // IE throws an error if you try to access it directly
      hasUpload = Object.keys(xhr).indexOf('upload') !== -1;
    }
    if (hasUpload) { // does not exist in ie9
      xhr.upload.onprogress = xhr.onprogress;
    }
  }
  if (options.body && (options.body instanceof Blob)) {
    var reader = new FileReader();
    reader.onloadend = function (e) {

      var binary = "";
      var bytes = new Uint8Array(this.result);
      var length = bytes.byteLength;

      for (var i = 0; i < length; i++) {
        binary += String.fromCharCode(bytes[i]);
      }

      binary = utils.fixBinary(binary);
      xhr.send(binary);
    };
    reader.readAsArrayBuffer(options.body);
  } else {
    xhr.send(options.body);
  }
  return {abort: abortReq};
}

module.exports = ajax;

},{"../utils":89,"./blob.js":77,"./errors":78}],77:[function(require,module,exports){
(function (global){
"use strict";

//Abstracts constructing a Blob object, so it also works in older
//browsers that don't support the native Blob constructor. (i.e.
//old QtWebKit versions, at least).
function createBlob(parts, properties) {
  parts = parts || [];
  properties = properties || {};
  try {
    return new Blob(parts, properties);
  } catch (e) {
    if (e.name !== "TypeError") {
      throw e;
    }
    var BlobBuilder = global.BlobBuilder ||
                      global.MSBlobBuilder ||
                      global.MozBlobBuilder ||
                      global.WebKitBlobBuilder;
    var builder = new BlobBuilder();
    for (var i = 0; i < parts.length; i += 1) {
      builder.append(parts[i]);
    }
    return builder.getBlob(properties.type);
  }
}

module.exports = createBlob;


}).call(this,typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{}],78:[function(require,module,exports){
"use strict";

function PouchError(opts) {
  this.status = opts.status;
  this.name = opts.error;
  this.message = opts.reason;
  this.error = true;
}

PouchError.prototype__proto__ = Error.prototype;

PouchError.prototype.toString = function () {
  return JSON.stringify({
    status: this.status,
    name: this.name,
    message: this.message
  });
};

exports.UNAUTHORIZED = new PouchError({
  status: 401,
  error: 'unauthorized',
  reason: "Name or password is incorrect."
});
exports.MISSING_BULK_DOCS = new PouchError({
  status: 400,
  error: 'bad_request',
  reason: "Missing JSON list of 'docs'"
});
exports.MISSING_DOC = new PouchError({
  status: 404,
  error: 'not_found',
  reason: 'missing'
});
exports.REV_CONFLICT = new PouchError({
  status: 409,
  error: 'conflict',
  reason: 'Document update conflict'
});
exports.INVALID_ID = new PouchError({
  status: 400,
  error: 'invalid_id',
  reason: '_id field must contain a string'
});
exports.MISSING_ID = new PouchError({
  status: 412,
  error: 'missing_id',
  reason: '_id is required for puts'
});
exports.RESERVED_ID = new PouchError({
  status: 400,
  error: 'bad_request',
  reason: 'Only reserved document ids may start with underscore.'
});
exports.NOT_OPEN = new PouchError({
  status: 412,
  error: 'precondition_failed',
  reason: 'Database not open'
});
exports.UNKNOWN_ERROR = new PouchError({
  status: 500,
  error: 'unknown_error',
  reason: 'Database encountered an unknown error'
});
exports.BAD_ARG = new PouchError({
  status: 500,
  error: 'badarg',
  reason: 'Some query argument is invalid'
});
exports.INVALID_REQUEST = new PouchError({
  status: 400,
  error: 'invalid_request',
  reason: 'Request was invalid'
});
exports.QUERY_PARSE_ERROR = new PouchError({
  status: 400,
  error: 'query_parse_error',
  reason: 'Some query parameter is invalid'
});
exports.DOC_VALIDATION = new PouchError({
  status: 500,
  error: 'doc_validation',
  reason: 'Bad special document member'
});
exports.BAD_REQUEST = new PouchError({
  status: 400,
  error: 'bad_request',
  reason: 'Something wrong with the request'
});
exports.NOT_AN_OBJECT = new PouchError({
  status: 400,
  error: 'bad_request',
  reason: 'Document must be a JSON object'
});
exports.DB_MISSING = new PouchError({
  status: 404,
  error: 'not_found',
  reason: 'Database not found'
});
exports.IDB_ERROR = new PouchError({
  status: 500,
  error: 'indexed_db_went_bad',
  reason: 'unknown'
});
exports.WSQ_ERROR = new PouchError({
  status: 500,
  error: 'web_sql_went_bad',
  reason: 'unknown'
});
exports.LDB_ERROR = new PouchError({
  status: 500,
  error: 'levelDB_went_went_bad',
  reason: 'unknown'
});
exports.FORBIDDEN = new PouchError({
  status: 403,
  error: 'forbidden',
  reason: 'Forbidden by design doc validate_doc_update function'
});
exports.error = function (error, reason, name) {
  function CustomPouchError(msg) {
    this.message = reason;
    if (name) {
      this.name = name;
    }
  }
  CustomPouchError.prototype = error;
  return new CustomPouchError(reason);
};

},{}],79:[function(require,module,exports){
'use strict';
var Promise = require('../utils').Promise;

// this is essentially the "update sugar" function from daleharvey/pouchdb#1388
// the diffFun tells us what delta to apply to the doc.  it either returns
// the doc, or false if it doesn't need to do an update after all
function upsert(db, docId, diffFun) {
  return new Promise(function (fulfill, reject) {
    if (docId && typeof docId === 'object') {
      docId = docId._id;
    }
    if (typeof docId !== 'string') {
      return reject(new Error('doc id is required'));
    }

    db.get(docId, function (err, doc) {
      if (err) {
        if (err.name !== 'not_found') {
          return reject(err);
        }
        return fulfill(tryAndPut(db, diffFun({_id : docId}), diffFun));
      }
      var newDoc = diffFun(doc);
      if (!newDoc) {
        return fulfill(doc);
      }
      fulfill(tryAndPut(db, newDoc, diffFun));
    });
  });
}

function tryAndPut(db, doc, diffFun) {
  return db.put(doc)["catch"](function (err) {
    if (err.name !== 'conflict') {
      throw err;
    }
    return upsert(db, doc, diffFun);
  });
}

module.exports = function (db, docId, diffFun, cb) {
  if (typeof cb === 'function') {
    upsert(db, docId, diffFun).then(function (resp) {
      cb(null, resp);
    }, cb);
  } else {
    return upsert(db, docId, diffFun);
  }
};

},{"../utils":89}],80:[function(require,module,exports){
"use strict";

// BEGIN Math.uuid.js

/*!
Math.uuid.js (v1.4)
http://www.broofa.com
mailto:robert@broofa.com

Copyright (c) 2010 Robert Kieffer
Dual licensed under the MIT and GPL licenses.
*/

/*
 * Generate a random uuid.
 *
 * USAGE: Math.uuid(length, radix)
 *   length - the desired number of characters
 *   radix  - the number of allowable values for each character.
 *
 * EXAMPLES:
 *   // No arguments  - returns RFC4122, version 4 ID
 *   >>> Math.uuid()
 *   "92329D39-6F5C-4520-ABFC-AAB64544E172"
 *
 *   // One argument - returns ID of the specified length
 *   >>> Math.uuid(15)     // 15 character ID (default base=62)
 *   "VcydxgltxrVZSTV"
 *
 *   // Two arguments - returns ID of the specified length, and radix. 
 *   // (Radix must be <= 62)
 *   >>> Math.uuid(8, 2)  // 8 character ID (base=2)
 *   "01001010"
 *   >>> Math.uuid(8, 10) // 8 character ID (base=10)
 *   "47473046"
 *   >>> Math.uuid(8, 16) // 8 character ID (base=16)
 *   "098F4D35"
 */
var chars = (
  '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ' +
  'abcdefghijklmnopqrstuvwxyz'
).split('');
function getValue(radix) {
  return 0 | Math.random() * radix;
}
function uuid(len, radix) {
  radix = radix || chars.length;
  var out = '';
  var i = -1;

  if (len) {
    // Compact form
    while (++i < len) {
      out += chars[getValue(radix)];
    }
    return out;
  }
    // rfc4122, version 4 form
    // Fill in random data.  At i==19 set the high bits of clock sequence as
    // per rfc4122, sec. 4.1.5
  while (++i < 36) {
    switch (i) {
      case 8:
      case 13:
      case 18:
      case 23:
        out += '-';
        break;
      case 19:
        out += chars[(getValue(16) & 0x3) | 0x8];
        break;
      default:
        out += chars[getValue(16)];
    }
  }

  return out;
}



module.exports = uuid;


},{}],81:[function(require,module,exports){
'use strict';

module.exports = evalFilter;
function evalFilter(input) {
  /*jshint evil: true */
  return eval([
    '(function () { return ',
    input,
    ' })()'
  ].join(''));
}
},{}],82:[function(require,module,exports){
'use strict';

module.exports = evalView;
function evalView(input) {
  /*jshint evil: true */
  return eval([
    '(function () {',
    '  return function (doc) {',
    '    var emitted = false;',
    '    var emit = function (a, b) {',
    '      emitted = true;',
    '    };',
    '    var view = ' + input + ';',
    '    view(doc);',
    '    if (emitted) {',
    '      return true;',
    '    }',
    '  }',
    '})()'
  ].join('\n'));
}
},{}],83:[function(require,module,exports){
(function (process){
"use strict";

var PouchDB = require('./setup');

module.exports = PouchDB;

PouchDB.ajax = require('./deps/ajax');
PouchDB.extend = require('pouchdb-extend');
PouchDB.utils = require('./utils');
PouchDB.Errors = require('./deps/errors');
PouchDB.replicate = require('./replicate').replicate;
PouchDB.sync = require('./sync');
PouchDB.version = require('./version');
var httpAdapter = require('./adapters/http');
PouchDB.adapter('http', httpAdapter);
PouchDB.adapter('https', httpAdapter);

PouchDB.adapter('idb', require('./adapters/idb'));
PouchDB.adapter('websql', require('./adapters/websql'));
PouchDB.plugin(require('pouchdb-mapreduce'));

if (!process.browser) {
  var ldbAdapter = require('./adapters/leveldb');
  PouchDB.adapter('ldb', ldbAdapter);
  PouchDB.adapter('leveldb', ldbAdapter);
}

}).call(this,require("JkpR2F"))
},{"./adapters/http":70,"./adapters/idb":71,"./adapters/leveldb":53,"./adapters/websql":73,"./deps/ajax":76,"./deps/errors":78,"./replicate":85,"./setup":86,"./sync":87,"./utils":89,"./version":90,"JkpR2F":59,"pouchdb-extend":111,"pouchdb-mapreduce":114}],84:[function(require,module,exports){
'use strict';
var extend = require('pouchdb-extend');


// for a better overview of what this is doing, read:
// https://github.com/apache/couchdb/blob/master/src/couchdb/couch_key_tree.erl
//
// But for a quick intro, CouchDB uses a revision tree to store a documents
// history, A -> B -> C, when a document has conflicts, that is a branch in the
// tree, A -> (B1 | B2 -> C), We store these as a nested array in the format
//
// KeyTree = [Path ... ]
// Path = {pos: position_from_root, ids: Tree}
// Tree = [Key, Opts, [Tree, ...]], in particular single node: [Key, []]

// Turn a path as a flat array into a tree with a single branch
function pathToTree(path) {
  var doc = path.shift();
  var root = [doc.id, doc.opts, []];
  var leaf = root;
  var nleaf;

  while (path.length) {
    doc = path.shift();
    nleaf = [doc.id, doc.opts, []];
    leaf[2].push(nleaf);
    leaf = nleaf;
  }
  return root;
}

// Merge two trees together
// The roots of tree1 and tree2 must be the same revision
function mergeTree(in_tree1, in_tree2) {
  var queue = [{tree1: in_tree1, tree2: in_tree2}];
  var conflicts = false;
  while (queue.length > 0) {
    var item = queue.pop();
    var tree1 = item.tree1;
    var tree2 = item.tree2;

    if (tree1[1].status || tree2[1].status) {
      tree1[1].status =
        (tree1[1].status ===  'available' ||
         tree2[1].status === 'available') ? 'available' : 'missing';
    }

    for (var i = 0; i < tree2[2].length; i++) {
      if (!tree1[2][0]) {
        conflicts = 'new_leaf';
        tree1[2][0] = tree2[2][i];
        continue;
      }

      var merged = false;
      for (var j = 0; j < tree1[2].length; j++) {
        if (tree1[2][j][0] === tree2[2][i][0]) {
          queue.push({tree1: tree1[2][j], tree2: tree2[2][i]});
          merged = true;
        }
      }
      if (!merged) {
        conflicts = 'new_branch';
        tree1[2].push(tree2[2][i]);
        tree1[2].sort();
      }
    }
  }
  return {conflicts: conflicts, tree: in_tree1};
}

function doMerge(tree, path, dontExpand) {
  var restree = [];
  var conflicts = false;
  var merged = false;
  var res;

  if (!tree.length) {
    return {tree: [path], conflicts: 'new_leaf'};
  }

  tree.forEach(function (branch) {
    if (branch.pos === path.pos && branch.ids[0] === path.ids[0]) {
      // Paths start at the same position and have the same root, so they need
      // merged
      res = mergeTree(branch.ids, path.ids);
      restree.push({pos: branch.pos, ids: res.tree});
      conflicts = conflicts || res.conflicts;
      merged = true;
    } else if (dontExpand !== true) {
      // The paths start at a different position, take the earliest path and
      // traverse up until it as at the same point from root as the path we
      // want to merge.  If the keys match we return the longer path with the
      // other merged After stemming we dont want to expand the trees

      var t1 = branch.pos < path.pos ? branch : path;
      var t2 = branch.pos < path.pos ? path : branch;
      var diff = t2.pos - t1.pos;

      var candidateParents = [];

      var trees = [];
      trees.push({ids: t1.ids, diff: diff, parent: null, parentIdx: null});
      while (trees.length > 0) {
        var item = trees.pop();
        if (item.diff === 0) {
          if (item.ids[0] === t2.ids[0]) {
            candidateParents.push(item);
          }
          continue;
        }
        if (!item.ids) {
          continue;
        }
        /*jshint loopfunc:true */
        item.ids[2].forEach(function (el, idx) {
          trees.push(
            {ids: el, diff: item.diff - 1, parent: item.ids, parentIdx: idx});
        });
      }

      var el = candidateParents[0];

      if (!el) {
        restree.push(branch);
      } else {
        res = mergeTree(el.ids, t2.ids);
        el.parent[2][el.parentIdx] = res.tree;
        restree.push({pos: t1.pos, ids: t1.ids});
        conflicts = conflicts || res.conflicts;
        merged = true;
      }
    } else {
      restree.push(branch);
    }
  });

  // We didnt find
  if (!merged) {
    restree.push(path);
  }

  restree.sort(function (a, b) {
    return a.pos - b.pos;
  });

  return {
    tree: restree,
    conflicts: conflicts || 'internal_node'
  };
}

// To ensure we dont grow the revision tree infinitely, we stem old revisions
function stem(tree, depth) {
  // First we break out the tree into a complete list of root to leaf paths,
  // we cut off the start of the path and generate a new set of flat trees
  var stemmedPaths = PouchMerge.rootToLeaf(tree).map(function (path) {
    var stemmed = path.ids.slice(-depth);
    return {
      pos: path.pos + (path.ids.length - stemmed.length),
      ids: pathToTree(stemmed)
    };
  });
  // Then we remerge all those flat trees together, ensuring that we dont
  // connect trees that would go beyond the depth limit
  return stemmedPaths.reduce(function (prev, current, i, arr) {
    return doMerge(prev, current, true).tree;
  }, [stemmedPaths.shift()]);
}

var PouchMerge = {};

PouchMerge.merge = function (tree, path, depth) {
  // Ugh, nicer way to not modify arguments in place?
  tree = extend(true, [], tree);
  path = extend(true, {}, path);
  var newTree = doMerge(tree, path);
  return {
    tree: stem(newTree.tree, depth),
    conflicts: newTree.conflicts
  };
};

// We fetch all leafs of the revision tree, and sort them based on tree length
// and whether they were deleted, undeleted documents with the longest revision
// tree (most edits) win
// The final sort algorithm is slightly documented in a sidebar here:
// http://guide.couchdb.org/draft/conflicts.html
PouchMerge.winningRev = function (metadata) {
  var leafs = [];
  PouchMerge.traverseRevTree(metadata.rev_tree,
                              function (isLeaf, pos, id, something, opts) {
    if (isLeaf) {
      leafs.push({pos: pos, id: id, deleted: !!opts.deleted});
    }
  });
  leafs.sort(function (a, b) {
    if (a.deleted !== b.deleted) {
      return a.deleted > b.deleted ? 1 : -1;
    }
    if (a.pos !== b.pos) {
      return b.pos - a.pos;
    }
    return a.id < b.id ? 1 : -1;
  });

  return leafs[0].pos + '-' + leafs[0].id;
};

// Pretty much all below can be combined into a higher order function to
// traverse revisions
// The return value from the callback will be passed as context to all
// children of that node
PouchMerge.traverseRevTree = function (revs, callback) {
  var toVisit = revs.slice();

  var node;
  while ((node = toVisit.pop())) {
    var pos = node.pos;
    var tree = node.ids;
    var branches = tree[2];
    var newCtx =
      callback(branches.length === 0, pos, tree[0], node.ctx, tree[1]);
    for (var i = 0, len = branches.length; i < len; i++) {
      toVisit.push({pos: pos + 1, ids: branches[i], ctx: newCtx});
    }
  }
};

PouchMerge.collectLeaves = function (revs) {
  var leaves = [];
  PouchMerge.traverseRevTree(revs, function (isLeaf, pos, id, acc, opts) {
    if (isLeaf) {
      leaves.unshift({rev: pos + "-" + id, pos: pos, opts: opts});
    }
  });
  leaves.sort(function (a, b) {
    return b.pos - a.pos;
  });
  leaves.map(function (leaf) { delete leaf.pos; });
  return leaves;
};

// returns revs of all conflicts that is leaves such that
// 1. are not deleted and
// 2. are different than winning revision
PouchMerge.collectConflicts = function (metadata) {
  var win = PouchMerge.winningRev(metadata);
  var leaves = PouchMerge.collectLeaves(metadata.rev_tree);
  var conflicts = [];
  leaves.forEach(function (leaf) {
    if (leaf.rev !== win && !leaf.opts.deleted) {
      conflicts.push(leaf.rev);
    }
  });
  return conflicts;
};

PouchMerge.rootToLeaf = function (tree) {
  var paths = [];
  PouchMerge.traverseRevTree(tree, function (isLeaf, pos, id, history, opts) {
    history = history ? history.slice(0) : [];
    history.push({id: id, opts: opts});
    if (isLeaf) {
      var rootPos = pos + 1 - history.length;
      paths.unshift({pos: rootPos, ids: history});
    }
    return history;
  });
  return paths;
};


module.exports = PouchMerge;

},{"pouchdb-extend":111}],85:[function(require,module,exports){
'use strict';

var utils = require('./utils');
var Pouch = require('./index');
var EE = require('events').EventEmitter;

// We create a basic promise so the caller can cancel the replication possibly
// before we have actually started listening to changes etc
utils.inherits(Replication, EE);
function Replication(opts) {
  EE.call(this);
  this.cancelled = false;
  var self = this;
  var promise = new utils.Promise(function (fulfill, reject) {
    self.once('complete', fulfill);
    self.once('error', reject);
  });
  self.then = function (resolve, reject) {
    return promise.then(resolve, reject);
  };
  self["catch"] = function (reject) {
    return promise["catch"](reject);
  };
  // As we allow error handling via "error" event as well,
  // put a stub in here so that rejecting never throws UnhandledError.
  self["catch"](function (err) {});
}

Replication.prototype.cancel = function () {
  this.cancelled = true;
  this.emit('cancel');
};

Replication.prototype.ready = function (src, target) {
  var self = this;
  function onDestroy() {
    self.cancel();
  }
  src.once('destroyed', onDestroy);
  target.once('destroyed', onDestroy);
  function cleanup() {
    self.removeAllListeners();
    src.removeListener('destroyed', onDestroy);
    target.removeListener('destroyed', onDestroy);
  }
  this.then(cleanup, cleanup);
};


// TODO: check CouchDB's replication id generation
// Generate a unique id particular to this replication
function genReplicationId(src, target, opts) {
  var filterFun = opts.filter ? opts.filter.toString() : '';
  return src.id().then(function (src_id) {
    return target.id().then(function (target_id) {
      var queryData = src_id + target_id + filterFun +
        JSON.stringify(opts.query_params) + opts.doc_ids;
      return '_local/' + utils.MD5(queryData);
    });
  });
}


function updateCheckpoint(db, id, checkpoint) {
    return db.get(id)["catch"](function (err) {
      if (err.status === 404) {
        return {_id: id};
      }
      throw err;
    }).then(function (doc) {
      doc.last_seq = checkpoint;
      return db.put(doc);
    });
  }

function Checkpointer(src, target, id) {
  this.src = src;
  this.target = target;
  this.id = id;
}

Checkpointer.prototype.writeCheckpoint = function (checkpoint) {
  var self = this;
  return this.updateTarget(checkpoint).then(function () {
    return self.updateSource(checkpoint);
  });
};
Checkpointer.prototype.updateTarget = function (checkpoint) {
  return updateCheckpoint(this.target, this.id, checkpoint);
};
Checkpointer.prototype.updateSource = function (checkpoint) {
  var self = this;
  if (this.readOnlySource) {
    return utils.Promise.resolve(true);
  }
  return updateCheckpoint(this.src, this.id, checkpoint)["catch"](function (err) {
    if (err.status === 401) {
      self.readOnlySource = true;
      return true;
    }
    throw err;
  });
};
Checkpointer.prototype.getCheckpoint = function () {
  var self = this;
  return self.target.get(self.id).then(function (targetDoc) {
    return self.src.get(self.id).then(function (sourceDoc) {
      if (targetDoc.last_seq === sourceDoc.last_seq) {
        return sourceDoc.last_seq;
      }
      return 0;
    }, function (err) {
      if (err.status === 404 && targetDoc.last_seq) {
        return self.src.put({
          _id: self.id,
          last_seq: 0
        }).then(function () {
          return 0;
        }, function (err) {
          if (err.status === 401) {
            self.readOnlySource = true;
            return targetDoc.last_seq;
          }
          return 0;
        });
      }
      throw err;
    });
  })["catch"](function (err) {
    if (err.status !== 404) {
      throw err;
    }
    return 0;
  });
};
function replicate(repId, src, target, opts, returnValue) {
  var batches = [];               // list of batches to be processed
  var currentBatch;               // the batch currently being processed
  var pendingBatch = {
    seq: 0,
    changes: [],
    docs: []
  }; // next batch, not yet ready to be processed
  var writingCheckpoint = false;  // true while checkpoint is being written
  var changesCompleted = false;   // true when all changes received
  var replicationCompleted = false; // true when replication has completed
  var last_seq = 0;
  var continuous = opts.continuous || opts.live || false;
  var batch_size = opts.batch_size || 100;
  var batches_limit = opts.batches_limit || 10;
  var changesPending = false;     // true while src.changes is running
  var changesCount = 0; // number of changes received since calling src.changes
  var doc_ids = opts.doc_ids;
  var checkpointer = new Checkpointer(src, target, repId);
  var result = {
    ok: true,
    start_time: new Date(),
    docs_read: 0,
    docs_written: 0,
    doc_write_failures: 0,
    errors: []
  };
  var changesOpts = {};
  returnValue.ready(src, target);


  function writeDocs() {
    if (currentBatch.docs.length === 0) {
      return;
    }
    var docs = currentBatch.docs;
    return target.bulkDocs({
      docs: docs
    }, {
      new_edits: false
    }).then(function (res) {
      if (returnValue.cancelled) {
        completeReplication();
        throw new Error('cancelled');
      }
      var errors = [];
      res.forEach(function (res) {
        if (!res.ok) {
          result.doc_write_failures++;
          errors.push(new Error(res.reason || res.message || 'Unknown reason'));
        }
      });
      if (errors.length > 0) {
        var error = new Error('bulkDocs error');
        error.other_errors = errors;
        abortReplication('target.bulkDocs failed to write docs', error);
        throw new Error('bulkWrite partial failure');
      }
    }, function (err) {
      result.doc_write_failures += docs.length;
      throw err;
    });
  }


  function getNextDoc() {
    var diffs = currentBatch.diffs;
    var id = Object.keys(diffs)[0];
    var revs = diffs[id].missing;
    return src.get(id, {revs: true, open_revs: revs, attachments: true})
    .then(function (docs) {
      docs.forEach(function (doc) {
        if (returnValue.cancelled) {
          return completeReplication();
        }
        if (doc.ok) {
          result.docs_read++;
          currentBatch.pendingRevs++;
          currentBatch.docs.push(doc.ok);
          delete diffs[doc.ok._id];
        }
      });
    });
  }


  function getAllDocs() {
    if (Object.keys(currentBatch.diffs).length > 0) {
      return getNextDoc().then(getAllDocs);
    } else {
      return utils.Promise.resolve();
    }
  }


  function getRevisionOneDocs() {
    // filter out the generation 1 docs and get them
    // leaving the non-generation one docs to be got otherwise
    var ids = Object.keys(currentBatch.diffs).filter(function (id) {
      var missing = currentBatch.diffs[id].missing;
      return missing.length === 1 && missing[0].slice(0, 2) === '1-';
    });
    return src.allDocs({
      keys: ids,
      include_docs: true
    }).then(function (res) {
      if (returnValue.cancelled) {
        completeReplication();
        throw (new Error('cancelled'));
      }
      res.rows.forEach(function (row, i) {
        if (row.doc && !row.deleted &&
          row.value.rev.slice(0, 2) === '1-' && (
            !row.doc._attachments ||
            Object.keys(row.doc._attachments).length === 0
          )
        ) {
          result.docs_read++;
          currentBatch.pendingRevs++;
          currentBatch.docs.push(row.doc);
          delete currentBatch.diffs[row.id];
        }
      });
    });
  }


  function getDocs() {
    if (src.type() === 'http') {
      return getRevisionOneDocs().then(getAllDocs);
    } else {
      return getAllDocs();
    }
  }


  function finishBatch() {
    writingCheckpoint = true;
    return checkpointer.writeCheckpoint(
      currentBatch.seq
    ).then(function (res) {
      writingCheckpoint = false;
      if (returnValue.cancelled) {
        completeReplication();
        throw new Error('cancelled');
      }
      result.last_seq = last_seq = currentBatch.seq;
      result.docs_written += currentBatch.docs.length;
      returnValue.emit('change', utils.clone(result));
      currentBatch = undefined;
      getChanges();
    })["catch"](function (err) {
      writingCheckpoint = false;
      abortReplication('writeCheckpoint completed with error', err);
      throw err;
    });
  }


  function getDiffs() {
    var diff = {};
    currentBatch.changes.forEach(function (change) {
      diff[change.id] = change.changes.map(function (x) {
        return x.rev;
      });
    });
    return target.revsDiff(diff).then(function (diffs) {
      if (returnValue.cancelled) {
        completeReplication();
        throw new Error('cancelled');
      }
      // currentBatch.diffs elements are deleted as the documents are written
      currentBatch.diffs = diffs;
      currentBatch.pendingRevs = 0;
    });
  }


  function startNextBatch() {
    if (returnValue.cancelled || currentBatch) {
      return;
    }
    if (batches.length === 0) {
      processPendingBatch(true);
      return;
    }
    currentBatch = batches.shift();
    getDiffs()
    .then(getDocs)
    .then(writeDocs)
    .then(finishBatch)
    .then(startNextBatch)[
    "catch"](function (err) {
      abortReplication('batch processing terminated with error', err);
    });
  }


  function processPendingBatch(immediate) {
    if (pendingBatch.changes.length === 0) {
      if (batches.length === 0 && !currentBatch) {
        if ((continuous && changesOpts.live) || changesCompleted) {
          returnValue.emit('uptodate', utils.clone(result));
        }
        if (changesCompleted) {
          completeReplication();
        }
      }
      return;
    }
    if (
      immediate ||
      changesCompleted ||
      pendingBatch.changes.length >= batch_size
    ) {
      batches.push(pendingBatch);
      pendingBatch = {
        seq: 0,
        changes: [],
        docs: []
      };
      startNextBatch();
    }
  }


  function abortReplication(reason, err) {
    if (replicationCompleted) {
      return;
    }
    result.ok = false;
    result.status = 'aborted';
    err.message = reason;
    result.errors.push(err);
    batches = [];
    pendingBatch = {
      seq: 0,
      changes: [],
      docs: []
    };
    completeReplication();
  }


  function completeReplication() {
    if (replicationCompleted) {
      return;
    }
    if (returnValue.cancelled) {
      result.status = 'cancelled';
      if (writingCheckpoint) {
        return;
      }
    }
    result.status = result.status || 'complete';
    result.end_time = new Date();
    result.last_seq = last_seq;
    replicationCompleted = returnValue.cancelled = true;
    if (result.errors.length > 0) {
      var error = result.errors.pop();
      if (result.errors.length > 0) {
        error.other_errors = result.errors;
      }
      error.result = result;
      returnValue.emit('error', error);
    } else {
      returnValue.emit('complete', result);
    }
  }


  function onChange(change) {
    if (returnValue.cancelled) {
      return completeReplication();
    }
    changesCount++;
    if (
      pendingBatch.changes.length === 0 &&
      batches.length === 0 &&
      !currentBatch
    ) {
      returnValue.emit('outofdate', utils.clone(result));
    }
    pendingBatch.seq = change.seq;
    pendingBatch.changes.push(change);
    processPendingBatch(batches.length === 0);
  }


  function onChangesComplete(changes) {
    changesPending = false;
    if (returnValue.cancelled) {
      return completeReplication();
    }
    if (changesCount > 0) {
      changesOpts.since = changes.last_seq;
      getChanges();
    } else {
      if (continuous) {
        changesOpts.live = true;
        getChanges();
      } else {
        changesCompleted = true;
      }
    }
    processPendingBatch(true);
  }


  function onChangesError(err) {
    changesPending = false;
    if (returnValue.cancelled) {
      return completeReplication();
    }
    abortReplication('changes rejected', err);
  }


  function getChanges() {
    if (
      !changesPending &&
      !changesCompleted &&
      batches.length < batches_limit
    ) {
      changesPending = true;
      changesCount = 0;
      src.changes(changesOpts)
      .on('change', onChange)
      .then(onChangesComplete)[
      "catch"](onChangesError);
    }
  }


  function startChanges() {
    checkpointer.getCheckpoint().then(function (checkpoint) {
      last_seq = checkpoint;
      changesOpts = {
        since: last_seq,
        limit: batch_size,
        style: 'all_docs',
        doc_ids: doc_ids,
        returnDocs: false
      };
      if (opts.filter) {
        changesOpts.filter = opts.filter;
      }
      if (opts.query_params) {
        changesOpts.query_params = opts.query_params;
      }
      getChanges();
    })["catch"](function (err) {
      abortReplication('getCheckpoint rejected with ', err);
    });
  }


  returnValue.once('cancel', completeReplication);

  if (typeof opts.onChange === 'function') {
    returnValue.on('change', opts.onChange);
  }

  if (typeof opts.complete === 'function') {
    returnValue.once('error', opts.complete);
    returnValue.once('complete', function (result) {
      opts.complete(null, result);
    });
  }

  if (typeof opts.since === 'undefined') {
    startChanges();
  } else {
    writingCheckpoint = true;
    checkpointer.writeCheckpoint(opts.since).then(function (res) {
      writingCheckpoint = false;
      if (returnValue.cancelled) {
        completeReplication();
        return;
      }
      last_seq = opts.since;
      startChanges();
    })["catch"](function (err) {
      writingCheckpoint = false;
      abortReplication('writeCheckpoint completed with error', err);
      throw err;
    });
  }
}


function toPouch(db) {
  if (typeof db === 'string') {
    return new Pouch(db);
  } else if (db.then) {
    return db;
  } else {
    return utils.Promise.resolve(db);
  }
}


function replicateWrapper(src, target, opts, callback) {
  if (typeof opts === 'function') {
    callback = opts;
    opts = {};
  }
  if (typeof opts === 'undefined') {
    opts = {};
  }
  if (!opts.complete) {
    opts.complete = callback || function () {};
  }
  opts = utils.clone(opts);
  opts.continuous = opts.continuous || opts.live;
  var replicateRet = new Replication(opts);
  toPouch(src).then(function (src) {
    return toPouch(target).then(function (target) {
      if (opts.server) {
        if (typeof src.replicateOnServer !== 'function') {
          throw new TypeError(
            'Server replication not supported for ' + src.type() + ' adapter'
          );
        }
        if (src.type() !== target.type()) {
          throw new TypeError('Server replication' +
              ' for different adapter types (' +
            src.type() + ' and ' + target.type() + ') is not supported'
          );
        }
        src.replicateOnServer(target, opts, replicateRet);
      } else {
        return genReplicationId(src, target, opts).then(function (repId) {
          replicateRet.emit('id', repId);
          replicate(repId, src, target, opts, replicateRet);
        });
      }
    });
  })["catch"](function (err) {
    replicateRet.emit('error', err);
    opts.complete(err);
  });
  return replicateRet;
}

exports.replicate = replicateWrapper;

},{"./index":83,"./utils":89,"events":57}],86:[function(require,module,exports){
(function (global){
"use strict";

var PouchDB = require("./constructor");
var utils = require('./utils');
var Promise = utils.Promise;
var EventEmitter = require('events').EventEmitter;
PouchDB.adapters = {};
PouchDB.preferredAdapters = require('./adapters/preferredAdapters.js');

PouchDB.prefix = '_pouch_';

var eventEmitter = new EventEmitter();

var eventEmitterMethods = [
  'on',
  'addListener',
  'emit',
  'listeners',
  'once',
  'removeAllListeners',
  'removeListener',
  'setMaxListeners'
];

eventEmitterMethods.forEach(function (method) {
  PouchDB[method] = eventEmitter[method].bind(eventEmitter);
});
PouchDB.setMaxListeners(0);
PouchDB.parseAdapter = function (name, opts) {
  var match = name.match(/([a-z\-]*):\/\/(.*)/);
  var adapter, adapterName;
  if (match) {
    // the http adapter expects the fully qualified name
    name = /http(s?)/.test(match[1]) ? match[1] + '://' + match[2] : match[2];
    adapter = match[1];
    if (!PouchDB.adapters[adapter].valid()) {
      throw 'Invalid adapter';
    }
    return {name: name, adapter: match[1]};
  }

  // check for browsers that have been upgraded from websql-only to websql+idb
  var skipIdb = 'idb' in PouchDB.adapters && 'websql' in PouchDB.adapters &&
    utils.hasLocalStorage() &&
    global.localStorage['_pouch__websqldb_' + PouchDB.prefix + name];

  if (typeof opts !== 'undefined' && opts.db) {
    adapterName = 'leveldb';
  } else {
    for (var i = 0; i < PouchDB.preferredAdapters.length; ++i) {
      adapterName = PouchDB.preferredAdapters[i];
      if (adapterName in PouchDB.adapters) {
        if (skipIdb && adapterName === 'idb') {
          continue; // keep using websql to avoid user data loss
        }
        break;
      }
    }
  }

  adapter = PouchDB.adapters[adapterName];
  if (adapterName && adapter) {
    var use_prefix = 'use_prefix' in adapter ? adapter.use_prefix : true;

    return {
      name: use_prefix ? PouchDB.prefix + name : name,
      adapter: adapterName
    };
  }

  throw 'No valid adapter found';
};

PouchDB.destroy = utils.toPromise(function (name, opts, callback) {
  if (typeof opts === 'function' || typeof opts === 'undefined') {
    callback = opts;
    opts = {};
  }

  if (typeof name === 'object') {
    opts = name;
    name = undefined;
  }

  var backend = PouchDB.parseAdapter(opts.name || name, opts);
  var dbName = backend.name;

  var adapter = PouchDB.adapters[backend.adapter];

  function destroyDb() {
    // call destroy method of the particular adaptor
    adapter.destroy(dbName, opts, function (err, resp) {
      if (err) {
        callback(err);
      } else {
        PouchDB.emit('destroyed', dbName);
        //so we don't have to sift through all dbnames
        PouchDB.emit(dbName, 'destroyed');
        callback(null, resp || { 'ok': true });
      }
    });
  }

  var usePrefix = 'use_prefix' in adapter ? adapter.use_prefix : true;

  var trueDbName = usePrefix ?
    dbName.replace(new RegExp('^' + PouchDB.prefix), '') : dbName;
  new PouchDB(trueDbName, {adapter : backend.adapter}, function (err, db) {
    if (err) {
      return callback(err);
    }
    db.get('_local/_pouch_dependentDbs', function (err, localDoc) {
      if (err) {
        if (err.name !== 'not_found') {
          return callback(err);
        } else { // no dependencies
          return destroyDb();
        }
      }
      var dependentDbs = localDoc.dependentDbs;
      var deletedMap = Object.keys(dependentDbs).map(function (name) {
        var trueName = usePrefix ?
          name.replace(new RegExp('^' + PouchDB.prefix), '') : name;
        return PouchDB.destroy(trueName, {adapter: backend.adapter});
      });
      Promise.all(deletedMap).then(destroyDb, function (error) {
        callback(error);
      });
    });
  });
});

PouchDB.allDbs = utils.toPromise(function (callback) {
  var err = new Error('allDbs method removed');
  err.stats = '400';
  callback(err);
});
PouchDB.adapter = function (id, obj) {
  if (obj.valid()) {
    PouchDB.adapters[id] = obj;
  }
};

PouchDB.plugin = function (obj) {
  Object.keys(obj).forEach(function (id) {
    PouchDB.prototype[id] = obj[id];
  });
};

module.exports = PouchDB;

}).call(this,typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"./adapters/preferredAdapters.js":72,"./constructor":75,"./utils":89,"events":57}],87:[function(require,module,exports){
'use strict';
var utils = require('./utils');
var replicate = require('./replicate').replicate;
var EE = require('events').EventEmitter;

module.exports = Sync;
utils.inherits(Sync, EE);
function Sync(src, target, opts, callback) {
  if (!(this instanceof Sync)) {
    return new Sync(src, target, opts, callback);
  }
  var self = this;
  if (typeof opts === 'function') {
    callback = opts;
    opts = {};
  }
  if (typeof opts === 'undefined') {
    opts = {};
  }
  this.canceled = false;
  opts = utils.clone(opts);
  var onChange, complete;
  if ('onChange' in opts) {
    onChange = opts.onChange;
    delete opts.onChange;
  }
  if (typeof callback === 'function' && !opts.complete) {
    complete = callback;
  } else if ('complete' in opts) {
    complete = opts.complete;
    delete opts.complete;
  }
  this.push = replicate(src, target, opts);

  this.pull = replicate(target, src, opts);
  var emittedCancel = false;
  function onCancel(data) {
    if (!emittedCancel) {
      emittedCancel = true;
      self.emit('cancel', data);
    }
  }

  function pullChange(change) {
    self.emit('change', {
      direction: 'pull',
      change: change
    });
  }
  function pushChange(change) {
    self.emit('change', {
      direction: 'push',
      change: change
    });
  }
  var listeners = {};

  function removal(event, func) {
    if (event === 'change' &&
      (func === pullChange ||
      func === pushChange)) {
      self.removeAllListeners('change');
    } else if (event === 'cancel' &&
      func === onCancel) {
      self.removeAllListeners('cancel');
    } else if (event in listeners && func === listeners[event]) {
      self.removeAllListeners(event);
    }
  }

  this.on('newListener', function (event) {
    if (event === 'change') {
      self.pull.on('change', pullChange);
      self.push.on('change', pushChange);
    } else if (event === 'cancel') {
      self.pull.on('cancel', onCancel);
      self.push.on('cancel', onCancel);
    } else if (event !== 'error' &&
      event !== 'complete' && !(event in listeners)) {
      listeners[event] = function (e) {
        self.emit(event, e);
      };
      self.pull.on(event, listeners[event]);
      self.push.on(event, listeners[event]);
    }
  });

  this.on('removeListener', function (event) {
    if (event === 'change') {
      self.pull.removeListener('change', pullChange);
      self.push.removeListener('change', pushChange);
    } else if (event === 'cancel') {
      self.pull.removeListener('cancel', onCancel);
      self.push.removeListener('cancel', onCancel);
    } else if (event in listeners) {
      if (typeof listeners[event] === 'function') {
        self.pull.removeListener(event, listeners[event]);
        self.push.removeListener(event, listeners[event]);
        delete listeners[event];
      }
    }
  });

  this.pull.on('removeListener', removal);
  this.push.on('removeListener', removal);

  var promise = utils.Promise.all([
    this.push,
    this.pull
  ]).then(function (resp) {
    var out = {
      push: resp[0],
      pull: resp[1]
    };
    self.emit('complete', out);
    if (complete) {
      complete(null, out);
    }
    self.removeAllListeners();
    return out;
  }, function (err) {
    self.cancel();
    self.emit('error', err);
    if (complete) {
      complete(err);
    }
    self.removeAllListeners();
    throw err;
  });

  this.then = function (success, err) {
    return promise.then(success, err);
  };

  this["catch"] = function (err) {
    return promise["catch"](err);
  };
}

Sync.prototype.cancel = function () {
  if (!this.canceled) {
    this.canceled = true;
    this.push.cancel();
    this.pull.cancel();
  }
};
},{"./replicate":85,"./utils":89,"events":57}],88:[function(require,module,exports){
'use strict';

module.exports = TaskQueue;

function TaskQueue() {
  this.isReady = false;
  this.failed = false;
  this.queue = [];
}

TaskQueue.prototype.execute = function () {
  var d, func;
  if (this.failed) {
    while ((d = this.queue.shift())) {
      if (typeof d === 'function') {
        d(this.failed);
        continue;
      }
      func = d.parameters[d.parameters.length - 1];
      if (typeof func === 'function') {
        func(this.failed);
      } else if (d.name === 'changes' && typeof func.complete === 'function') {
        func.complete(this.failed);
      }
    }
  } else if (this.isReady) {
    while ((d = this.queue.shift())) {

      if (typeof d === 'function') {
        d();
      } else {
        d.task = this.db[d.name].apply(this.db, d.parameters);
      }
    }
  }
};

TaskQueue.prototype.fail = function (err) {
  this.failed = err;
  this.execute();
};

TaskQueue.prototype.ready = function (db) {
  if (this.failed) {
    return false;
  } else if (arguments.length === 0) {
    return this.isReady;
  }
  this.isReady = db ? true: false;
  this.db = db;
  this.execute();
};

TaskQueue.prototype.addTask = function (name, parameters) {
  if (typeof name === 'function') {
    this.queue.push(name);
    if (this.failed) {
      this.execute();
    }
  } else {
    var task = { name: name, parameters: parameters };
    this.queue.push(task);
    if (this.failed) {
      this.execute();
    }
    return task;
  }
};

},{}],89:[function(require,module,exports){
(function (process,global){
/*jshint strict: false */
/*global chrome */
var crypto = require('crypto');
var md5 = require('md5-jkmyers');
var merge = require('./merge');
exports.extend = require('pouchdb-extend');
exports.ajax = require('./deps/ajax');
exports.createBlob = require('./deps/blob');
exports.uuid = require('./deps/uuid');
exports.getArguments = require('argsarray');
var buffer = require('./deps/buffer');
var errors = require('./deps/errors');
var EventEmitter = require('events').EventEmitter;

if (typeof global.Promise === 'function') {
  exports.Promise = global.Promise;
} else {
  exports.Promise = require('bluebird');
}
var Promise = exports.Promise;

function toObject(array) {
  var obj = {};
  array.forEach(function (item) { obj[item] = true; });
  return obj;
}
// List of top level reserved words for doc
var reservedWords = toObject([
  '_id',
  '_rev',
  '_attachments',
  '_deleted',
  '_revisions',
  '_revs_info',
  '_conflicts',
  '_deleted_conflicts',
  '_local_seq',
  '_rev_tree'
]);
exports.clone = function (obj) {
  return exports.extend(true, {}, obj);
};
exports.inherits = require('inherits');
// Determine id an ID is valid
//   - invalid IDs begin with an underescore that does not begin '_design' or 
//     '_local'
//   - any other string value is a valid id
// Returns the specific error object for each case
exports.invalidIdError = function (id) {
  if (!id) {
    return errors.MISSING_ID;
  } else if (typeof id !== 'string') {
    return errors.INVALID_ID;
  } else if (/^_/.test(id) && !(/^_(design|local)/).test(id)) {
    return errors.RESERVED_ID;
  }
};

function isChromeApp() {
  return (typeof chrome !== "undefined" &&
          typeof chrome.storage !== "undefined" &&
          typeof chrome.storage.local !== "undefined");
}

// Pretty dumb name for a function, just wraps callback calls so we dont
// to if (callback) callback() everywhere
exports.call = exports.getArguments(function (args) {
  if (!args.length) {
    return;
  }
  var fun = args.shift();
  if (typeof fun === 'function') {
    fun.apply(this, args);
  }
});

exports.isLocalId = function (id) {
  return (/^_local/).test(id);
};

// check if a specific revision of a doc has been deleted
//  - metadata: the metadata object from the doc store
//  - rev: (optional) the revision to check. defaults to winning revision
exports.isDeleted = function (metadata, rev) {
  if (!rev) {
    rev = merge.winningRev(metadata);
  }
  var dashIndex = rev.indexOf('-');
  if (dashIndex !== -1) {
    rev = rev.substring(dashIndex + 1);
  }
  var deleted = false;
  merge.traverseRevTree(metadata.rev_tree,
  function (isLeaf, pos, id, acc, opts) {
    if (id === rev) {
      deleted = !!opts.deleted;
    }
  });

  return deleted;
};

exports.filterChange = function (opts) {
  return function (change) {
    var req = {};
    var hasFilter = opts.filter && typeof opts.filter === 'function';

    req.query = opts.query_params;
    if (opts.filter && hasFilter && !opts.filter.call(this, change.doc, req)) {
      return false;
    }
    if (opts.doc_ids && opts.doc_ids.indexOf(change.id) === -1) {
      return false;
    }
    if (!opts.include_docs) {
      delete change.doc;
    } else {
      for (var att in change.doc._attachments) {
        if (change.doc._attachments.hasOwnProperty(att)) {
          change.doc._attachments[att].stub = true;
        }
      }
    }
    return true;
  };
};

// Preprocess documents, parse their revisions, assign an id and a
// revision for new writes that are missing them, etc
exports.parseDoc = function (doc, newEdits) {
  var nRevNum;
  var newRevId;
  var revInfo;
  var opts = {status: 'available'};
  if (doc._deleted) {
    opts.deleted = true;
  }

  if (newEdits) {
    if (!doc._id) {
      doc._id = exports.uuid();
    }
    newRevId = exports.uuid(32, 16).toLowerCase();
    if (doc._rev) {
      revInfo = /^(\d+)-(.+)$/.exec(doc._rev);
      if (!revInfo) {
        throw "invalid value for property '_rev'";
      }
      doc._rev_tree = [{
        pos: parseInt(revInfo[1], 10),
        ids: [revInfo[2], {status: 'missing'}, [[newRevId, opts, []]]]
      }];
      nRevNum = parseInt(revInfo[1], 10) + 1;
    } else {
      doc._rev_tree = [{
        pos: 1,
        ids : [newRevId, opts, []]
      }];
      nRevNum = 1;
    }
  } else {
    if (doc._revisions) {
      doc._rev_tree = [{
        pos: doc._revisions.start - doc._revisions.ids.length + 1,
        ids: doc._revisions.ids.reduce(function (acc, x) {
          if (acc === null) {
            return [x, opts, []];
          } else {
            return [x, {status: 'missing'}, [acc]];
          }
        }, null)
      }];
      nRevNum = doc._revisions.start;
      newRevId = doc._revisions.ids[0];
    }
    if (!doc._rev_tree) {
      revInfo = /^(\d+)-(.+)$/.exec(doc._rev);
      if (!revInfo) {
        return errors.BAD_ARG;
      }
      nRevNum = parseInt(revInfo[1], 10);
      newRevId = revInfo[2];
      doc._rev_tree = [{
        pos: parseInt(revInfo[1], 10),
        ids: [revInfo[2], opts, []]
      }];
    }
  }

  var error = exports.invalidIdError(doc._id);
  if (error) {
    return error;
  }

  doc._id = decodeURIComponent(doc._id);
  doc._rev = [nRevNum, newRevId].join('-');

  var result = {metadata : {}, data : {}};
  for (var key in doc) {
    if (doc.hasOwnProperty(key)) {
      var specialKey = key[0] === '_';
      if (specialKey && !reservedWords[key]) {
        error = errors.error(errors.DOC_VALIDATION);
        error.reason += ': ' + key;
        return error;
      } else if (specialKey && key !== '_attachments') {
        result.metadata[key.slice(1)] = doc[key];
      } else {
        result.data[key] = doc[key];
      }
    }
  }
  return result;
};

exports.isCordova = function () {
  return (typeof cordova !== "undefined" ||
          typeof PhoneGap !== "undefined" ||
          typeof phonegap !== "undefined");
};

exports.hasLocalStorage = function () {
  if (isChromeApp()) {
    return false;
  }
  try {
    return global.localStorage;
  } catch (e) {
    return false;
  }
};
exports.Changes = Changes;
exports.inherits(Changes, EventEmitter);
function Changes() {
  if (!(this instanceof Changes)) {
    return new Changes();
  }
  var self = this;
  EventEmitter.call(this);
  this.isChrome = isChromeApp();
  this.listeners = {};
  this.hasLocal = false;
  if (!this.isChrome) {
    this.hasLocal = exports.hasLocalStorage();
  }
  if (this.isChrome) {
    chrome.storage.onChanged.addListener(function (e) {
      // make sure it's event addressed to us
      if (e.db_name != null) {
        //object only has oldValue, newValue members
        self.emit(e.dbName.newValue);
      }
    });
  } else if (this.hasLocal) {
    if (global.addEventListener) {
      global.addEventListener("storage", function (e) {
        self.emit(e.key);
      });
    } else {
      global.attachEvent("storage", function (e) {
        self.emit(e.key);
      });
    }
  }

}
Changes.prototype.addListener = function (dbName, id, db, opts) {
  if (this.listeners[id]) {
    return;
  }
  function eventFunction() {
    db.changes({
      include_docs: opts.include_docs,
      conflicts: opts.conflicts,
      continuous: false,
      descending: false,
      filter: opts.filter,
      view: opts.view,
      since: opts.since,
      query_params: opts.query_params,
      onChange: function (c) {
        if (c.seq > opts.since && !opts.cancelled) {
          opts.since = c.seq;
          exports.call(opts.onChange, c);
        }
      }
    });
  }
  this.listeners[id] = eventFunction;
  this.on(dbName, eventFunction);
};

Changes.prototype.removeListener = function (dbName, id) {
  if (!(id in this.listeners)) {
    return;
  }
  EventEmitter.prototype.removeListener.call(this, dbName,
    this.listeners[id]);
};


Changes.prototype.notifyLocalWindows = function (dbName) {
  //do a useless change on a storage thing
  //in order to get other windows's listeners to activate
  if (this.isChrome) {
    chrome.storage.local.set({dbName: dbName});
  } else if (this.hasLocal) {
    localStorage[dbName] = (localStorage[dbName] === "a") ? "b" : "a";
  }
};

Changes.prototype.notify = function (dbName) {
  this.emit(dbName);
  this.notifyLocalWindows(dbName);
};

if (!process.browser || !('atob' in global)) {
  exports.atob = function (str) {
    var base64 = new buffer(str, 'base64');
    // Node.js will just skip the characters it can't encode instead of
    // throwing and exception
    if (base64.toString('base64') !== str) {
      throw ("Cannot base64 encode full string");
    }
    return base64.toString('binary');
  };
} else {
  exports.atob = function (str) {
    return atob(str);
  };
}

if (!process.browser || !('btoa' in global)) {
  exports.btoa = function (str) {
    return new buffer(str, 'binary').toString('base64');
  };
} else {
  exports.btoa = function (str) {
    return btoa(str);
  };
}

// From http://stackoverflow.com/questions/14967647/ (continues on next line)
// encode-decode-image-with-base64-breaks-image (2013-04-21)
exports.fixBinary = function (bin) {
  if (!process.browser) {
    // don't need to do this in Node
    return bin;
  }

  var length = bin.length;
  var buf = new ArrayBuffer(length);
  var arr = new Uint8Array(buf);
  for (var i = 0; i < length; i++) {
    arr[i] = bin.charCodeAt(i);
  }
  return buf;
};

exports.once = function (fun) {
  var called = false;
  return exports.getArguments(function (args) {
    if (called) {
      if (typeof console.trace === 'function') {
        console.trace();
      }
      throw new Error('once called  more than once');
    } else {
      called = true;
      fun.apply(this, args);
    }
  });
};

exports.toPromise = function (func) {
  //create the function we will be returning
  return exports.getArguments(function (args) {
    var self = this;
    var tempCB =
      (typeof args[args.length - 1] === 'function') ? args.pop() : false;
    // if the last argument is a function, assume its a callback
    var usedCB;
    if (tempCB) {
      // if it was a callback, create a new callback which calls it,
      // but do so async so we don't trap any errors
      usedCB = function (err, resp) {
        process.nextTick(function () {
          tempCB(err, resp);
        });
      };
    }
    var promise = new Promise(function (fulfill, reject) {
      var resp;
      try {
        var callback = exports.once(function (err, mesg) {
          if (err) {
            reject(err);
          } else {
            fulfill(mesg);
          }
        });
        // create a callback for this invocation
        // apply the function in the orig context
        args.push(callback);
        resp = func.apply(self, args);
        if (resp && typeof resp.then === 'function') {
          fulfill(resp);
        }
      } catch (e) {
        reject(e);
      }
    });
    // if there is a callback, call it back
    if (usedCB) {
      promise.then(function (result) {
        usedCB(null, result);
      }, usedCB);
    }
    promise.cancel = function () {
      return this;
    };
    return promise;
  });
};

exports.adapterFun = function (name, callback) {
  return exports.toPromise(exports.getArguments(function (args) {
    if (this._closed) {
      return Promise.reject(new Error('database is closed'));
    }
    var self = this;
    if (!this.taskqueue.isReady) {
      return new exports.Promise(function (fulfill, reject) {
        self.taskqueue.addTask(function (failed) {
          if (failed) {
            reject(failed);
          } else {
            fulfill(self[name].apply(self, args));
          }
        });
      });
    }
    return callback.apply(this, args);
  }));
};
//Can't find original post, but this is close
//http://stackoverflow.com/questions/6965107/ (continues on next line)
//converting-between-strings-and-arraybuffers
exports.arrayBufferToBinaryString = function (buffer) {
  var binary = "";
  var bytes = new Uint8Array(buffer);
  var length = bytes.byteLength;
  for (var i = 0; i < length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return binary;
};

exports.cancellableFun = function (fun, self, opts) {

  opts = opts ? exports.clone(true, {}, opts) : {};

  var emitter = new EventEmitter();
  var oldComplete = opts.complete || function () { };
  var complete = opts.complete = exports.once(function (err, resp) {
    if (err) {
      oldComplete(err);
    } else {
      emitter.emit('end', resp);
      oldComplete(null, resp);
    }
    emitter.removeAllListeners();
  });
  var oldOnChange = opts.onChange || function () {};
  var lastChange = 0;
  self.on('destroyed', function () {
    emitter.removeAllListeners();
  });
  opts.onChange = function (change) {
    oldOnChange(change);
    if (change.seq <= lastChange) {
      return;
    }
    lastChange = change.seq;
    emitter.emit('change', change);
    if (change.deleted) {
      emitter.emit('delete', change);
    } else if (change.changes.length === 1 &&
      change.changes[0].rev.slice(0, 1) === '1-') {
      emitter.emit('create', change);
    } else {
      emitter.emit('update', change);
    }
  };
  var promise = new Promise(function (fulfill, reject) {
    opts.complete = function (err, res) {
      if (err) {
        reject(err);
      } else {
        fulfill(res);
      }
    };
  });

  promise.then(function (result) {
    complete(null, result);
  }, complete);

  // this needs to be overwridden by caller, dont fire complete until
  // the task is ready
  promise.cancel = function () {
    promise.isCancelled = true;
    if (self.taskqueue.isReady) {
      opts.complete(null, {status: 'cancelled'});
    }
  };

  if (!self.taskqueue.isReady) {
    self.taskqueue.addTask(function () {
      if (promise.isCancelled) {
        opts.complete(null, {status: 'cancelled'});
      } else {
        fun(self, opts, promise);
      }
    });
  } else {
    fun(self, opts, promise);
  }
  promise.on = emitter.on.bind(emitter);
  promise.once = emitter.once.bind(emitter);
  promise.addListener = emitter.addListener.bind(emitter);
  promise.removeListener = emitter.removeListener.bind(emitter);
  promise.removeAllListeners = emitter.removeAllListeners.bind(emitter);
  promise.setMaxListeners = emitter.setMaxListeners.bind(emitter);
  promise.listeners = emitter.listeners.bind(emitter);
  promise.emit = emitter.emit.bind(emitter);
  return promise;
};
exports.Crypto = {};
exports.MD5 = exports.Crypto.MD5 = function (string) {
  if (!process.browser) {
    return crypto.createHash('md5').update(string).digest('hex');
  } else {
    return md5(string);
  }
};

}).call(this,require("JkpR2F"),typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"./deps/ajax":76,"./deps/blob":77,"./deps/buffer":53,"./deps/errors":78,"./deps/uuid":80,"./merge":84,"JkpR2F":59,"argsarray":91,"bluebird":96,"crypto":53,"events":57,"inherits":92,"md5-jkmyers":110,"pouchdb-extend":111}],90:[function(require,module,exports){
module.exports = "2.2.3";

},{}],91:[function(require,module,exports){
'use strict';

module.exports = argsArray;

function argsArray(fun) {
  return function () {
    var len = arguments.length;
    if (len) {
      var args = [];
      var i = -1;
      while (++i < len) {
        args[i] = arguments[i];
      }
      return fun.call(this, args);
    } else {
      return fun.call(this, []);
    }
  };
}
},{}],92:[function(require,module,exports){
module.exports=require(58)
},{}],93:[function(require,module,exports){
'use strict';

module.exports = INTERNAL;

function INTERNAL() {}
},{}],94:[function(require,module,exports){
'use strict';
var Promise = require('./promise');
var reject = require('./reject');
var resolve = require('./resolve');
var INTERNAL = require('./INTERNAL');
var handlers = require('./handlers');
var noArray = reject(new TypeError('must be an array'));
module.exports = function all(iterable) {
  if (Object.prototype.toString.call(iterable) !== '[object Array]') {
    return noArray;
  }

  var len = iterable.length;
  var called = false;
  if (!len) {
    return resolve([]);
  }

  var values = new Array(len);
  var resolved = 0;
  var i = -1;
  var promise = new Promise(INTERNAL);
  
  while (++i < len) {
    allResolver(iterable[i], i);
  }
  return promise;
  function allResolver(value, i) {
    resolve(value).then(resolveFromAll, function (error) {
      if (!called) {
        called = true;
        handlers.reject(promise, error);
      }
    });
    function resolveFromAll(outValue) {
      values[i] = outValue;
      if (++resolved === len & !called) {
        called = true;
        handlers.resolve(promise, values);
      }
    }
  }
};
},{"./INTERNAL":93,"./handlers":95,"./promise":97,"./reject":99,"./resolve":100}],95:[function(require,module,exports){
'use strict';
var tryCatch = require('./tryCatch');
var resolveThenable = require('./resolveThenable');
var states = require('./states');

exports.resolve = function (self, value) {
  var result = tryCatch(getThen, value);
  if (result.status === 'error') {
    return exports.reject(self, result.value);
  }
  var thenable = result.value;

  if (thenable) {
    resolveThenable.safely(self, thenable);
  } else {
    self.state = states.FULFILLED;
    self.outcome = value;
    var i = -1;
    var len = self.queue.length;
    while (++i < len) {
      self.queue[i].callFulfilled(value);
    }
  }
  return self;
};
exports.reject = function (self, error) {
  self.state = states.REJECTED;
  self.outcome = error;
  var i = -1;
  var len = self.queue.length;
  while (++i < len) {
    self.queue[i].callRejected(error);
  }
  return self;
};

function getThen(obj) {
  // Make sure we only access the accessor once as required by the spec
  var then = obj && obj.then;
  if (obj && typeof obj === 'object' && typeof then === 'function') {
    return function appyThen() {
      then.apply(obj, arguments);
    };
  }
}
},{"./resolveThenable":101,"./states":102,"./tryCatch":103}],96:[function(require,module,exports){
module.exports = exports = require('./promise');

exports.resolve = require('./resolve');
exports.reject = require('./reject');
exports.all = require('./all');
},{"./all":94,"./promise":97,"./reject":99,"./resolve":100}],97:[function(require,module,exports){
'use strict';

var unwrap = require('./unwrap');
var INTERNAL = require('./INTERNAL');
var resolveThenable = require('./resolveThenable');
var states = require('./states');
var QueueItem = require('./queueItem');

module.exports = Promise;
function Promise(resolver) {
  if (!(this instanceof Promise)) {
    return new Promise(resolver);
  }
  if (typeof resolver !== 'function') {
    throw new TypeError('reslover must be a function');
  }
  this.state = states.PENDING;
  this.queue = [];
  this.outcome = void 0;
  if (resolver !== INTERNAL) {
    resolveThenable.safely(this, resolver);
  }
}

Promise.prototype['catch'] = function (onRejected) {
  return this.then(null, onRejected);
};
Promise.prototype.then = function (onFulfilled, onRejected) {
  if (typeof onFulfilled !== 'function' && this.state === states.FULFILLED ||
    typeof onRejected !== 'function' && this.state === states.REJECTED) {
    return this;
  }
  var promise = new Promise(INTERNAL);

  
  if (this.state !== states.PENDING) {
    var resolver = this.state === states.FULFILLED ? onFulfilled: onRejected;
    unwrap(promise, resolver, this.outcome);
  } else {
    this.queue.push(new QueueItem(promise, onFulfilled, onRejected));
  }

  return promise;
};

},{"./INTERNAL":93,"./queueItem":98,"./resolveThenable":101,"./states":102,"./unwrap":104}],98:[function(require,module,exports){
'use strict';
var handlers = require('./handlers');
var unwrap = require('./unwrap');

module.exports = QueueItem;
function QueueItem(promise, onFulfilled, onRejected) {
  this.promise = promise;
  if (typeof onFulfilled === 'function') {
    this.onFulfilled = onFulfilled;
    this.callFulfilled = this.otherCallFulfilled;
  }
  if (typeof onRejected === 'function') {
    this.onRejected = onRejected;
    this.callRejected = this.otherCallRejected;
  }
}
QueueItem.prototype.callFulfilled = function (value) {
  handlers.resolve(this.promise, value);
};
QueueItem.prototype.otherCallFulfilled = function (value) {
  unwrap(this.promise, this.onFulfilled, value);
};
QueueItem.prototype.callRejected = function (value) {
  handlers.reject(this.promise, value);
};
QueueItem.prototype.otherCallRejected = function (value) {
  unwrap(this.promise, this.onRejected, value);
};
},{"./handlers":95,"./unwrap":104}],99:[function(require,module,exports){
'use strict';

var Promise = require('./promise');
var INTERNAL = require('./INTERNAL');
var handlers = require('./handlers');
module.exports = reject;

function reject(reason) {
	var promise = new Promise(INTERNAL);
	return handlers.reject(promise, reason);
}
},{"./INTERNAL":93,"./handlers":95,"./promise":97}],100:[function(require,module,exports){
'use strict';

var Promise = require('./promise');
var INTERNAL = require('./INTERNAL');
var handlers = require('./handlers');
module.exports = resolve;

var FALSE = handlers.resolve(new Promise(INTERNAL), false);
var NULL = handlers.resolve(new Promise(INTERNAL), null);
var UNDEFINED = handlers.resolve(new Promise(INTERNAL), void 0);
var ZERO = handlers.resolve(new Promise(INTERNAL), 0);
var EMPTYSTRING = handlers.resolve(new Promise(INTERNAL), '');

function resolve(value) {
  if (value) {
    if (value instanceof Promise) {
      return value;
    }
    return handlers.resolve(new Promise(INTERNAL), value);
  }
  var valueType = typeof value;
  switch (valueType) {
    case 'boolean':
      return FALSE;
    case 'undefined':
      return UNDEFINED;
    case 'object':
      return NULL;
    case 'number':
      return ZERO;
    case 'string':
      return EMPTYSTRING;
  }
}
},{"./INTERNAL":93,"./handlers":95,"./promise":97}],101:[function(require,module,exports){
'use strict';
var handlers = require('./handlers');
var tryCatch = require('./tryCatch');
function safelyResolveThenable(self, thenable) {
  // Either fulfill, reject or reject with error
  var called = false;
  function onError(value) {
    if (called) {
      return;
    }
    called = true;
    handlers.reject(self, value);
  }

  function onSuccess(value) {
    if (called) {
      return;
    }
    called = true;
    handlers.resolve(self, value);
  }

  function tryToUnwrap() {
    thenable(onSuccess, onError);
  }
  
  var result = tryCatch(tryToUnwrap);
  if (result.status === 'error') {
    onError(result.value);
  }
}
exports.safely = safelyResolveThenable;
},{"./handlers":95,"./tryCatch":103}],102:[function(require,module,exports){
// Lazy man's symbols for states

exports.REJECTED = ['REJECTED'];
exports.FULFILLED = ['FULFILLED'];
exports.PENDING = ['PENDING'];
},{}],103:[function(require,module,exports){
'use strict';

module.exports = tryCatch;

function tryCatch(func, value) {
  var out = {};
  try {
    out.value = func(value);
    out.status = 'success';
  } catch (e) {
    out.status = 'error';
    out.value = e;
  }
  return out;
}
},{}],104:[function(require,module,exports){
'use strict';

var immediate = require('immediate');
var handlers = require('./handlers');
module.exports = unwrap;

function unwrap(promise, func, value) {
  immediate(function () {
    var returnValue;
    try {
      returnValue = func(value);
    } catch (e) {
      return handlers.reject(promise, e);
    }
    if (returnValue === promise) {
      handlers.reject(promise, new TypeError('Cannot resolve promise with itself'));
    } else {
      handlers.resolve(promise, returnValue);
    }
  });
}
},{"./handlers":95,"immediate":105}],105:[function(require,module,exports){
'use strict';
var types = [
  require('./nextTick'),
  require('./mutation.js'),
  require('./messageChannel'),
  require('./stateChange'),
  require('./timeout')
];
var draining;
var queue = [];
function drainQueue() {
  draining = true;
  var i, oldQueue;
  var len = queue.length;
  while (len) {
    oldQueue = queue;
    queue = [];
    i = -1;
    while (++i < len) {
      oldQueue[i]();
    }
    len = queue.length;
  }
  draining = false;
}
var scheduleDrain;
var i = -1;
var len = types.length;
while (++ i < len) {
  if (types[i] && types[i].test && types[i].test()) {
    scheduleDrain = types[i].install(drainQueue);
    break;
  }
}
module.exports = immediate;
function immediate(task) {
  if (queue.push(task) === 1 && !draining) {
    scheduleDrain();
  }
}
},{"./messageChannel":106,"./mutation.js":107,"./nextTick":53,"./stateChange":108,"./timeout":109}],106:[function(require,module,exports){
(function (global){
'use strict';

exports.test = function () {
  if (global.setImmediate) {
    // we can only get here in IE10
    // which doesn't handel postMessage well
    return false;
  }
  return typeof global.MessageChannel !== 'undefined';
};

exports.install = function (func) {
  var channel = new global.MessageChannel();
  channel.port1.onmessage = func;
  return function () {
    channel.port2.postMessage(0);
  };
};
}).call(this,typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{}],107:[function(require,module,exports){
(function (global){
'use strict';
//based off rsvp https://github.com/tildeio/rsvp.js
//license https://github.com/tildeio/rsvp.js/blob/master/LICENSE
//https://github.com/tildeio/rsvp.js/blob/master/lib/rsvp/asap.js

var Mutation = global.MutationObserver || global.WebKitMutationObserver;

exports.test = function () {
  return Mutation;
};

exports.install = function (handle) {
  var called = 0;
  var observer = new Mutation(handle);
  var element = global.document.createTextNode('');
  observer.observe(element, {
    characterData: true
  });
  return function () {
    element.data = (called = ++called % 2);
  };
};
}).call(this,typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{}],108:[function(require,module,exports){
(function (global){
'use strict';

exports.test = function () {
  return 'document' in global && 'onreadystatechange' in global.document.createElement('script');
};

exports.install = function (handle) {
  return function () {

    // Create a <script> element; its readystatechange event will be fired asynchronously once it is inserted
    // into the document. Do so, thus queuing up the task. Remember to clean up once it's been called.
    var scriptEl = global.document.createElement('script');
    scriptEl.onreadystatechange = function () {
      handle();

      scriptEl.onreadystatechange = null;
      scriptEl.parentNode.removeChild(scriptEl);
      scriptEl = null;
    };
    global.document.documentElement.appendChild(scriptEl);

    return handle;
  };
};
}).call(this,typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{}],109:[function(require,module,exports){
'use strict';
exports.test = function () {
  return true;
};

exports.install = function (t) {
  return function () {
    setTimeout(t, 0);
  };
};
},{}],110:[function(require,module,exports){
!function(a,b){"function"==typeof define&&define.amd?define(b):"object"==typeof exports?module.exports=b():a.md5=b()}(this,function(){function a(a,b){var g=a[0],h=a[1],i=a[2],j=a[3];g=c(g,h,i,j,b[0],7,-680876936),j=c(j,g,h,i,b[1],12,-389564586),i=c(i,j,g,h,b[2],17,606105819),h=c(h,i,j,g,b[3],22,-1044525330),g=c(g,h,i,j,b[4],7,-176418897),j=c(j,g,h,i,b[5],12,1200080426),i=c(i,j,g,h,b[6],17,-1473231341),h=c(h,i,j,g,b[7],22,-45705983),g=c(g,h,i,j,b[8],7,1770035416),j=c(j,g,h,i,b[9],12,-1958414417),i=c(i,j,g,h,b[10],17,-42063),h=c(h,i,j,g,b[11],22,-1990404162),g=c(g,h,i,j,b[12],7,1804603682),j=c(j,g,h,i,b[13],12,-40341101),i=c(i,j,g,h,b[14],17,-1502002290),h=c(h,i,j,g,b[15],22,1236535329),g=d(g,h,i,j,b[1],5,-165796510),j=d(j,g,h,i,b[6],9,-1069501632),i=d(i,j,g,h,b[11],14,643717713),h=d(h,i,j,g,b[0],20,-373897302),g=d(g,h,i,j,b[5],5,-701558691),j=d(j,g,h,i,b[10],9,38016083),i=d(i,j,g,h,b[15],14,-660478335),h=d(h,i,j,g,b[4],20,-405537848),g=d(g,h,i,j,b[9],5,568446438),j=d(j,g,h,i,b[14],9,-1019803690),i=d(i,j,g,h,b[3],14,-187363961),h=d(h,i,j,g,b[8],20,1163531501),g=d(g,h,i,j,b[13],5,-1444681467),j=d(j,g,h,i,b[2],9,-51403784),i=d(i,j,g,h,b[7],14,1735328473),h=d(h,i,j,g,b[12],20,-1926607734),g=e(g,h,i,j,b[5],4,-378558),j=e(j,g,h,i,b[8],11,-2022574463),i=e(i,j,g,h,b[11],16,1839030562),h=e(h,i,j,g,b[14],23,-35309556),g=e(g,h,i,j,b[1],4,-1530992060),j=e(j,g,h,i,b[4],11,1272893353),i=e(i,j,g,h,b[7],16,-155497632),h=e(h,i,j,g,b[10],23,-1094730640),g=e(g,h,i,j,b[13],4,681279174),j=e(j,g,h,i,b[0],11,-358537222),i=e(i,j,g,h,b[3],16,-722521979),h=e(h,i,j,g,b[6],23,76029189),g=e(g,h,i,j,b[9],4,-640364487),j=e(j,g,h,i,b[12],11,-421815835),i=e(i,j,g,h,b[15],16,530742520),h=e(h,i,j,g,b[2],23,-995338651),g=f(g,h,i,j,b[0],6,-198630844),j=f(j,g,h,i,b[7],10,1126891415),i=f(i,j,g,h,b[14],15,-1416354905),h=f(h,i,j,g,b[5],21,-57434055),g=f(g,h,i,j,b[12],6,1700485571),j=f(j,g,h,i,b[3],10,-1894986606),i=f(i,j,g,h,b[10],15,-1051523),h=f(h,i,j,g,b[1],21,-2054922799),g=f(g,h,i,j,b[8],6,1873313359),j=f(j,g,h,i,b[15],10,-30611744),i=f(i,j,g,h,b[6],15,-1560198380),h=f(h,i,j,g,b[13],21,1309151649),g=f(g,h,i,j,b[4],6,-145523070),j=f(j,g,h,i,b[11],10,-1120210379),i=f(i,j,g,h,b[2],15,718787259),h=f(h,i,j,g,b[9],21,-343485551),a[0]=l(g,a[0]),a[1]=l(h,a[1]),a[2]=l(i,a[2]),a[3]=l(j,a[3])}function b(a,b,c,d,e,f){return b=l(l(b,a),l(d,f)),l(b<<e|b>>>32-e,c)}function c(a,c,d,e,f,g,h){return b(c&d|~c&e,a,c,f,g,h)}function d(a,c,d,e,f,g,h){return b(c&e|d&~e,a,c,f,g,h)}function e(a,c,d,e,f,g,h){return b(c^d^e,a,c,f,g,h)}function f(a,c,d,e,f,g,h){return b(d^(c|~e),a,c,f,g,h)}function g(b){txt="";var c,d=b.length,e=[1732584193,-271733879,-1732584194,271733878];for(c=64;c<=b.length;c+=64)a(e,h(b.substring(c-64,c)));b=b.substring(c-64);var f=[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];for(c=0;c<b.length;c++)f[c>>2]|=b.charCodeAt(c)<<(c%4<<3);if(f[c>>2]|=128<<(c%4<<3),c>55)for(a(e,f),c=0;16>c;c++)f[c]=0;return f[14]=8*d,a(e,f),e}function h(a){var b,c=[];for(b=0;64>b;b+=4)c[b>>2]=a.charCodeAt(b)+(a.charCodeAt(b+1)<<8)+(a.charCodeAt(b+2)<<16)+(a.charCodeAt(b+3)<<24);return c}function i(a){for(var b="",c=0;4>c;c++)b+=m[a>>8*c+4&15]+m[a>>8*c&15];return b}function j(a){for(var b=0;b<a.length;b++)a[b]=i(a[b]);return a.join("")}function k(a){return j(g(a))}function l(a,b){return a+b&4294967295}function l(a,b){var c=(65535&a)+(65535&b),d=(a>>16)+(b>>16)+(c>>16);return d<<16|65535&c}var m="0123456789abcdef".split("");return"5d41402abc4b2a76b9719d911017c592"!=k("hello"),k});
},{}],111:[function(require,module,exports){
"use strict";

// Extends method
// (taken from http://code.jquery.com/jquery-1.9.0.js)
// Populate the class2type map
var class2type = {};

var types = [
  "Boolean", "Number", "String", "Function", "Array",
  "Date", "RegExp", "Object", "Error"
];
for (var i = 0; i < types.length; i++) {
  var typename = types[i];
  class2type["[object " + typename + "]"] = typename.toLowerCase();
}

var core_toString = class2type.toString;
var core_hasOwn = class2type.hasOwnProperty;

function type(obj) {
  if (obj === null) {
    return String(obj);
  }
  return typeof obj === "object" || typeof obj === "function" ?
    class2type[core_toString.call(obj)] || "object" :
    typeof obj;
}

function isWindow(obj) {
  return obj !== null && obj === obj.window;
}

function isPlainObject(obj) {
  // Must be an Object.
  // Because of IE, we also have to check the presence of
  // the constructor property.
  // Make sure that DOM nodes and window objects don't pass through, as well
  if (!obj || type(obj) !== "object" || obj.nodeType || isWindow(obj)) {
    return false;
  }

  try {
    // Not own constructor property must be Object
    if (obj.constructor &&
      !core_hasOwn.call(obj, "constructor") &&
      !core_hasOwn.call(obj.constructor.prototype, "isPrototypeOf")) {
      return false;
    }
  } catch ( e ) {
    // IE8,9 Will throw exceptions on certain host objects #9897
    return false;
  }

  // Own properties are enumerated firstly, so to speed up,
  // if last one is own, then all properties are own.
  var key;
  for (key in obj) {}

  return key === undefined || core_hasOwn.call(obj, key);
}


function isFunction(obj) {
  return type(obj) === "function";
}

var isArray = Array.isArray || function (obj) {
  return type(obj) === "array";
};

function extend() {
  var options, name, src, copy, copyIsArray, clone,
    target = arguments[0] || {},
    i = 1,
    length = arguments.length,
    deep = false;

  // Handle a deep copy situation
  if (typeof target === "boolean") {
    deep = target;
    target = arguments[1] || {};
    // skip the boolean and the target
    i = 2;
  }

  // Handle case when target is a string or something (possible in deep copy)
  if (typeof target !== "object" && !isFunction(target)) {
    target = {};
  }

  // extend jQuery itself if only one argument is passed
  if (length === i) {
    /* jshint validthis: true */
    target = this;
    --i;
  }

  for (; i < length; i++) {
    // Only deal with non-null/undefined values
    if ((options = arguments[i]) != null) {
      // Extend the base object
      for (name in options) {
        //if (options.hasOwnProperty(name)) {
        if (!(name in Object.prototype)) {

          src = target[name];
          copy = options[name];

          // Prevent never-ending loop
          if (target === copy) {
            continue;
          }

          // Recurse if we're merging plain objects or arrays
          if (deep && copy && (isPlainObject(copy) ||
              (copyIsArray = isArray(copy)))) {
            if (copyIsArray) {
              copyIsArray = false;
              clone = src && isArray(src) ? src : [];

            } else {
              clone = src && isPlainObject(src) ? src : {};
            }

            // Never move original objects, clone them
            target[name] = extend(deep, clone, copy);

          // Don't bring in undefined values
          } else if (copy !== undefined) {
            if (!(isArray(options) && isFunction(copy))) {
              target[name] = copy;
            }
          }
        }
      }
    }
  }

  // Return the modified object
  return target;
}


module.exports = extend;



},{}],112:[function(require,module,exports){
'use strict';

var upsert = require('./upsert');
var utils = require('./utils');
var Promise = utils.Promise;

module.exports = function (opts) {
  var sourceDB = opts.db;
  var viewName = opts.viewName;
  var mapFun = opts.map;
  var reduceFun = opts.reduce;
  var temporary = opts.temporary;

  // the "undefined" part is for backwards compatibility
  var viewSignature = mapFun.toString() + (reduceFun && reduceFun.toString()) +
    'undefined';

  if (!temporary && sourceDB._cachedViews) {
    var cachedView = sourceDB._cachedViews[viewSignature];
    if (cachedView) {
      return Promise.resolve(cachedView);
    }
  }

  return sourceDB.info().then(function (info) {

    var depDbName = info.db_name + '-mrview-' +
      (temporary ? 'temp' : utils.MD5(viewSignature));

    // save the view name in the source PouchDB so it can be cleaned up if necessary
    // (e.g. when the _design doc is deleted, remove all associated view data)
    function diffFunction(doc) {
      doc.views = doc.views || {};
      var fullViewName = viewName;
      if (fullViewName.indexOf('/') === -1) {
        fullViewName = viewName + '/' + viewName;
      }
      var depDbs = doc.views[fullViewName] = doc.views[fullViewName] || {};
      /* istanbul ignore if */
      if (depDbs[depDbName]) {
        return; // no update necessary
      }
      depDbs[depDbName] = true;
      return doc;
    }
    return upsert(sourceDB, '_local/mrviews', diffFunction).then(function () {
      return sourceDB.registerDependentDatabase(depDbName).then(function (res) {
        var db = res.db;
        db.auto_compaction = true;
        var view = {
          name: depDbName,
          db: db, 
          sourceDB: sourceDB,
          adapter: sourceDB.adapter,
          mapFun: mapFun,
          reduceFun: reduceFun
        };
        return view.db.get('_local/lastSeq')["catch"](function (err) {
          /* istanbul ignore if */
          if (err.name !== 'not_found') {
            throw err;
          }
        }).then(function (lastSeqDoc) {
          view.seq = lastSeqDoc ? lastSeqDoc.seq : 0;
          if (!temporary) {
            sourceDB._cachedViews = sourceDB._cachedViews || {};
            sourceDB._cachedViews[viewSignature] = view;
            view.db.on('destroyed', function () {
              delete sourceDB._cachedViews[viewSignature];
            });
          }
          return view;
        });
      });
    });
  });
};

},{"./upsert":119,"./utils":120}],113:[function(require,module,exports){
'use strict';

module.exports = function (func, emit, sum, log, isArray, toJSON) {
  /*jshint evil:true,unused:false */
  return eval("'use strict'; (" + func + ");");
};

},{}],114:[function(require,module,exports){
'use strict';

var pouchCollate = require('pouchdb-collate');
var TaskQueue = require('./taskqueue');
var collate = pouchCollate.collate;
var toIndexableString = pouchCollate.toIndexableString;
var normalizeKey = pouchCollate.normalizeKey;
var createView = require('./create-view');
var evalFunc = require('./evalfunc');
var log; 
/* istanbul ignore else */
if ((typeof console !== 'undefined') && (typeof console.log === 'function')) {
  log = Function.prototype.bind.call(console.log, console);
} else {
  log = function () {};
}
var utils = require('./utils');
var Promise = utils.Promise;
var mainQueue = new TaskQueue();
var tempViewQueue = new TaskQueue();
var CHANGES_BATCH_SIZE = 50;

function parseViewName(name) {
  // can be either 'ddocname/viewname' or just 'viewname'
  // (where the ddoc name is the same)
  return name.indexOf('/') === -1 ? [name, name] : name.split('/');
}

function tryCode(db, fun, args) {
  // emit an event if there was an error thrown by a map/reduce function.
  // putting try/catches in a single function also avoids deoptimizations.
  try {
    return {
      output : fun.apply(null, args)
    };
  } catch (e) {
    db.emit('error', e);
    return {error : e};
  }
}

function sortByKeyThenValue(x, y) {
  var keyCompare = collate(x.key, y.key);
  return keyCompare !== 0 ? keyCompare : collate(x.value, y.value);
}

function sliceResults(results, limit, skip) {
  skip = skip || 0;
  if (typeof limit === 'number') {
    return results.slice(skip, limit + skip);
  } else if (skip > 0) {
    return results.slice(skip);
  }
  return results;
}

function createBuiltInError(name) {
  var error = new Error('builtin ' + name +
    ' function requires map values to be numbers' +
    ' or number arrays');
  error.name = 'invalid_value';
  error.status = 500;
  return error;
}

function sum(values) {
  var result = 0;
  for (var i = 0, len = values.length; i < len; i++) {
    var num = values[i];
    if (typeof num !== 'number') {
      if (Array.isArray(num)) {
        // lists of numbers are also allowed, sum them separately
        result = typeof result === 'number' ? [result] : result;
        for (var j = 0, jLen = num.length; j < jLen; j++) {
          var jNum = num[j];
          if (typeof jNum !== 'number') {
            throw createBuiltInError('_sum');
          } else if (typeof result[j] === 'undefined') {
            result.push(jNum);
          } else {
            result[j] += jNum;
          }
        }
      } else { // not array/number
        throw createBuiltInError('_sum');
      }
    } else if (typeof result === 'number') {
      result += num;
    } else { // add number to array
      result[0] += num;
    }
  }
  return result;
}

var builtInReduce = {
  _sum: function (keys, values) {
    return sum(values);
  },

  _count: function (keys, values) {
    return values.length;
  },

  _stats: function (keys, values) {
    // no need to implement rereduce=true, because Pouch
    // will never call it
    function sumsqr(values) {
      var _sumsqr = 0;
      for (var i = 0, len = values.length; i < len; i++) {
        var num = values[i];
        _sumsqr += (num * num);
      }
      return _sumsqr;
    }
    return {
      sum     : sum(values),
      min     : Math.min.apply(null, values),
      max     : Math.max.apply(null, values),
      count   : values.length,
      sumsqr : sumsqr(values)
    };
  }
};

function addHttpParam(paramName, opts, params, asJson) {
  // add an http param from opts to params, optionally json-encoded
  var val = opts[paramName];
  if (typeof val !== 'undefined') {
    if (asJson) {
      val = encodeURIComponent(JSON.stringify(val));
    }
    params.push(paramName + '=' + val);
  }
}

function checkQueryParseError(options, fun) {
  var startkeyName = options.descending ? 'endkey' : 'startkey';
  var endkeyName = options.descending ? 'startkey' : 'endkey';

  if (typeof options[startkeyName] !== 'undefined' &&
    typeof options[endkeyName] !== 'undefined' &&
    collate(options[startkeyName], options[endkeyName]) > 0) {
    throw new QueryParseError('No rows can match your key range, reverse your ' +
        'start_key and end_key or set {descending : true}');
  } else if (fun.reduce && options.reduce !== false) {
    if (options.include_docs) {
      throw new QueryParseError('{include_docs:true} is invalid for reduce');
    } else if (options.keys && options.keys.length > 1 &&
        !options.group && !options.group_level) {
      throw new QueryParseError('Multi-key fetches for reduce views must use {group: true}');
    }
  }
  if (options.group_level) {
    if (typeof options.group_level !== 'number') {
      throw new QueryParseError('Invalid value for integer: "' + options.group_level + '"');
    }
    if (options.group_level < 0) {
      throw new QueryParseError('Invalid value for positive integer: ' +
        '"' + options.group_level + '"');
    }
  }
}

function httpQuery(db, fun, opts) {
  // List of parameters to add to the PUT request
  var params = [];
  var body;
  var method = 'GET';

  // If opts.reduce exists and is defined, then add it to the list
  // of parameters.
  // If reduce=false then the results are that of only the map function
  // not the final result of map and reduce.
  addHttpParam('reduce', opts, params);
  addHttpParam('include_docs', opts, params);
  addHttpParam('limit', opts, params);
  addHttpParam('descending', opts, params);
  addHttpParam('group', opts, params);
  addHttpParam('group_level', opts, params);
  addHttpParam('skip', opts, params);
  addHttpParam('startkey', opts, params, true);
  addHttpParam('endkey', opts, params, true);
  addHttpParam('inclusive_end', opts, params);
  addHttpParam('key', opts, params, true);

  // Format the list of parameters into a valid URI query string
  params = params.join('&');
  params = params === '' ? '' : '?' + params;

  // If keys are supplied, issue a POST request to circumvent GET query string limits
  // see http://wiki.apache.org/couchdb/HTTP_view_API#Querying_Options
  if (typeof opts.keys !== 'undefined') {
    var MAX_URL_LENGTH = 2000;
    // according to http://stackoverflow.com/a/417184/680742,
    // the de facto URL length limit is 2000 characters

    var keysAsString =
      'keys=' + encodeURIComponent(JSON.stringify(opts.keys));
    if (keysAsString.length + params.length + 1 <= MAX_URL_LENGTH) {
      // If the keys are short enough, do a GET. we do this to work around
      // Safari not understanding 304s on POSTs (see pouchdb/pouchdb#1239)
      params += (params[0] === '?' ? '&' : '?') + keysAsString;
    } else {
      method = 'POST';
      if (typeof fun === 'string') {
        body = JSON.stringify({keys: opts.keys});
      } else { // fun is {map : mapfun}, so append to this
        fun.keys = opts.keys;
      }
    }
  }

  // We are referencing a query defined in the design doc
  if (typeof fun === 'string') {
    var parts = parseViewName(fun);
    return db.request({
      method: method,
      url: '_design/' + parts[0] + '/_view/' + parts[1] + params,
      body: body
    });
  }

  // We are using a temporary view, terrible for performance but good for testing
  body = body || {};
  Object.keys(fun).forEach(function (key) {
    if (Array.isArray(fun[key])) {
      body[key] = fun[key];
    } else {
      body[key] = fun[key].toString();
    }
  });
  return db.request({
    method: 'POST',
    url: '_temp_view' + params,
    body: body
  });
}

function defaultsTo(value) {
  return function (reason) {
    /* istanbul ignore else */
    if (reason.name === 'not_found') {
      return value;
    } else {
      throw reason;
    }
  };
}

// returns a promise for a list of docs to update, based on the input docId.
// we update the metaDoc first (i.e. the doc that points from the sourceDB
// document Id to the ids of the documents in the mrview database), then
// the key/value docs.  that way, if lightning strikes the user's computer
// in the middle of an update, we don't write any docs that we wouldn't
// be able to find later using the metaDoc.
function getDocsToPersist(docId, view, docIdsToEmits) {
  var metaDocId = '_local/doc_' + docId;
  return view.db.get(metaDocId)[
    "catch"](defaultsTo({_id: metaDocId, keys: []}))
    .then(function (metaDoc) {
      return view.db.allDocs({
        keys: metaDoc.keys,
        include_docs: true
      }).then(function (res) {
          var kvDocs = res.rows.map(function (row) {
            return row.doc;
          }).filter(function (row) {
              return row;
            });

          var indexableKeysToKeyValues = docIdsToEmits[docId];
          var oldKeysMap = {};
          kvDocs.forEach(function (kvDoc) {
            oldKeysMap[kvDoc._id] = true;
            kvDoc._deleted = !indexableKeysToKeyValues[kvDoc._id];
            if (!kvDoc._deleted) {
              kvDoc.value = indexableKeysToKeyValues[kvDoc._id];
            }
          });

          var newKeys = Object.keys(indexableKeysToKeyValues);
          newKeys.forEach(function (key) {
            if (!oldKeysMap[key]) {
              // new doc
              kvDocs.push({
                _id: key,
                value: indexableKeysToKeyValues[key]
              });
            }
          });
          metaDoc.keys = utils.uniq(newKeys.concat(metaDoc.keys));
          kvDocs.splice(0, 0, metaDoc);

          return kvDocs;
        });
    });
}

// updates all emitted key/value docs and metaDocs in the mrview database
// for the given batch of documents from the source database
function saveKeyValues(view, docIdsToEmits, seq) {
  var seqDocId = '_local/lastSeq';
  return view.db.get(seqDocId)[
  "catch"](defaultsTo({_id: seqDocId, seq: 0}))
  .then(function (lastSeqDoc) {
    var docIds = Object.keys(docIdsToEmits);
    return Promise.all(docIds.map(function (docId) {
        return getDocsToPersist(docId, view, docIdsToEmits);
      })).then(function (listOfDocsToPersist) {
        var docsToPersist = [];
        listOfDocsToPersist.forEach(function (docList) {
          docsToPersist = docsToPersist.concat(docList);
        });

        // update the seq doc last, so that if a meteor strikes the user's
        // computer in the middle of an update, we can apply the idempotent
        // batch update operation again
        lastSeqDoc.seq = seq;
        docsToPersist.push(lastSeqDoc);

        return view.db.bulkDocs({docs : docsToPersist});
      });
  });
}

var updateView = utils.sequentialize(mainQueue, function (view) {
  // bind the emit function once
  var mapResults;
  var doc;

  function emit(key, value) {
    mapResults.push({
      id  : doc._id,
      key : normalizeKey(key),
      value : normalizeKey(value)
    });
  }

  var mapFun;
  // for temp_views one can use emit(doc, emit), see #38
  if (typeof view.mapFun === "function" && view.mapFun.length === 2) {
    var origMap = view.mapFun;
    mapFun = function (doc) {
      return origMap(doc, emit);
    };
  } else {
    mapFun = evalFunc(view.mapFun.toString(), emit, sum, log, Array.isArray, JSON.parse);
  }

  var currentSeq = view.seq || 0;

  function processChange(docIdsToEmits, seq) {
    return function () {
      return saveKeyValues(view, docIdsToEmits, seq);
    };
  }
  var queue = new TaskQueue();
  // TODO(neojski): https://github.com/daleharvey/pouchdb/issues/1521

  return new Promise(function (resolve, reject) {

    function complete() {
      queue.finish().then(function () {
        view.seq = currentSeq;
        resolve();
      });
    }

    function processNextBatch() {
      view.sourceDB.changes({
        conflicts: true,
        include_docs: true,
        since : currentSeq,
        limit : CHANGES_BATCH_SIZE
      }).on('complete', function (response) {
        var results = response.results;
        if (!results.length) {
          return complete();
        }
        var docIdsToEmits = {};
        for (var i = 0, l = results.length; i < l; i++) {
          var change = results[i];
          if (change.doc._id[0] !== '_') {
            mapResults = [];
            doc = change.doc;

            if (!doc._deleted) {
              tryCode(view.sourceDB, mapFun, [doc]);
            }
            mapResults.sort(sortByKeyThenValue);

            var indexableKeysToKeyValues = {};
            for (var j = 0, jl = mapResults.length; j < jl; j++) {
              var obj = mapResults[j];
              var indexableKey = toIndexableString([obj.key, obj.id, j]);
              indexableKeysToKeyValues[indexableKey] = obj;
            }
            docIdsToEmits[change.doc._id] = indexableKeysToKeyValues;
          }
          currentSeq = change.seq;
        }
        queue.add(processChange(docIdsToEmits, currentSeq));
        if (results.length < CHANGES_BATCH_SIZE) {
          return complete();
        }
        return processNextBatch();
      }).on('error', onError);
      /* istanbul ignore next */
      function onError(err) {
        reject(err);
      }
    }
    processNextBatch();
  });
});

function reduceView(view, results, options) {
  if (options.group_level === 0) {
    delete options.group_level;
  }

  var shouldGroup = options.group || options.group_level;

  var reduceFun;
  if (builtInReduce[view.reduceFun]) {
    reduceFun = builtInReduce[view.reduceFun];
  } else {
    reduceFun = evalFunc(
      view.reduceFun.toString(), null, sum, log, Array.isArray, JSON.parse);
  }

  var groups = [];
  var lvl = options.group_level;
  results.forEach(function (e) {
    var last = groups[groups.length - 1];
    var key = shouldGroup ? e.key : null;

    // only set group_level for array keys
    if (shouldGroup && Array.isArray(key) && typeof lvl === 'number') {
      key = key.length > lvl ? key.slice(0, lvl) : key;
    }

    if (last && collate(last.key[0][0], key) === 0) {
      last.key.push([key, e.id]);
      last.value.push(e.value);
      return;
    }
    groups.push({key: [
      [key, e.id]
    ], value: [e.value]});
  });
  for (var i = 0, len = groups.length; i < len; i++) {
    var e = groups[i];
    var reduceTry = tryCode(view.sourceDB, reduceFun, [e.key, e.value, false]);
    // CouchDB typically just sets the value to null if reduce errors out
    e.value = reduceTry.error ? null : reduceTry.output;
    e.key = e.key[0][0];
  }
  // no total_rows/offset when reducing
  return {rows: sliceResults(groups, options.limit, options.skip)};
}

var queryView = utils.sequentialize(mainQueue, function (view, opts) {
  var totalRows;
  var shouldReduce = view.reduceFun && opts.reduce !== false;
  var skip = opts.skip || 0;
  if (typeof opts.keys !== 'undefined' && !opts.keys.length) {
    // equivalent query
    opts.limit = 0;
    delete opts.keys;
  }

  function fetchFromView(viewOpts) {
    viewOpts.include_docs = true;
    return view.db.allDocs(viewOpts).then(function (res) {
      totalRows = res.total_rows;
      return res.rows.map(function (result) {
        return result.doc.value;
      });
    });
  }

  function onMapResultsReady(results) {
    var res;
    if (shouldReduce) {
      res = reduceView(view, results, opts);
    } else {
      res = {
        total_rows: totalRows,
        offset: skip,
        rows: results
      };
    }
    if (opts.include_docs) {
      var getDocsPromises = results.map(function (row) {
        var val = row.value;
        var docId = (val && typeof val === 'object' && val._id) || row.id;
        return view.sourceDB.get(docId).then(function (joinedDoc) {
          row.doc = joinedDoc;
        }, function () {
          // document error = don't join
        });
      });
      return Promise.all(getDocsPromises).then(function () {
        return res;
      });
    } else {
      return res;
    }
  }

  var flatten = function (array) {
    return array.reduce(function (prev, cur) {
      return prev.concat(cur);
    });
  };

  if (typeof opts.keys !== 'undefined') {
    var keys = opts.keys;
    var fetchPromises = keys.map(function (key) {
      var viewOpts = {
        startkey : toIndexableString([key]),
        endkey   : toIndexableString([key, {}])
      };
      return fetchFromView(viewOpts);
    });
    return Promise.all(fetchPromises).then(flatten).then(onMapResultsReady);
  } else { // normal query, no 'keys'
    var viewOpts = {
      descending : opts.descending
    };
    if (typeof opts.startkey !== 'undefined') {
      viewOpts.startkey = opts.descending ?
        toIndexableString([opts.startkey, {}]) :
        toIndexableString([opts.startkey]);
    }
    if (typeof opts.endkey !== 'undefined') {
      var inclusiveEnd = opts.inclusive_end !== false;
      if (opts.descending) {
        inclusiveEnd = !inclusiveEnd;
      }

      viewOpts.endkey = toIndexableString(inclusiveEnd ? [opts.endkey, {}] : [opts.endkey]);
    }
    if (typeof opts.key !== 'undefined') {
      var keyStart = toIndexableString([opts.key]);
      var keyEnd = toIndexableString([opts.key, {}]);
      if (viewOpts.descending) {
        viewOpts.endkey = keyStart;
        viewOpts.startkey = keyEnd;
      } else {
        viewOpts.startkey = keyStart;
        viewOpts.endkey = keyEnd;
      }
    }
    if (!shouldReduce) {
      if (typeof opts.limit === 'number') {
        viewOpts.limit = opts.limit;
      }
      viewOpts.skip = skip;
    }
    return fetchFromView(viewOpts).then(onMapResultsReady);
  }
});

function httpViewCleanup(db) {
  return db.request({
    method: 'POST',
    url: '_view_cleanup'
  });
}

var localViewCleanup = utils.sequentialize(mainQueue, function (db) {
  return db.get('_local/mrviews').then(function (metaDoc) {
    var docsToViews = {};
    Object.keys(metaDoc.views).forEach(function (fullViewName) {
      var parts = parseViewName(fullViewName);
      var designDocName = '_design/' + parts[0];
      var viewName = parts[1];
      docsToViews[designDocName] = docsToViews[designDocName] || {};
      docsToViews[designDocName][viewName] = true;
    });
    var opts = {
      keys : Object.keys(docsToViews),
      include_docs : true
    };
    return db.allDocs(opts).then(function (res) {
      var viewsToStatus = {};
      res.rows.forEach(function (row) {
        var ddocName = row.key.substring(8);
        Object.keys(docsToViews[row.key]).forEach(function (viewName) {
          var fullViewName = ddocName + '/' + viewName;
          /* istanbul ignore if */
          if (!metaDoc.views[fullViewName]) {
            // new format, without slashes, to support PouchDB 2.2.0
            // migration test in pouchdb's browser.migration.js verifies this
            fullViewName = viewName;
          }
          var viewDBNames = Object.keys(metaDoc.views[fullViewName]);
          // design doc deleted, or view function nonexistent
          var statusIsGood = row.doc && row.doc.views && row.doc.views[viewName];
          viewDBNames.forEach(function (viewDBName) {
            viewsToStatus[viewDBName] = viewsToStatus[viewDBName] || statusIsGood;
          });
        });
      });
      var dbsToDelete = Object.keys(viewsToStatus).filter(function (viewDBName) {
        return !viewsToStatus[viewDBName];
      });
      var destroyPromises = dbsToDelete.map(function (viewDBName) {
        return db.constructor.destroy(viewDBName, {adapter : db.adapter});
      });
      return Promise.all(destroyPromises).then(function () {
        return {ok: true};
      });
    });
  }, defaultsTo({ok: true}));
});

exports.viewCleanup = utils.callbackify(function () {
  var db = this;
  if (db.type() === 'http') {
    return httpViewCleanup(db);
  }
  return localViewCleanup(db);
});

function queryPromised(db, fun, opts) {
  if (db.type() === 'http') {
    return httpQuery(db, fun, opts);
  }

  if (typeof fun !== 'string') {
    // temp_view
    checkQueryParseError(opts, fun);

    var createViewOpts = {
      db : db,
      viewName : 'temp_view/temp_view',
      map : fun.map,
      reduce : fun.reduce,
      temporary : true
    };
    tempViewQueue.add(function () {
      return createView(createViewOpts).then(function (view) {
        function cleanup() {
          return view.db.destroy();
        }
        return utils.fin(updateView(view).then(function () {
          return queryView(view, opts);
        }), cleanup);
      });
    });
    return tempViewQueue.finish();
  } else {
    // persistent view
    var fullViewName = fun;
    var parts = parseViewName(fullViewName);
    var designDocName = parts[0];
    var viewName = parts[1];
    return db.get('_design/' + designDocName).then(function (doc) {
      var fun = doc.views && doc.views[viewName];

      if (!fun || typeof fun.map !== 'string') {
        var error = new Error('ddoc ' + designDocName + ' has no view named ' +
          viewName);
        error.name = 'not_found';
        error.status = 400;
        throw error;
      }
      checkQueryParseError(opts, fun);

      var createViewOpts = {
        db : db,
        viewName : fullViewName,
        map : fun.map,
        reduce : fun.reduce
      };
      return createView(createViewOpts).then(function (view) {
        if (opts.stale === 'ok' || opts.stale === 'update_after') {
          if (opts.stale === 'update_after') {
            updateView(view);
          }
          return queryView(view, opts);
        } else { // stale not ok
          return updateView(view).then(function () {
            return queryView(view, opts);
          });
        }
      });
    });
  }
}

exports.query = function (fun, opts, callback) {
  if (typeof opts === 'function') {
    callback = opts;
    opts = {};
  }
  opts = utils.extend({}, opts);

  if (typeof fun === 'function') {
    fun = {map : fun};
  }

  var db = this;
  var promise = Promise.resolve().then(function () {
    return queryPromised(db, fun, opts);
  });
  utils.promisedCallback(promise, callback);
  return promise;
};

function QueryParseError(message) {
  this.status = 400;
  this.name = 'query_parse_error';
  this.message = message;
  this.error = true;
  try {
    Error.captureStackTrace(this, QueryParseError);
  } catch (e) {}
}

utils.inherits(QueryParseError, Error);

},{"./create-view":112,"./evalfunc":113,"./taskqueue":118,"./utils":120,"pouchdb-collate":116}],115:[function(require,module,exports){
var hasOwn = Object.prototype.hasOwnProperty;
var toString = Object.prototype.toString;
var undefined;

var isPlainObject = function isPlainObject(obj) {
	"use strict";
	if (!obj || toString.call(obj) !== '[object Object]' || obj.nodeType || obj.setInterval) {
		return false;
	}

	var has_own_constructor = hasOwn.call(obj, 'constructor');
	var has_is_property_of_method = obj.constructor && obj.constructor.prototype && hasOwn.call(obj.constructor.prototype, 'isPrototypeOf');
	// Not own constructor property must be Object
	if (obj.constructor && !has_own_constructor && !has_is_property_of_method) {
		return false;
	}

	// Own properties are enumerated firstly, so to speed up,
	// if last one is own, then all properties are own.
	var key;
	for (key in obj) {}

	return key === undefined || hasOwn.call(obj, key);
};

module.exports = function extend() {
	"use strict";
	var options, name, src, copy, copyIsArray, clone,
		target = arguments[0],
		i = 1,
		length = arguments.length,
		deep = false;

	// Handle a deep copy situation
	if (typeof target === "boolean") {
		deep = target;
		target = arguments[1] || {};
		// skip the boolean and the target
		i = 2;
	} else if (typeof target !== "object" && typeof target !== "function" || target == undefined) {
			target = {};
	}

	for (; i < length; ++i) {
		// Only deal with non-null/undefined values
		if ((options = arguments[i]) != null) {
			// Extend the base object
			for (name in options) {
				src = target[name];
				copy = options[name];

				// Prevent never-ending loop
				if (target === copy) {
					continue;
				}

				// Recurse if we're merging plain objects or arrays
				if (deep && copy && (isPlainObject(copy) || (copyIsArray = Array.isArray(copy)))) {
					if (copyIsArray) {
						copyIsArray = false;
						clone = src && Array.isArray(src) ? src : [];
					} else {
						clone = src && isPlainObject(src) ? src : {};
					}

					// Never move original objects, clone them
					target[name] = extend(deep, clone, copy);

				// Don't bring in undefined values
				} else if (copy !== undefined) {
					target[name] = copy;
				}
			}
		}
	}

	// Return the modified object
	return target;
};


},{}],116:[function(require,module,exports){
'use strict';

var MIN_MAGNITUDE = -324; // verified by -Number.MIN_VALUE
var MAGNITUDE_DIGITS = 3; // ditto
var SEP = ''; // set to '_' for easier debugging 

var utils = require('./utils');

exports.collate = function (a, b) {

  if (a === b) {
    return 0;
  }

  a = exports.normalizeKey(a);
  b = exports.normalizeKey(b);

  var ai = collationIndex(a);
  var bi = collationIndex(b);
  if ((ai - bi) !== 0) {
    return ai - bi;
  }
  if (a === null) {
    return 0;
  }
  switch (typeof a) {
    case 'number':
      return a - b;
    case 'boolean':
      return a === b ? 0 : (a < b ? -1 : 1);
    case 'string':
      return stringCollate(a, b);
  }
  return Array.isArray(a) ? arrayCollate(a, b) : objectCollate(a, b);
};

// couch considers null/NaN/Infinity/-Infinity === undefined,
// for the purposes of mapreduce indexes. also, dates get stringified.
exports.normalizeKey = function (key) {
  switch (typeof key) {
    case 'undefined':
      return null;
    case 'number':
      if (key === Infinity || key === -Infinity || isNaN(key)) {
        return null;
      }
      return key;
    case 'object':
      var origKey = key;
      if (Array.isArray(key)) {
        var len = key.length;
        key = new Array(len);
        for (var i = 0; i < len; i++) {
          key[i] = exports.normalizeKey(origKey[i]);
        }
      } else if (key instanceof Date) {
        return key.toJSON();
      } else if (key !== null) { // generic object
        key = {};
        for (var k in origKey) {
          if (origKey.hasOwnProperty(k)) {
            var val = origKey[k];
            if (typeof val !== 'undefined') {
              key[k] = exports.normalizeKey(val);
            }
          }
        }
      }
  }
  return key;
};

function indexify(key) {
  if (key !== null) {
    switch (typeof key) {
      case 'boolean':
        return key ? 1 : 0;
      case 'number':
        return numToIndexableString(key);
      case 'string':
        // We've to be sure that key does not contain \u0000
        // Do order-preserving replacements:
        // 0 -> 1, 1
        // 1 -> 1, 2
        // 2 -> 2, 2
        return key
          .replace(/\u0002/g, '\u0002\u0002')
          .replace(/\u0001/g, '\u0001\u0002')
          .replace(/\u0000/g, '\u0001\u0001');
      case 'object':
        var isArray = Array.isArray(key);
        var arr = isArray ? key : Object.keys(key);
        var i = -1;
        var len = arr.length;
        var result = '';
        if (isArray) {
          while (++i < len) {
            result += exports.toIndexableString(arr[i]);
          }
        } else {
          while (++i < len) {
            var objKey = arr[i];
            result += exports.toIndexableString(objKey) +
                exports.toIndexableString(key[objKey]);
          }
        }
        return result;
    }
  }
  return '';
}

// convert the given key to a string that would be appropriate
// for lexical sorting, e.g. within a database, where the
// sorting is the same given by the collate() function.
exports.toIndexableString = function (key) {
  var zero = '\u0000';
  key = exports.normalizeKey(key);
  return collationIndex(key) + SEP + indexify(key) + zero;
};

function arrayCollate(a, b) {
  var len = Math.min(a.length, b.length);
  for (var i = 0; i < len; i++) {
    var sort = exports.collate(a[i], b[i]);
    if (sort !== 0) {
      return sort;
    }
  }
  return (a.length === b.length) ? 0 :
    (a.length > b.length) ? 1 : -1;
}
function stringCollate(a, b) {
  // See: https://github.com/daleharvey/pouchdb/issues/40
  // This is incompatible with the CouchDB implementation, but its the
  // best we can do for now
  return (a === b) ? 0 : ((a > b) ? 1 : -1);
}
function objectCollate(a, b) {
  var ak = Object.keys(a), bk = Object.keys(b);
  var len = Math.min(ak.length, bk.length);
  for (var i = 0; i < len; i++) {
    // First sort the keys
    var sort = exports.collate(ak[i], bk[i]);
    if (sort !== 0) {
      return sort;
    }
    // if the keys are equal sort the values
    sort = exports.collate(a[ak[i]], b[bk[i]]);
    if (sort !== 0) {
      return sort;
    }

  }
  return (ak.length === bk.length) ? 0 :
    (ak.length > bk.length) ? 1 : -1;
}
// The collation is defined by erlangs ordered terms
// the atoms null, true, false come first, then numbers, strings,
// arrays, then objects
// null/undefined/NaN/Infinity/-Infinity are all considered null
function collationIndex(x) {
  var id = ['boolean', 'number', 'string', 'object'];
  var idx = id.indexOf(typeof x);
  //false if -1 otherwise true, but fast!!!!1
  if (~idx) {
    if (x === null) {
      return 1;
    }
    if (Array.isArray(x)) {
      return 5;
    }
    return idx < 3 ? (idx + 2) : (idx + 3);
  }
  if (Array.isArray(x)) {
    return 5;
  }
}

// conversion:
// x yyy zz...zz
// x = 0 for negative, 1 for 0, 2 for positive
// y = exponent (for negative numbers negated) moved so that it's >= 0
// z = mantisse
function numToIndexableString(num) {

  if (num === 0) {
    return '1';
  }

  // convert number to exponential format for easier and
  // more succinct string sorting
  var expFormat = num.toExponential().split(/e\+?/);
  var magnitude = parseInt(expFormat[1], 10);

  var neg = num < 0;

  var result = neg ? '0' : '2';

  // first sort by magnitude
  // it's easier if all magnitudes are positive
  var magForComparison = ((neg ? -magnitude : magnitude) - MIN_MAGNITUDE);
  var magString = utils.padLeft((magForComparison).toString(), '0', MAGNITUDE_DIGITS);

  result += SEP + magString;

  // then sort by the factor
  var factor = Math.abs(parseFloat(expFormat[0])); // [1..10)
  if (neg) { // for negative reverse ordering
    factor = 10 - factor;
  }

  var factorStr = factor.toFixed(20);

  // strip zeros from the end
  factorStr = factorStr.replace(/\.?0+$/, '');

  result += SEP + factorStr;

  return result;
}

},{"./utils":117}],117:[function(require,module,exports){
'use strict';

function pad(str, padWith, upToLength) {
  var padding = '';
  var targetLength = upToLength - str.length;
  while (padding.length < targetLength) {
    padding += padWith;
  }
  return padding;
}

exports.padLeft = function (str, padWith, upToLength) {
  var padding = pad(str, padWith, upToLength);
  return padding + str;
};

exports.padRight = function (str, padWith, upToLength) {
  var padding = pad(str, padWith, upToLength);
  return str + padding;
};

exports.stringLexCompare = function (a, b) {

  var aLen = a.length;
  var bLen = b.length;

  var i;
  for (i = 0; i < aLen; i++) {
    if (i === bLen) {
      // b is shorter substring of a
      return 1;
    }
    var aChar = a.charAt(i);
    var bChar = b.charAt(i);
    if (aChar !== bChar) {
      return aChar < bChar ? -1 : 1;
    }
  }

  if (aLen < bLen) {
    // a is shorter substring of b
    return -1;
  }

  return 0;
};

/*
 * returns the decimal form for the given integer, i.e. writes
 * out all the digits (in base-10) instead of using scientific notation
 */
exports.intToDecimalForm = function (int) {

  var isNeg = int < 0;
  var result = '';

  do {
    var remainder = isNeg ? -Math.ceil(int % 10) : Math.floor(int % 10);

    result = remainder + result;
    int = isNeg ? Math.ceil(int / 10) : Math.floor(int / 10);
  } while (int);


  if (isNeg && result !== '0') {
    result = '-' + result;
  }

  return result;
};
},{}],118:[function(require,module,exports){
'use strict';
/*
 * Simple task queue to sequentialize actions. Assumes callbacks will eventually fire (once).
 */

var Promise = require('./utils').Promise;

function TaskQueue() {
  this.promise = new Promise(function (fulfill) {fulfill(); });
}
TaskQueue.prototype.add = function (promiseFactory) {
  this.promise = this.promise["catch"](function () {
    // just recover
  }).then(function () {
    return promiseFactory();
  });
  return this.promise;
};
TaskQueue.prototype.finish = function () {
  return this.promise;
};

module.exports = TaskQueue;

},{"./utils":120}],119:[function(require,module,exports){
'use strict';
var Promise = require('./utils').Promise;

// this is essentially the "update sugar" function from daleharvey/pouchdb#1388
// the diffFun tells us what delta to apply to the doc.  it either returns
// the doc, or false if it doesn't need to do an update after all
function upsert(db, docId, diffFun) {
  return new Promise(function (fulfill, reject) {
    if (docId && typeof docId === 'object') {
      docId = docId._id;
    }
    if (typeof docId !== 'string') {
      return reject(new Error('doc id is required'));
    }

    db.get(docId, function (err, doc) {
      if (err) {
        if (err.name !== 'not_found') {
          return reject(err);
        }
        return fulfill(tryAndPut(db, diffFun({_id : docId}), diffFun));
      }
      var newDoc = diffFun(doc);
      if (!newDoc) {
        return fulfill(doc);
      }
      fulfill(tryAndPut(db, newDoc, diffFun));
    });
  });
}

function tryAndPut(db, doc, diffFun) {
  return db.put(doc)["catch"](function (err) {
    if (err.name !== 'conflict') {
      throw err;
    }
    return upsert(db, doc, diffFun);
  });
}

module.exports = upsert;

},{"./utils":120}],120:[function(require,module,exports){
(function (process,global){
'use strict';
/* istanbul ignore if */
if (typeof global.Promise === 'function') {
  exports.Promise = global.Promise;
} else {
  exports.Promise = require('lie');
}
// uniquify a list, similar to underscore's _.uniq
exports.uniq = function (arr) {
  var map = {};
  arr.forEach(function (element) {
    map[element] = true;
  });
  return Object.keys(map);
};

exports.inherits = require('inherits');
exports.extend = require('extend');
var argsarray = require('argsarray');

exports.promisedCallback = function (promise, callback) {
  if (callback) {
    promise.then(function (res) {
      process.nextTick(function () {
        callback(null, res);
      });
    }, function (reason) {
      process.nextTick(function () {
        callback(reason);
      });
    });
  }
  return promise;
};

exports.callbackify = function (fun) {
  return argsarray(function (args) {
    var cb = args.pop();
    var promise = fun.apply(this, args);
    if (typeof cb === 'function') {
      exports.promisedCallback(promise, cb);
    }
    return promise;
  });
};

// Promise finally util similar to Q.finally
exports.fin = function (promise, cb) {
  return promise.then(function (res) {
    var promise2 = cb();
    if (typeof promise2.then === 'function') {
      return promise2.then(function () {
        return res;
      });
    }
    return res;
  }, function (reason) {
    var promise2 = cb();
    if (typeof promise2.then === 'function') {
      return promise2.then(function () {
        throw reason;
      });
    }
    throw reason;
  });
};

exports.sequentialize = function (queue, promiseFactory) {
  return function () {
    var args = arguments;
    var that = this;
    return queue.add(function () {
      return promiseFactory.apply(that, args);
    });
  };
};

var crypto = require('crypto');
var md5 = require('md5-jkmyers');

exports.MD5 = function (string) {
  /* istanbul ignore else */
  if (!process.browser) {
    return crypto.createHash('md5').update(string).digest('hex');
  } else {
    return md5(string);
  }
};
}).call(this,require("JkpR2F"),typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"JkpR2F":59,"argsarray":91,"crypto":53,"extend":115,"inherits":92,"lie":96,"md5-jkmyers":110}],121:[function(require,module,exports){
"use strict";
var Promise = require("./rsvp/promise")["default"];
var EventTarget = require("./rsvp/events")["default"];
var denodeify = require("./rsvp/node")["default"];
var all = require("./rsvp/all")["default"];
var allSettled = require("./rsvp/all-settled")["default"];
var race = require("./rsvp/race")["default"];
var hash = require("./rsvp/hash")["default"];
var hashSettled = require("./rsvp/hash-settled")["default"];
var rethrow = require("./rsvp/rethrow")["default"];
var defer = require("./rsvp/defer")["default"];
var config = require("./rsvp/config").config;
var configure = require("./rsvp/config").configure;
var map = require("./rsvp/map")["default"];
var resolve = require("./rsvp/resolve")["default"];
var reject = require("./rsvp/reject")["default"];
var filter = require("./rsvp/filter")["default"];
var asap = require("./rsvp/asap")["default"];

config.async = asap; // default async is asap;

function async(callback, arg) {
  config.async(callback, arg);
}

function on() {
  config.on.apply(config, arguments);
}

function off() {
  config.off.apply(config, arguments);
}

// Set up instrumentation through `window.__PROMISE_INTRUMENTATION__`
if (typeof window !== 'undefined' && typeof window.__PROMISE_INSTRUMENTATION__ === 'object') {
  var callbacks = window.__PROMISE_INSTRUMENTATION__;
  configure('instrument', true);
  for (var eventName in callbacks) {
    if (callbacks.hasOwnProperty(eventName)) {
      on(eventName, callbacks[eventName]);
    }
  }
}

exports.Promise = Promise;
exports.EventTarget = EventTarget;
exports.all = all;
exports.allSettled = allSettled;
exports.race = race;
exports.hash = hash;
exports.hashSettled = hashSettled;
exports.rethrow = rethrow;
exports.defer = defer;
exports.denodeify = denodeify;
exports.configure = configure;
exports.on = on;
exports.off = off;
exports.resolve = resolve;
exports.reject = reject;
exports.async = async;
exports.map = map;
exports.filter = filter;
},{"./rsvp/all":124,"./rsvp/all-settled":123,"./rsvp/asap":125,"./rsvp/config":126,"./rsvp/defer":127,"./rsvp/events":129,"./rsvp/filter":130,"./rsvp/hash":132,"./rsvp/hash-settled":131,"./rsvp/map":134,"./rsvp/node":135,"./rsvp/promise":137,"./rsvp/race":143,"./rsvp/reject":144,"./rsvp/resolve":145,"./rsvp/rethrow":146}],122:[function(require,module,exports){
'use strict';
var objectOrFunction = require('./utils').objectOrFunction;
var isFunction = require('./utils').isFunction;
var now = require('./utils').now;
var instrument = require('./instrument')['default'];
var config = require('./config').config;
function noop() {
}
var PENDING = void 0;
var FULFILLED = 1;
var REJECTED = 2;
var GET_THEN_ERROR = new ErrorObject();
function getThen(promise) {
    try {
        return promise.then;
    } catch (error) {
        GET_THEN_ERROR.error = error;
        return GET_THEN_ERROR;
    }
}
function tryThen(then, value, fulfillmentHandler, rejectionHandler) {
    try {
        then.call(value, fulfillmentHandler, rejectionHandler);
    } catch (e) {
        return e;
    }
}
function handleForeignThenable(promise, thenable, then) {
    config.async(function (promise$2) {
        var sealed = false;
        var error = tryThen(then, thenable, function (value) {
                if (sealed) {
                    return;
                }
                sealed = true;
                if (thenable !== value) {
                    resolve(promise$2, value);
                } else {
                    fulfill(promise$2, value);
                }
            }, function (reason) {
                if (sealed) {
                    return;
                }
                sealed = true;
                reject(promise$2, reason);
            }, 'Settle: ' + (promise$2._label || ' unknown promise'));
        if (!sealed && error) {
            sealed = true;
            reject(promise$2, error);
        }
    }, promise);
}
function handleOwnThenable(promise, thenable) {
    promise._onerror = null;
    if (thenable._state === FULFILLED) {
        fulfill(promise, thenable._result);
    } else if (promise._state === REJECTED) {
        reject(promise, thenable._result);
    } else {
        subscribe(thenable, undefined, function (value) {
            if (thenable !== value) {
                resolve(promise, value);
            } else {
                fulfill(promise, value);
            }
        }, function (reason) {
            reject(promise, reason);
        });
    }
}
function handleMaybeThenable(promise, maybeThenable) {
    if (maybeThenable instanceof promise.constructor) {
        handleOwnThenable(promise, maybeThenable);
    } else {
        var then = getThen(maybeThenable);
        if (then === GET_THEN_ERROR) {
            reject(promise, GET_THEN_ERROR.error);
        } else if (then === undefined) {
            fulfill(promise, maybeThenable);
        } else if (isFunction(then)) {
            handleForeignThenable(promise, maybeThenable, then);
        } else {
            fulfill(promise, maybeThenable);
        }
    }
}
function resolve(promise, value) {
    if (promise === value) {
        fulfill(promise, value);
    } else if (objectOrFunction(value)) {
        handleMaybeThenable(promise, value);
    } else {
        fulfill(promise, value);
    }
}
function publishRejection(promise) {
    if (promise._onerror) {
        promise._onerror(promise._result);
    }
    publish(promise);
}
function fulfill(promise, value) {
    if (promise._state !== PENDING) {
        return;
    }
    promise._result = value;
    promise._state = FULFILLED;
    if (promise._subscribers.length === 0) {
        if (config.instrument) {
            instrument('fulfilled', promise);
        }
    } else {
        config.async(publish, promise);
    }
}
function reject(promise, reason) {
    if (promise._state !== PENDING) {
        return;
    }
    promise._state = REJECTED;
    promise._result = reason;
    config.async(publishRejection, promise);
}
function subscribe(parent, child, onFulfillment, onRejection) {
    var subscribers = parent._subscribers;
    var length = subscribers.length;
    parent._onerror = null;
    subscribers[length] = child;
    subscribers[length + FULFILLED] = onFulfillment;
    subscribers[length + REJECTED] = onRejection;
    if (length === 0 && parent._state) {
        config.async(publish, parent);
    }
}
function publish(promise) {
    var subscribers = promise._subscribers;
    var settled = promise._state;
    if (config.instrument) {
        instrument(settled === FULFILLED ? 'fulfilled' : 'rejected', promise);
    }
    if (subscribers.length === 0) {
        return;
    }
    var child, callback, detail = promise._result;
    for (var i = 0; i < subscribers.length; i += 3) {
        child = subscribers[i];
        callback = subscribers[i + settled];
        if (child) {
            invokeCallback(settled, child, callback, detail);
        } else {
            callback(detail);
        }
    }
    promise._subscribers.length = 0;
}
function ErrorObject() {
    this.error = null;
}
var TRY_CATCH_ERROR = new ErrorObject();
function tryCatch(callback, detail) {
    try {
        return callback(detail);
    } catch (e) {
        TRY_CATCH_ERROR.error = e;
        return TRY_CATCH_ERROR;
    }
}
function invokeCallback(settled, promise, callback, detail) {
    var hasCallback = isFunction(callback), value, error, succeeded, failed;
    if (hasCallback) {
        value = tryCatch(callback, detail);
        if (value === TRY_CATCH_ERROR) {
            failed = true;
            error = value.error;
            value = null;
        } else {
            succeeded = true;
        }
        if (promise === value) {
            reject(promise, new TypeError('A promises callback cannot return that same promise.'));
            return;
        }
    } else {
        value = detail;
        succeeded = true;
    }
    if (promise._state !== PENDING) {
    }    // noop
    else if (hasCallback && succeeded) {
        resolve(promise, value);
    } else if (failed) {
        reject(promise, error);
    } else if (settled === FULFILLED) {
        fulfill(promise, value);
    } else if (settled === REJECTED) {
        reject(promise, value);
    }
}
function initializePromise(promise, resolver) {
    try {
        resolver(function resolvePromise(value) {
            resolve(promise, value);
        }, function rejectPromise(reason) {
            reject(promise, reason);
        });
    } catch (e) {
        reject(promise, e);
    }
}
exports.noop = noop;
exports.resolve = resolve;
exports.reject = reject;
exports.fulfill = fulfill;
exports.subscribe = subscribe;
exports.publish = publish;
exports.publishRejection = publishRejection;
exports.initializePromise = initializePromise;
exports.invokeCallback = invokeCallback;
exports.FULFILLED = FULFILLED;
exports.REJECTED = REJECTED;
},{"./config":126,"./instrument":133,"./utils":147}],123:[function(require,module,exports){
'use strict';
var Enumerator = require('./enumerator')['default'];
var makeSettledResult = require('./enumerator').makeSettledResult;
var Promise = require('./promise')['default'];
var o_create = require('./utils').o_create;
function AllSettled(Constructor, entries, label) {
    this._superConstructor(Constructor, entries, false, label);
}
AllSettled.prototype = o_create(Enumerator.prototype);
AllSettled.prototype._superConstructor = Enumerator;
AllSettled.prototype._makeResult = makeSettledResult;
AllSettled.prototype._validationError = function () {
    return new Error('allSettled must be called with an array');
};
/**
  `RSVP.allSettled` is similar to `RSVP.all`, but instead of implementing
  a fail-fast method, it waits until all the promises have returned and
  shows you all the results. This is useful if you want to handle multiple
  promises' failure states together as a set.

  Returns a promise that is fulfilled when all the given promises have been
  settled. The return promise is fulfilled with an array of the states of
  the promises passed into the `promises` array argument.

  Each state object will either indicate fulfillment or rejection, and
  provide the corresponding value or reason. The states will take one of
  the following formats:

  ```javascript
  { state: 'fulfilled', value: value }
    or
  { state: 'rejected', reason: reason }
  ```

  Example:

  ```javascript
  var promise1 = RSVP.Promise.resolve(1);
  var promise2 = RSVP.Promise.reject(new Error('2'));
  var promise3 = RSVP.Promise.reject(new Error('3'));
  var promises = [ promise1, promise2, promise3 ];

  RSVP.allSettled(promises).then(function(array){
    // array == [
    //   { state: 'fulfilled', value: 1 },
    //   { state: 'rejected', reason: Error },
    //   { state: 'rejected', reason: Error }
    // ]
    // Note that for the second item, reason.message will be "2", and for the
    // third item, reason.message will be "3".
  }, function(error) {
    // Not run. (This block would only be called if allSettled had failed,
    // for instance if passed an incorrect argument type.)
  });
  ```

  @method allSettled
  @static
  @for RSVP
  @param {Array} promises
  @param {String} label - optional string that describes the promise.
  Useful for tooling.
  @return {Promise} promise that is fulfilled with an array of the settled
  states of the constituent promises.
*/
exports['default'] = function allSettled(entries, label) {
    return new AllSettled(Promise, entries, label).promise;
};
},{"./enumerator":128,"./promise":137,"./utils":147}],124:[function(require,module,exports){
'use strict';
var Promise = require('./promise')['default'];
/**
  This is a convenient alias for `RSVP.Promise.all`.

  @method all
  @static
  @for RSVP
  @param {Array} array Array of promises.
  @param {String} label An optional label. This is useful
  for tooling.
*/
exports['default'] = function all(array, label) {
    return Promise.all(array, label);
};
},{"./promise":137}],125:[function(require,module,exports){
(function (process){
'use strict';
var length = 0;
exports['default'] = function asap(callback, arg) {
    queue[length] = callback;
    queue[length + 1] = arg;
    length += 2;
    if (length === 2) {
        // If length is 1, that means that we need to schedule an async flush.
        // If additional callbacks are queued before the queue is flushed, they
        // will be processed by this flush that we are scheduling.
        scheduleFlush();
    }
};
var browserGlobal = typeof window !== 'undefined' ? window : {};
var BrowserMutationObserver = browserGlobal.MutationObserver || browserGlobal.WebKitMutationObserver;
// test for web worker but not in IE10
var isWorker = typeof Uint8ClampedArray !== 'undefined' && typeof importScripts !== 'undefined' && typeof MessageChannel !== 'undefined';
// node
function useNextTick() {
    return function () {
        process.nextTick(flush);
    };
}
function useMutationObserver() {
    var iterations = 0;
    var observer = new BrowserMutationObserver(flush);
    var node = document.createTextNode('');
    observer.observe(node, { characterData: true });
    return function () {
        node.data = iterations = ++iterations % 2;
    };
}
// web worker
function useMessageChannel() {
    var channel = new MessageChannel();
    channel.port1.onmessage = flush;
    return function () {
        channel.port2.postMessage(0);
    };
}
function useSetTimeout() {
    return function () {
        setTimeout(flush, 1);
    };
}
var queue = new Array(1000);
function flush() {
    for (var i = 0; i < length; i += 2) {
        var callback = queue[i];
        var arg = queue[i + 1];
        callback(arg);
        queue[i] = undefined;
        queue[i + 1] = undefined;
    }
    length = 0;
}
var scheduleFlush;
// Decide what async method to use to triggering processing of queued callbacks:
if (typeof process !== 'undefined' && {}.toString.call(process) === '[object process]') {
    scheduleFlush = useNextTick();
} else if (BrowserMutationObserver) {
    scheduleFlush = useMutationObserver();
} else if (isWorker) {
    scheduleFlush = useMessageChannel();
} else {
    scheduleFlush = useSetTimeout();
}
}).call(this,require("JkpR2F"))
},{"JkpR2F":59}],126:[function(require,module,exports){
'use strict';
var EventTarget = require('./events')['default'];
var config = { instrument: false };
EventTarget.mixin(config);
function configure(name, value) {
    if (name === 'onerror') {
        // handle for legacy users that expect the actual
        // error to be passed to their function added via
        // `RSVP.configure('onerror', someFunctionHere);`
        config.on('error', value);
        return;
    }
    if (arguments.length === 2) {
        config[name] = value;
    } else {
        return config[name];
    }
}
exports.config = config;
exports.configure = configure;
},{"./events":129}],127:[function(require,module,exports){
'use strict';
var Promise = require('./promise')['default'];
/**
  `RSVP.defer` returns an object similar to jQuery's `$.Deferred`.
  `RSVP.defer` should be used when porting over code reliant on `$.Deferred`'s
  interface. New code should use the `RSVP.Promise` constructor instead.

  The object returned from `RSVP.defer` is a plain object with three properties:

  * promise - an `RSVP.Promise`.
  * reject - a function that causes the `promise` property on this object to
    become rejected
  * resolve - a function that causes the `promise` property on this object to
    become fulfilled.

  Example:

   ```javascript
   var deferred = RSVP.defer();

   deferred.resolve("Success!");

   defered.promise.then(function(value){
     // value here is "Success!"
   });
   ```

  @method defer
  @static
  @for RSVP
  @param {String} label optional string for labeling the promise.
  Useful for tooling.
  @return {Object}
 */
exports['default'] = function defer(label) {
    var deferred = {};
    deferred.promise = new Promise(function (resolve, reject) {
        deferred.resolve = resolve;
        deferred.reject = reject;
    }, label);
    return deferred;
};
},{"./promise":137}],128:[function(require,module,exports){
'use strict';
var isArray = require('./utils').isArray;
var isMaybeThenable = require('./utils').isMaybeThenable;
var noop = require('./-internal').noop;
var reject = require('./-internal').reject;
var fulfill = require('./-internal').fulfill;
var subscribe = require('./-internal').subscribe;
var FULFILLED = require('./-internal').FULFILLED;
var REJECTED = require('./-internal').REJECTED;
var PENDING = require('./-internal').PENDING;
var ABORT_ON_REJECTION = true;
exports.ABORT_ON_REJECTION = ABORT_ON_REJECTION;
function makeSettledResult(state, position, value) {
    if (state === FULFILLED) {
        return {
            state: 'fulfilled',
            value: value
        };
    } else {
        return {
            state: 'rejected',
            reason: value
        };
    }
}
exports.makeSettledResult = makeSettledResult;
function Enumerator(Constructor, input, abortOnReject, label) {
    this._instanceConstructor = Constructor;
    this.promise = new Constructor(noop, label);
    this._abortOnReject = abortOnReject;
    if (this._validateInput(input)) {
        this._input = input;
        this.length = input.length;
        this._remaining = input.length;
        this._init();
        if (this.length === 0) {
            fulfill(this.promise, this._result);
        } else {
            this.length = this.length || 0;
            this._enumerate();
            if (this._remaining === 0) {
                fulfill(this.promise, this._result);
            }
        }
    } else {
        reject(this.promise, this._validationError());
    }
}
Enumerator.prototype._validateInput = function (input) {
    return isArray(input);
};
Enumerator.prototype._validationError = function () {
    return new Error('Array Methods must be provided an Array');
};
Enumerator.prototype._init = function () {
    this._result = new Array(this.length);
};
exports['default'] = Enumerator;
Enumerator.prototype._enumerate = function () {
    var length = this.length;
    var promise = this.promise;
    var input = this._input;
    for (var i = 0; promise._state === PENDING && i < length; i++) {
        this._eachEntry(input[i], i);
    }
};
Enumerator.prototype._eachEntry = function (entry, i) {
    var c = this._instanceConstructor;
    if (isMaybeThenable(entry)) {
        if (entry.constructor === c && entry._state !== PENDING) {
            entry._onerror = null;
            this._settledAt(entry._state, i, entry._result);
        } else {
            this._willSettleAt(c.resolve(entry), i);
        }
    } else {
        this._remaining--;
        this._result[i] = this._makeResult(FULFILLED, i, entry);
    }
};
Enumerator.prototype._settledAt = function (state, i, value) {
    var promise = this.promise;
    if (promise._state === PENDING) {
        this._remaining--;
        if (this._abortOnReject && state === REJECTED) {
            reject(promise, value);
        } else {
            this._result[i] = this._makeResult(state, i, value);
        }
    }
    if (this._remaining === 0) {
        fulfill(promise, this._result);
    }
};
Enumerator.prototype._makeResult = function (state, i, value) {
    return value;
};
Enumerator.prototype._willSettleAt = function (promise, i) {
    var enumerator = this;
    subscribe(promise, undefined, function (value) {
        enumerator._settledAt(FULFILLED, i, value);
    }, function (reason) {
        enumerator._settledAt(REJECTED, i, reason);
    });
};
},{"./-internal":122,"./utils":147}],129:[function(require,module,exports){
'use strict';
function indexOf(callbacks, callback) {
    for (var i = 0, l = callbacks.length; i < l; i++) {
        if (callbacks[i] === callback) {
            return i;
        }
    }
    return -1;
}
function callbacksFor(object) {
    var callbacks = object._promiseCallbacks;
    if (!callbacks) {
        callbacks = object._promiseCallbacks = {};
    }
    return callbacks;
}
/**
  @class RSVP.EventTarget
*/
exports['default'] = {
    mixin: function (object) {
        object.on = this.on;
        object.off = this.off;
        object.trigger = this.trigger;
        object._promiseCallbacks = undefined;
        return object;
    },
    on: function (eventName, callback) {
        var allCallbacks = callbacksFor(this), callbacks;
        callbacks = allCallbacks[eventName];
        if (!callbacks) {
            callbacks = allCallbacks[eventName] = [];
        }
        if (indexOf(callbacks, callback) === -1) {
            callbacks.push(callback);
        }
    },
    off: function (eventName, callback) {
        var allCallbacks = callbacksFor(this), callbacks, index;
        if (!callback) {
            allCallbacks[eventName] = [];
            return;
        }
        callbacks = allCallbacks[eventName];
        index = indexOf(callbacks, callback);
        if (index !== -1) {
            callbacks.splice(index, 1);
        }
    },
    trigger: function (eventName, options) {
        var allCallbacks = callbacksFor(this), callbacks, callbackTuple, callback, binding;
        if (callbacks = allCallbacks[eventName]) {
            // Don't cache the callbacks.length since it may grow
            for (var i = 0; i < callbacks.length; i++) {
                callback = callbacks[i];
                callback(options);
            }
        }
    }
};
},{}],130:[function(require,module,exports){
'use strict';
var Promise = require('./promise')['default'];
var isFunction = require('./utils').isFunction;
var isMaybeThenable = require('./utils').isMaybeThenable;
/**
 `RSVP.filter` is similar to JavaScript's native `filter` method, except that it
  waits for all promises to become fulfilled before running the `filterFn` on
  each item in given to `promises`. `RSVP.filter` returns a promise that will
  become fulfilled with the result of running `filterFn` on the values the
  promises become fulfilled with.

  For example:

  ```javascript

  var promise1 = RSVP.resolve(1);
  var promise2 = RSVP.resolve(2);
  var promise3 = RSVP.resolve(3);

  var promises = [promise1, promise2, promise3];

  var filterFn = function(item){
    return item > 1;
  };

  RSVP.filter(promises, filterFn).then(function(result){
    // result is [ 2, 3 ]
  });
  ```

  If any of the `promises` given to `RSVP.filter` are rejected, the first promise
  that is rejected will be given as an argument to the returned promise's
  rejection handler. For example:

  ```javascript
  var promise1 = RSVP.resolve(1);
  var promise2 = RSVP.reject(new Error("2"));
  var promise3 = RSVP.reject(new Error("3"));
  var promises = [ promise1, promise2, promise3 ];

  var filterFn = function(item){
    return item > 1;
  };

  RSVP.filter(promises, filterFn).then(function(array){
    // Code here never runs because there are rejected promises!
  }, function(reason) {
    // reason.message === "2"
  });
  ```

  `RSVP.filter` will also wait for any promises returned from `filterFn`.
  For instance, you may want to fetch a list of users then return a subset
  of those users based on some asynchronous operation:

  ```javascript

  var alice = { name: 'alice' };
  var bob   = { name: 'bob' };
  var users = [ alice, bob ];

  var promises = users.map(function(user){
    return RSVP.resolve(user);
  });

  var filterFn = function(user){
    // Here, Alice has permissions to create a blog post, but Bob does not.
    return getPrivilegesForUser(user).then(function(privs){
      return privs.can_create_blog_post === true;
    });
  };
  RSVP.filter(promises, filterFn).then(function(users){
    // true, because the server told us only Alice can create a blog post.
    users.length === 1;
    // false, because Alice is the only user present in `users`
    users[0] === bob;
  });
  ```

  @method filter
  @static
  @for RSVP
  @param {Array} promises
  @param {Function} filterFn - function to be called on each resolved value to
  filter the final results.
  @param {String} label optional string describing the promise. Useful for
  tooling.
  @return {Promise}
*/
exports['default'] = function filter(promises, filterFn, label) {
    return Promise.all(promises, label).then(function (values) {
        if (!isFunction(filterFn)) {
            throw new TypeError('You must pass a function as filter\'s second argument.');
        }
        var length = values.length;
        var filtered = new Array(length);
        for (var i = 0; i < length; i++) {
            filtered[i] = filterFn(values[i]);
        }
        return Promise.all(filtered, label).then(function (filtered$2) {
            var results = new Array(length);
            var newLength = 0;
            for (var i$2 = 0; i$2 < length; i$2++) {
                if (filtered$2[i$2]) {
                    results[newLength] = values[i$2];
                    newLength++;
                }
            }
            results.length = newLength;
            return results;
        });
    });
};
},{"./promise":137,"./utils":147}],131:[function(require,module,exports){
'use strict';
var Promise = require('./promise')['default'];
var makeSettledResult = require('./enumerator').makeSettledResult;
var PromiseHash = require('./promise-hash')['default'];
var Enumerator = require('./enumerator')['default'];
var o_create = require('./utils').o_create;
function HashSettled(Constructor, object, label) {
    this._superConstructor(Constructor, object, false, label);
}
HashSettled.prototype = o_create(PromiseHash.prototype);
HashSettled.prototype._superConstructor = Enumerator;
HashSettled.prototype._makeResult = makeSettledResult;
HashSettled.prototype._validationError = function () {
    return new Error('hashSettled must be called with an object');
};
/**
  `RSVP.hashSettled` is similar to `RSVP.allSettled`, but takes an object
  instead of an array for its `promises` argument.

  Unlike `RSVP.all` or `RSVP.hash`, which implement a fail-fast method,
  but like `RSVP.allSettled`, `hashSettled` waits until all the
  constituent promises have returned and then shows you all the results
  with their states and values/reasons. This is useful if you want to
  handle multiple promises' failure states together as a set.

  Returns a promise that is fulfilled when all the given promises have been
  settled, or rejected if the passed parameters are invalid.

  The returned promise is fulfilled with a hash that has the same key names as
  the `promises` object argument. If any of the values in the object are not
  promises, they will be copied over to the fulfilled object and marked with state
  'fulfilled'.

  Example:

  ```javascript
  var promises = {
    myPromise: RSVP.Promise.resolve(1),
    yourPromise: RSVP.Promise.resolve(2),
    theirPromise: RSVP.Promise.resolve(3),
    notAPromise: 4
  };

  RSVP.hashSettled(promises).then(function(hash){
    // hash here is an object that looks like:
    // {
    //   myPromise: { state: 'fulfilled', value: 1 },
    //   yourPromise: { state: 'fulfilled', value: 2 },
    //   theirPromise: { state: 'fulfilled', value: 3 },
    //   notAPromise: { state: 'fulfilled', value: 4 }
    // }
  });
  ```

  If any of the `promises` given to `RSVP.hash` are rejected, the state will
  be set to 'rejected' and the reason for rejection provided.

  Example:

  ```javascript
  var promises = {
    myPromise: RSVP.Promise.resolve(1),
    rejectedPromise: RSVP.Promise.reject(new Error('rejection')),
    anotherRejectedPromise: RSVP.Promise.reject(new Error('more rejection')),
  };

  RSVP.hashSettled(promises).then(function(hash){
    // hash here is an object that looks like:
    // {
    //   myPromise:              { state: 'fulfilled', value: 1 },
    //   rejectedPromise:        { state: 'rejected', reason: Error },
    //   anotherRejectedPromise: { state: 'rejected', reason: Error },
    // }
    // Note that for rejectedPromise, reason.message == 'rejection',
    // and for anotherRejectedPromise, reason.message == 'more rejection'.
  });
  ```

  An important note: `RSVP.hashSettled` is intended for plain JavaScript objects that
  are just a set of keys and values. `RSVP.hashSettled` will NOT preserve prototype
  chains.

  Example:

  ```javascript
  function MyConstructor(){
    this.example = RSVP.Promise.resolve('Example');
  }

  MyConstructor.prototype = {
    protoProperty: RSVP.Promise.resolve('Proto Property')
  };

  var myObject = new MyConstructor();

  RSVP.hashSettled(myObject).then(function(hash){
    // protoProperty will not be present, instead you will just have an
    // object that looks like:
    // {
    //   example: { state: 'fulfilled', value: 'Example' }
    // }
    //
    // hash.hasOwnProperty('protoProperty'); // false
    // 'undefined' === typeof hash.protoProperty
  });
  ```

  @method hashSettled
  @for RSVP
  @param {Object} promises
  @param {String} label optional string that describes the promise.
  Useful for tooling.
  @return {Promise} promise that is fulfilled when when all properties of `promises`
  have been settled.
  @static
*/
exports['default'] = function hashSettled(object, label) {
    return new HashSettled(Promise, object, label).promise;
};
},{"./enumerator":128,"./promise":137,"./promise-hash":136,"./utils":147}],132:[function(require,module,exports){
'use strict';
var Promise = require('./promise')['default'];
var PromiseHash = require('./promise-hash')['default'];
var ABORT_ON_REJECTION = require('./enumerator').ABORT_ON_REJECTION;
/**
  `RSVP.hash` is similar to `RSVP.all`, but takes an object instead of an array
  for its `promises` argument.

  Returns a promise that is fulfilled when all the given promises have been
  fulfilled, or rejected if any of them become rejected. The returned promise
  is fulfilled with a hash that has the same key names as the `promises` object
  argument. If any of the values in the object are not promises, they will
  simply be copied over to the fulfilled object.

  Example:

  ```javascript
  var promises = {
    myPromise: RSVP.resolve(1),
    yourPromise: RSVP.resolve(2),
    theirPromise: RSVP.resolve(3),
    notAPromise: 4
  };

  RSVP.hash(promises).then(function(hash){
    // hash here is an object that looks like:
    // {
    //   myPromise: 1,
    //   yourPromise: 2,
    //   theirPromise: 3,
    //   notAPromise: 4
    // }
  });
  ````

  If any of the `promises` given to `RSVP.hash` are rejected, the first promise
  that is rejected will be given as the reason to the rejection handler.

  Example:

  ```javascript
  var promises = {
    myPromise: RSVP.resolve(1),
    rejectedPromise: RSVP.reject(new Error("rejectedPromise")),
    anotherRejectedPromise: RSVP.reject(new Error("anotherRejectedPromise")),
  };

  RSVP.hash(promises).then(function(hash){
    // Code here never runs because there are rejected promises!
  }, function(reason) {
    // reason.message === "rejectedPromise"
  });
  ```

  An important note: `RSVP.hash` is intended for plain JavaScript objects that
  are just a set of keys and values. `RSVP.hash` will NOT preserve prototype
  chains.

  Example:

  ```javascript
  function MyConstructor(){
    this.example = RSVP.resolve("Example");
  }

  MyConstructor.prototype = {
    protoProperty: RSVP.resolve("Proto Property")
  };

  var myObject = new MyConstructor();

  RSVP.hash(myObject).then(function(hash){
    // protoProperty will not be present, instead you will just have an
    // object that looks like:
    // {
    //   example: "Example"
    // }
    //
    // hash.hasOwnProperty('protoProperty'); // false
    // 'undefined' === typeof hash.protoProperty
  });
  ```

  @method hash
  @static
  @for RSVP
  @param {Object} promises
  @param {String} label optional string that describes the promise.
  Useful for tooling.
  @return {Promise} promise that is fulfilled when all properties of `promises`
  have been fulfilled, or rejected if any of them become rejected.
*/
exports['default'] = function hash(object, label) {
    return new PromiseHash(Promise, object, label).promise;
};
},{"./enumerator":128,"./promise":137,"./promise-hash":136}],133:[function(require,module,exports){
'use strict';
var config = require('./config').config;
var now = require('./utils').now;
var queue = [];
exports['default'] = function instrument(eventName, promise, child) {
    if (1 === queue.push({
            name: eventName,
            payload: {
                guid: promise._guidKey + promise._id,
                eventName: eventName,
                detail: promise._result,
                childGuid: child && promise._guidKey + child._id,
                label: promise._label,
                timeStamp: now(),
                stack: new Error(promise._label).stack
            }
        })) {
        setTimeout(function () {
            var entry;
            for (var i = 0; i < queue.length; i++) {
                entry = queue[i];
                config.trigger(entry.name, entry.payload);
            }
            queue.length = 0;
        }, 50);
    }
};
},{"./config":126,"./utils":147}],134:[function(require,module,exports){
'use strict';
var Promise = require('./promise')['default'];
var isArray = require('./utils').isArray;
var isFunction = require('./utils').isFunction;
/**
 `RSVP.map` is similar to JavaScript's native `map` method, except that it
  waits for all promises to become fulfilled before running the `mapFn` on
  each item in given to `promises`. `RSVP.map` returns a promise that will
  become fulfilled with the result of running `mapFn` on the values the promises
  become fulfilled with.

  For example:

  ```javascript

  var promise1 = RSVP.resolve(1);
  var promise2 = RSVP.resolve(2);
  var promise3 = RSVP.resolve(3);
  var promises = [ promise1, promise2, promise3 ];

  var mapFn = function(item){
    return item + 1;
  };

  RSVP.map(promises, mapFn).then(function(result){
    // result is [ 2, 3, 4 ]
  });
  ```

  If any of the `promises` given to `RSVP.map` are rejected, the first promise
  that is rejected will be given as an argument to the returned promise's
  rejection handler. For example:

  ```javascript
  var promise1 = RSVP.resolve(1);
  var promise2 = RSVP.reject(new Error("2"));
  var promise3 = RSVP.reject(new Error("3"));
  var promises = [ promise1, promise2, promise3 ];

  var mapFn = function(item){
    return item + 1;
  };

  RSVP.map(promises, mapFn).then(function(array){
    // Code here never runs because there are rejected promises!
  }, function(reason) {
    // reason.message === "2"
  });
  ```

  `RSVP.map` will also wait if a promise is returned from `mapFn`. For example,
  say you want to get all comments from a set of blog posts, but you need
  the blog posts first because they contain a url to those comments.

  ```javscript

  var mapFn = function(blogPost){
    // getComments does some ajax and returns an RSVP.Promise that is fulfilled
    // with some comments data
    return getComments(blogPost.comments_url);
  };

  // getBlogPosts does some ajax and returns an RSVP.Promise that is fulfilled
  // with some blog post data
  RSVP.map(getBlogPosts(), mapFn).then(function(comments){
    // comments is the result of asking the server for the comments
    // of all blog posts returned from getBlogPosts()
  });
  ```

  @method map
  @static
  @for RSVP
  @param {Array} promises
  @param {Function} mapFn function to be called on each fulfilled promise.
  @param {String} label optional string for labeling the promise.
  Useful for tooling.
  @return {Promise} promise that is fulfilled with the result of calling
  `mapFn` on each fulfilled promise or value when they become fulfilled.
   The promise will be rejected if any of the given `promises` become rejected.
  @static
*/
exports['default'] = function map(promises, mapFn, label) {
    return Promise.all(promises, label).then(function (values) {
        if (!isFunction(mapFn)) {
            throw new TypeError('You must pass a function as map\'s second argument.');
        }
        var length = values.length;
        var results = new Array(length);
        for (var i = 0; i < length; i++) {
            results[i] = mapFn(values[i]);
        }
        return Promise.all(results, label);
    });
};
},{"./promise":137,"./utils":147}],135:[function(require,module,exports){
'use strict';
/* global  arraySlice */
var Promise = require('./promise')['default'];
var isArray = require('./utils').isArray;
/**
  `RSVP.denodeify` takes a "node-style" function and returns a function that
  will return an `RSVP.Promise`. You can use `denodeify` in Node.js or the
  browser when you'd prefer to use promises over using callbacks. For example,
  `denodeify` transforms the following:

  ```javascript
  var fs = require('fs');

  fs.readFile('myfile.txt', function(err, data){
    if (err) return handleError(err);
    handleData(data);
  });
  ```

  into:

  ```javascript
  var fs = require('fs');
  var readFile = RSVP.denodeify(fs.readFile);

  readFile('myfile.txt').then(handleData, handleError);
  ```

  If the node function has multiple success parameters, then `denodeify`
  just returns the first one:

  ```javascript
  var request = RSVP.denodeify(require('request'));

  request('http://example.com').then(function(res) {
    // ...
  });
  ```

  However, if you need all success parameters, setting `denodeify`'s
  second parameter to `true` causes it to return all success parameters
  as an array:

  ```javascript
  var request = RSVP.denodeify(require('request'), true);

  request('http://example.com').then(function(result) {
    // result[0] -> res
    // result[1] -> body
  });
  ```

  Or if you pass it an array with names it returns the parameters as a hash:

  ```javascript
  var request = RSVP.denodeify(require('request'), ['res', 'body']);

  request('http://example.com').then(function(result) {
    // result.res
    // result.body
  });
  ```

  Sometimes you need to retain the `this`:

  ```javascript
  var app = require('express')();
  var render = RSVP.denodeify(app.render.bind(app));
  ```

  The denodified function inherits from the original function. It works in all
  environments, except IE 10 and below. Consequently all properties of the original
  function are available to you. However, any properties you change on the
  denodeified function won't be changed on the original function. Example:

  ```javascript
  var request = RSVP.denodeify(require('request')),
      cookieJar = request.jar(); // <- Inheritance is used here

  request('http://example.com', {jar: cookieJar}).then(function(res) {
    // cookieJar.cookies holds now the cookies returned by example.com
  });
  ```

  Using `denodeify` makes it easier to compose asynchronous operations instead
  of using callbacks. For example, instead of:

  ```javascript
  var fs = require('fs');

  fs.readFile('myfile.txt', function(err, data){
    if (err) { ... } // Handle error
    fs.writeFile('myfile2.txt', data, function(err){
      if (err) { ... } // Handle error
      console.log('done')
    });
  });
  ```

  you can chain the operations together using `then` from the returned promise:

  ```javascript
  var fs = require('fs');
  var readFile = RSVP.denodeify(fs.readFile);
  var writeFile = RSVP.denodeify(fs.writeFile);

  readFile('myfile.txt').then(function(data){
    return writeFile('myfile2.txt', data);
  }).then(function(){
    console.log('done')
  }).catch(function(error){
    // Handle error
  });
  ```

  @method denodeify
  @static
  @for RSVP
  @param {Function} nodeFunc a "node-style" function that takes a callback as
  its last argument. The callback expects an error to be passed as its first
  argument (if an error occurred, otherwise null), and the value from the
  operation as its second argument ("function(err, value){ }").
  @param {Boolean|Array} argumentNames An optional paramter that if set
  to `true` causes the promise to fulfill with the callback's success arguments
  as an array. This is useful if the node function has multiple success
  paramters. If you set this paramter to an array with names, the promise will
  fulfill with a hash with these names as keys and the success parameters as
  values.
  @return {Function} a function that wraps `nodeFunc` to return an
  `RSVP.Promise`
  @static
*/
exports['default'] = function denodeify(nodeFunc, argumentNames) {
    var asArray = argumentNames === true;
    var asHash = isArray(argumentNames);
    function denodeifiedFunction() {
        var length = arguments.length;
        var nodeArgs = new Array(length);
        for (var i = 0; i < length; i++) {
            nodeArgs[i] = arguments[i];
        }
        var thisArg;
        if (!asArray && !asHash && argumentNames) {
            if (typeof console === 'object') {
                console.warn('Deprecation: RSVP.denodeify() doesn\'t allow setting the ' + '"this" binding anymore. Use yourFunction.bind(yourThis) instead.');
            }
            thisArg = argumentNames;
        } else {
            thisArg = this;
        }
        return Promise.all(nodeArgs).then(function (nodeArgs$2) {
            return new Promise(resolver);
            // sweet.js has a bug, this resolver can't be defined in the constructor
            // or the arraySlice macro doesn't work
            function resolver(resolve, reject) {
                function callback() {
                    var length$2 = arguments.length;
                    var args = new Array(length$2);
                    for (var i$2 = 0; i$2 < length$2; i$2++) {
                        args[i$2] = arguments[i$2];
                    }
                    var error = args[0];
                    var value = args[1];
                    if (error) {
                        reject(error);
                    } else if (asArray) {
                        resolve(args.slice(1));
                    } else if (asHash) {
                        var obj = {};
                        var successArguments = args.slice(1);
                        var name;
                        var i$3;
                        for (i$3 = 0; i$3 < argumentNames.length; i$3++) {
                            name = argumentNames[i$3];
                            obj[name] = successArguments[i$3];
                        }
                        resolve(obj);
                    } else {
                        resolve(value);
                    }
                }
                nodeArgs$2.push(callback);
                nodeFunc.apply(thisArg, nodeArgs$2);
            }
        });
    }
    denodeifiedFunction.__proto__ = nodeFunc;
    return denodeifiedFunction;
};
},{"./promise":137,"./utils":147}],136:[function(require,module,exports){
'use strict';
var Enumerator = require('./enumerator')['default'];
var PENDING = require('./-internal').PENDING;
var FULFILLED = require('./-internal').FULFILLED;
var o_create = require('./utils').o_create;
function PromiseHash(Constructor, object, label) {
    this._superConstructor(Constructor, object, true, label);
}
exports['default'] = PromiseHash;
PromiseHash.prototype = o_create(Enumerator.prototype);
PromiseHash.prototype._superConstructor = Enumerator;
PromiseHash.prototype._init = function () {
    this._result = {};
};
PromiseHash.prototype._validateInput = function (input) {
    return input && typeof input === 'object';
};
PromiseHash.prototype._validationError = function () {
    return new Error('Promise.hash must be called with an object');
};
PromiseHash.prototype._enumerate = function () {
    var promise = this.promise;
    var input = this._input;
    var results = [];
    for (var key in input) {
        if (promise._state === PENDING && input.hasOwnProperty(key)) {
            results.push({
                position: key,
                entry: input[key]
            });
        }
    }
    var length = results.length;
    this._remaining = length;
    var result;
    for (var i = 0; promise._state === PENDING && i < length; i++) {
        result = results[i];
        this._eachEntry(result.entry, result.position);
    }
};
},{"./-internal":122,"./enumerator":128,"./utils":147}],137:[function(require,module,exports){
'use strict';
var config = require('./config').config;
var EventTarget = require('./events')['default'];
var instrument = require('./instrument')['default'];
var objectOrFunction = require('./utils').objectOrFunction;
var isFunction = require('./utils').isFunction;
var now = require('./utils').now;
var noop = require('./-internal').noop;
var resolve = require('./-internal').resolve;
var reject = require('./-internal').reject;
var fulfill = require('./-internal').fulfill;
var subscribe = require('./-internal').subscribe;
var initializePromise = require('./-internal').initializePromise;
var invokeCallback = require('./-internal').invokeCallback;
var FULFILLED = require('./-internal').FULFILLED;
var REJECTED = require('./-internal').REJECTED;
var cast = require('./promise/cast')['default'];
var all = require('./promise/all')['default'];
var race = require('./promise/race')['default'];
var Resolve = require('./promise/resolve')['default'];
var Reject = require('./promise/reject')['default'];
var guidKey = 'rsvp_' + now() + '-';
var counter = 0;
function needsResolver() {
    throw new TypeError('You must pass a resolver function as the first argument to the promise constructor');
}
function needsNew() {
    throw new TypeError('Failed to construct \'Promise\': Please use the \'new\' operator, this object constructor cannot be called as a function.');
}
exports['default'] = Promise;
/**
  Promise objects represent the eventual result of an asynchronous operation. The
  primary way of interacting with a promise is through its `then` method, which
  registers callbacks to receive either a promise’s eventual value or the reason
  why the promise cannot be fulfilled.

  Terminology
  -----------

  - `promise` is an object or function with a `then` method whose behavior conforms to this specification.
  - `thenable` is an object or function that defines a `then` method.
  - `value` is any legal JavaScript value (including undefined, a thenable, or a promise).
  - `exception` is a value that is thrown using the throw statement.
  - `reason` is a value that indicates why a promise was rejected.
  - `settled` the final resting state of a promise, fulfilled or rejected.

  A promise can be in one of three states: pending, fulfilled, or rejected.

  Promises that are fulfilled have a fulfillment value and are in the fulfilled
  state.  Promises that are rejected have a rejection reason and are in the
  rejected state.  A fulfillment value is never a thenable.

  Promises can also be said to *resolve* a value.  If this value is also a
  promise, then the original promise's settled state will match the value's
  settled state.  So a promise that *resolves* a promise that rejects will
  itself reject, and a promise that *resolves* a promise that fulfills will
  itself fulfill.


  Basic Usage:
  ------------

  ```js
  var promise = new Promise(function(resolve, reject) {
    // on success
    resolve(value);

    // on failure
    reject(reason);
  });

  promise.then(function(value) {
    // on fulfillment
  }, function(reason) {
    // on rejection
  });
  ```

  Advanced Usage:
  ---------------

  Promises shine when abstracting away asynchronous interactions such as
  `XMLHttpRequest`s.

  ```js
  function getJSON(url) {
    return new Promise(function(resolve, reject){
      var xhr = new XMLHttpRequest();

      xhr.open('GET', url);
      xhr.onreadystatechange = handler;
      xhr.responseType = 'json';
      xhr.setRequestHeader('Accept', 'application/json');
      xhr.send();

      function handler() {
        if (this.readyState === this.DONE) {
          if (this.status === 200) {
            resolve(this.response);
          } else {
            reject(new Error("getJSON: `" + url + "` failed with status: [" + this.status + "]"));
          }
        }
      };
    });
  }

  getJSON('/posts.json').then(function(json) {
    // on fulfillment
  }, function(reason) {
    // on rejection
  });
  ```

  Unlike callbacks, promises are great composable primitives.

  ```js
  Promise.all([
    getJSON('/posts'),
    getJSON('/comments')
  ]).then(function(values){
    values[0] // => postsJSON
    values[1] // => commentsJSON

    return values;
  });
  ```

  @class RSVP.Promise
  @param {function} resolver
  @param {String} label optional string for labeling the promise.
  Useful for tooling.
  @constructor
*/
function Promise(resolver, label) {
    this._id = counter++;
    this._label = label;
    this._subscribers = [];
    if (config.instrument) {
        instrument('created', this);
    }
    if (noop !== resolver) {
        if (!isFunction(resolver)) {
            needsResolver();
        }
        if (!(this instanceof Promise)) {
            needsNew();
        }
        initializePromise(this, resolver);
    }
}
Promise.cast = cast;
Promise.all = all;
Promise.race = race;
Promise.resolve = Resolve;
Promise.reject = Reject;
Promise.prototype = {
    constructor: Promise,
    _id: undefined,
    _guidKey: guidKey,
    _label: undefined,
    _state: undefined,
    _result: undefined,
    _subscribers: undefined,
    _onerror: function (reason) {
        config.trigger('error', reason);
    },
    then: function (onFulfillment, onRejection, label) {
        var parent = this;
        var state = parent._state;
        if (state === FULFILLED && !onFulfillment || state === REJECTED && !onRejection) {
            if (config.instrument) {
                instrument('chained', this, this);
            }
            return this;
        }
        parent._onerror = null;
        var child = new this.constructor(noop, label);
        var result = parent._result;
        if (config.instrument) {
            instrument('chained', parent, child);
        }
        if (state) {
            var callback = arguments[state - 1];
            config.async(function () {
                invokeCallback(state, child, callback, result);
            });
        } else {
            subscribe(parent, child, onFulfillment, onRejection);
        }
        return child;
    },
    'catch': function (onRejection, label) {
        return this.then(null, onRejection, label);
    },
    'finally': function (callback, label) {
        var constructor = this.constructor;
        return this.then(function (value) {
            return constructor.resolve(callback()).then(function () {
                return value;
            });
        }, function (reason) {
            return constructor.resolve(callback()).then(function () {
                throw reason;
            });
        }, label);
    }
};
},{"./-internal":122,"./config":126,"./events":129,"./instrument":133,"./promise/all":138,"./promise/cast":139,"./promise/race":140,"./promise/reject":141,"./promise/resolve":142,"./utils":147}],138:[function(require,module,exports){
'use strict';
var Enumerator = require('../enumerator')['default'];
/**
  `RSVP.Promise.all` accepts an array of promises, and returns a new promise which
  is fulfilled with an array of fulfillment values for the passed promises, or
  rejected with the reason of the first passed promise to be rejected. It casts all
  elements of the passed iterable to promises as it runs this algorithm.

  Example:

  ```javascript
  var promise1 = RSVP.resolve(1);
  var promise2 = RSVP.resolve(2);
  var promise3 = RSVP.resolve(3);
  var promises = [ promise1, promise2, promise3 ];

  RSVP.Promise.all(promises).then(function(array){
    // The array here would be [ 1, 2, 3 ];
  });
  ```

  If any of the `promises` given to `RSVP.all` are rejected, the first promise
  that is rejected will be given as an argument to the returned promises's
  rejection handler. For example:

  Example:

  ```javascript
  var promise1 = RSVP.resolve(1);
  var promise2 = RSVP.reject(new Error("2"));
  var promise3 = RSVP.reject(new Error("3"));
  var promises = [ promise1, promise2, promise3 ];

  RSVP.Promise.all(promises).then(function(array){
    // Code here never runs because there are rejected promises!
  }, function(error) {
    // error.message === "2"
  });
  ```

  @method all
  @static
  @param {Array} entries array of promises
  @param {String} label optional string for labeling the promise.
  Useful for tooling.
  @return {Promise} promise that is fulfilled when all `promises` have been
  fulfilled, or rejected if any of them become rejected.
  @static
*/
exports['default'] = function all(entries, label) {
    return new Enumerator(this, entries, true, label).promise;
};
},{"../enumerator":128}],139:[function(require,module,exports){
'use strict';
var resolve = require('./resolve')['default'];
/**
  @deprecated

  `RSVP.Promise.cast` coerces its argument to a promise, or returns the
  argument if it is already a promise which shares a constructor with the caster.

  Example:

  ```javascript
  var promise = RSVP.Promise.resolve(1);
  var casted = RSVP.Promise.cast(promise);

  console.log(promise === casted); // true
  ```

  In the case of a promise whose constructor does not match, it is assimilated.
  The resulting promise will fulfill or reject based on the outcome of the
  promise being casted.

  Example:

  ```javascript
  var thennable = $.getJSON('/api/foo');
  var casted = RSVP.Promise.cast(thennable);

  console.log(thennable === casted); // false
  console.log(casted instanceof RSVP.Promise) // true

  casted.then(function(data) {
    // data is the value getJSON fulfills with
  });
  ```

  In the case of a non-promise, a promise which will fulfill with that value is
  returned.

  Example:

  ```javascript
  var value = 1; // could be a number, boolean, string, undefined...
  var casted = RSVP.Promise.cast(value);

  console.log(value === casted); // false
  console.log(casted instanceof RSVP.Promise) // true

  casted.then(function(val) {
    val === value // => true
  });
  ```

  `RSVP.Promise.cast` is similar to `RSVP.Promise.resolve`, but `RSVP.Promise.cast` differs in the
  following ways:

  * `RSVP.Promise.cast` serves as a memory-efficient way of getting a promise, when you
  have something that could either be a promise or a value. RSVP.resolve
  will have the same effect but will create a new promise wrapper if the
  argument is a promise.
  * `RSVP.Promise.cast` is a way of casting incoming thenables or promise subclasses to
  promises of the exact class specified, so that the resulting object's `then` is
  ensured to have the behavior of the constructor you are calling cast on (i.e., RSVP.Promise).

  @method cast
  @static
  @param {Object} object to be casted
  @param {String} label optional string for labeling the promise.
  Useful for tooling.
  @return {Promise} promise
*/
exports['default'] = resolve;
},{"./resolve":142}],140:[function(require,module,exports){
'use strict';
var isArray = require('../utils').isArray;
var isFunction = require('../utils').isFunction;
var isMaybeThenable = require('../utils').isMaybeThenable;
var noop = require('../-internal').noop;
var resolve = require('../-internal').resolve;
var reject = require('../-internal').reject;
var subscribe = require('../-internal').subscribe;
var PENDING = require('../-internal').PENDING;
/**
  `RSVP.Promise.race` returns a new promise which is settled in the same way as the
  first passed promise to settle.

  Example:

  ```javascript
  var promise1 = new RSVP.Promise(function(resolve, reject){
    setTimeout(function(){
      resolve("promise 1");
    }, 200);
  });

  var promise2 = new RSVP.Promise(function(resolve, reject){
    setTimeout(function(){
      resolve("promise 2");
    }, 100);
  });

  RSVP.Promise.race([promise1, promise2]).then(function(result){
    // result === "promise 2" because it was resolved before promise1
    // was resolved.
  });
  ```

  `RSVP.Promise.race` is deterministic in that only the state of the first
  settled promise matters. For example, even if other promises given to the
  `promises` array argument are resolved, but the first settled promise has
  become rejected before the other promises became fulfilled, the returned
  promise will become rejected:

  ```javascript
  var promise1 = new RSVP.Promise(function(resolve, reject){
    setTimeout(function(){
      resolve("promise 1");
    }, 200);
  });

  var promise2 = new RSVP.Promise(function(resolve, reject){
    setTimeout(function(){
      reject(new Error("promise 2"));
    }, 100);
  });

  RSVP.Promise.race([promise1, promise2]).then(function(result){
    // Code here never runs
  }, function(reason){
    // reason.message === "promise 2" because promise 2 became rejected before
    // promise 1 became fulfilled
  });
  ```

  An example real-world use case is implementing timeouts:

  ```javascript
  RSVP.Promise.race([ajax('foo.json'), timeout(5000)])
  ```

  @method race
  @static
  @param {Array} promises array of promises to observe
  @param {String} label optional string for describing the promise returned.
  Useful for tooling.
  @return {Promise} a promise which settles in the same way as the first passed
  promise to settle.
*/
exports['default'] = function race(entries, label) {
    /*jshint validthis:true */
    var Constructor = this, entry;
    var promise = new Constructor(noop, label);
    if (!isArray(entries)) {
        reject(promise, new TypeError('You must pass an array to race.'));
        return promise;
    }
    var length = entries.length;
    function onFulfillment(value) {
        resolve(promise, value);
    }
    function onRejection(reason) {
        reject(promise, reason);
    }
    for (var i = 0; promise._state === PENDING && i < length; i++) {
        subscribe(Constructor.resolve(entries[i]), undefined, onFulfillment, onRejection);
    }
    return promise;
};
},{"../-internal":122,"../utils":147}],141:[function(require,module,exports){
'use strict';
var noop = require('../-internal').noop;
var _reject = require('../-internal').reject;
/**
  `RSVP.Promise.reject` returns a promise rejected with the passed `reason`.
  It is shorthand for the following:

  ```javascript
  var promise = new RSVP.Promise(function(resolve, reject){
    reject(new Error('WHOOPS'));
  });

  promise.then(function(value){
    // Code here doesn't run because the promise is rejected!
  }, function(reason){
    // reason.message === 'WHOOPS'
  });
  ```

  Instead of writing the above, your code now simply becomes the following:

  ```javascript
  var promise = RSVP.Promise.reject(new Error('WHOOPS'));

  promise.then(function(value){
    // Code here doesn't run because the promise is rejected!
  }, function(reason){
    // reason.message === 'WHOOPS'
  });
  ```

  @method reject
  @static
  @param {Any} reason value that the returned promise will be rejected with.
  @param {String} label optional string for identifying the returned promise.
  Useful for tooling.
  @return {Promise} a promise rejected with the given `reason`.
*/
exports['default'] = function reject(reason, label) {
    /*jshint validthis:true */
    var Constructor = this;
    var promise = new Constructor(noop, label);
    _reject(promise, reason);
    return promise;
};
},{"../-internal":122}],142:[function(require,module,exports){
'use strict';
var noop = require('../-internal').noop;
var _resolve = require('../-internal').resolve;
/**
  `RSVP.Promise.resolve` returns a promise that will become resolved with the
  passed `value`. It is shorthand for the following:

  ```javascript
  var promise = new RSVP.Promise(function(resolve, reject){
    resolve(1);
  });

  promise.then(function(value){
    // value === 1
  });
  ```

  Instead of writing the above, your code now simply becomes the following:

  ```javascript
  var promise = RSVP.Promise.resolve(1);

  promise.then(function(value){
    // value === 1
  });
  ```

  @method resolve
  @static
  @param {Any} value value that the returned promise will be resolved with
  @param {String} label optional string for identifying the returned promise.
  Useful for tooling.
  @return {Promise} a promise that will become fulfilled with the given
  `value`
*/
exports['default'] = function resolve(object, label) {
    /*jshint validthis:true */
    var Constructor = this;
    if (object && typeof object === 'object' && object.constructor === Constructor) {
        return object;
    }
    var promise = new Constructor(noop, label);
    _resolve(promise, object);
    return promise;
};
},{"../-internal":122}],143:[function(require,module,exports){
'use strict';
var Promise = require('./promise')['default'];
/**
  This is a convenient alias for `RSVP.Promise.race`.

  @method race
  @static
  @for RSVP
  @param {Array} array Array of promises.
  @param {String} label An optional label. This is useful
  for tooling.
 */
exports['default'] = function race(array, label) {
    return Promise.race(array, label);
};
},{"./promise":137}],144:[function(require,module,exports){
'use strict';
var Promise = require('./promise')['default'];
/**
  This is a convenient alias for `RSVP.Promise.reject`.

  @method reject
  @static
  @for RSVP
  @param {Any} reason value that the returned promise will be rejected with.
  @param {String} label optional string for identifying the returned promise.
  Useful for tooling.
  @return {Promise} a promise rejected with the given `reason`.
*/
exports['default'] = function reject(reason, label) {
    return Promise.reject(reason, label);
};
},{"./promise":137}],145:[function(require,module,exports){
'use strict';
var Promise = require('./promise')['default'];
/**
  This is a convenient alias for `RSVP.Promise.resolve`.

  @method resolve
  @static
  @for RSVP
  @param {Any} value value that the returned promise will be resolved with
  @param {String} label optional string for identifying the returned promise.
  Useful for tooling.
  @return {Promise} a promise that will become fulfilled with the given
  `value`
*/
exports['default'] = function resolve(value, label) {
    return Promise.resolve(value, label);
};
},{"./promise":137}],146:[function(require,module,exports){
'use strict';
/**
  `RSVP.rethrow` will rethrow an error on the next turn of the JavaScript event
  loop in order to aid debugging.

  Promises A+ specifies that any exceptions that occur with a promise must be
  caught by the promises implementation and bubbled to the last handler. For
  this reason, it is recommended that you always specify a second rejection
  handler function to `then`. However, `RSVP.rethrow` will throw the exception
  outside of the promise, so it bubbles up to your console if in the browser,
  or domain/cause uncaught exception in Node. `rethrow` will also throw the
  error again so the error can be handled by the promise per the spec.

  ```javascript
  function throws(){
    throw new Error('Whoops!');
  }

  var promise = new RSVP.Promise(function(resolve, reject){
    throws();
  });

  promise.catch(RSVP.rethrow).then(function(){
    // Code here doesn't run because the promise became rejected due to an
    // error!
  }, function (err){
    // handle the error here
  });
  ```

  The 'Whoops' error will be thrown on the next turn of the event loop
  and you can watch for it in your console. You can also handle it using a
  rejection handler given to `.then` or `.catch` on the returned promise.

  @method rethrow
  @static
  @for RSVP
  @param {Error} reason reason the promise became rejected.
  @throws Error
  @static
*/
exports['default'] = function rethrow(reason) {
    setTimeout(function () {
        throw reason;
    });
    throw reason;
};
},{}],147:[function(require,module,exports){
'use strict';
function objectOrFunction(x) {
    return typeof x === 'function' || typeof x === 'object' && x !== null;
}
exports.objectOrFunction = objectOrFunction;
function isFunction(x) {
    return typeof x === 'function';
}
exports.isFunction = isFunction;
function isMaybeThenable(x) {
    return typeof x === 'object' && x !== null;
}
exports.isMaybeThenable = isMaybeThenable;
var _isArray;
if (!Array.isArray) {
    _isArray = function (x) {
        return Object.prototype.toString.call(x) === '[object Array]';
    };
} else {
    _isArray = Array.isArray;
}
var isArray = _isArray;
exports.isArray = isArray;
// Date.now is not available in browsers < IE9
// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date/now#Compatibility
var now = Date.now || function () {
        return new Date().getTime();
    };
exports.now = now;
var o_create = Object.create || function (object) {
        var o = function () {
        };
        o.prototype = object;
        return o;
    };
exports.o_create = o_create;
},{}],148:[function(require,module,exports){
(function (process){
var should = require('chai').should()
  , RSVP = require('rsvp')
  , Promise = RSVP.Promise
  , Belt = require('belt')
  , Queue = require('../lib/queue')
  , Commands = require('../lib/commands')
  , Queries = require('../lib/queries')
  , Interface = require('../lib/interface')
  , Services = require('../lib/services')
  , Wall = require('../lib/models/wall')
  , Board = require('../lib/models/board')
  , Region = require('../lib/models/region')
  , Pocket = require('../lib/models/pocket')
  , CardLocation = require('../lib/models/cardlocation');

describe.skip('using an adapter', function() {
    var ids = {}
      , opts = {};

    if ( !process.browser ) {
        opts.db = require('memdown');
    }

    var belt = new Belt( 'belt_board_management_test', opts);
    var queue = new Queue();
    var interface = new Interface( queue );
    var commands = new Commands( belt );
    var queries = new Queries( belt );

    var services = new Services( interface, commands, queries );

    var wall, board;
    before(function (done) {
        belt.resource( 'wall', Wall.constructor )
            .schema( Wall.schema )
            .validator( Wall.validator )
            .beforeCreate( Wall.onBeforeCreate )
            .beforeUpdate( Wall.onBeforeUpdate );

        belt.resource( 'board', Board.constructor )
            .schema( Board.schema )
            .validator( Board.validator )
            .beforeCreate( Board.onBeforeCreate )
            .beforeUpdate( Board.onBeforeUpdate );

        belt.resource( 'region', Region.constructor )
            .schema( Region.schema )
            .validator( Region.validator )
            .beforeCreate( Region.onBeforeCreate )
            .beforeUpdate( Region.onBeforeUpdate );

        belt.resource( 'pocket', Pocket.constructor )
            .schema( Pocket.schema )
            .validator( Pocket.validator )
            .beforeCreate( Pocket.onBeforeCreate )
            .beforeUpdate( Pocket.onBeforeUpdate );

        belt.resource( 'cardlocation', CardLocation.constructor )
            .schema( CardLocation.schema )
            .validator( CardLocation.validator )
            .beforeCreate( CardLocation.onBeforeCreate )
            .beforeUpdate( CardLocation.onBeforeUpdate );

        services
            .createWall( { name: 'test wall' } )
            .then(function( resource ) {
                wall = resource;

                return services.createBoard( { wall: wall.getId(), name: 'test board' } );
            })
            .then(function( resource ) {
                board = resource;

                done();
            })
            .catch( done );
    });

    describe('adding boards', function() {

        it('adding a board to a wall', function( done ) {
            var eventCalled = false;

            belt
                .on('board:created', function( resource ) {
                    should.exist( resource );

                    resource.should.be.instanceOf( Board );

                    resource.getWall().should.be.equal( wall.getId() );

                    eventCalled = true;
                });

            services
                .createBoard( { wall: wall.getId(), name: 'test board' } )
                .then(function( resource ) {
                    should.exist( resource );

                    resource.should.be.instanceOf( Board );

                    resource.getWall().should.be.equal( wall.getId() );

                    eventCalled.should.be.equal( true );

                    done();
                })
                .catch( done );
        });

    });

    describe('opening boards for editing', function() {

        it('retreiving all data for displaying a board editor', function( done ) {
            var storedId = board.getId(), storedName = board.getName(), eventCalled = false;


            queue
                .on('boardeditor:displayed', function( board ) {
                    board.getId().should.be.equal( storedId );
                    board.getName().should.be.equal( storedName );

                    eventCalled = true;
                });

            services
                .editBoard( board.getId() )
                .then(function( board ) {
                    board.getId().should.be.equal( storedId );
                    board.getName().should.be.equal( storedName );

                    eventCalled.should.be.equal( true );

                    done();
                })
                .catch( done );
        });

    });

    describe('modifying board data', function() {

        it('updating one board', function( done ) {
            var eventCalled = false;

            var update = {
                id: board.getId()
              , name: 'test board modified'
              , wall: board.getWall()
            };

            belt
                .on('board:updated', function( board ) {
                    should.exist( board );

                    board.should.be.instanceOf( Board );

                    board.getName().should.be.equal( 'test board modified' );

                    eventCalled = true;
                });


            services
                .updateBoard( update )
                .then(function( resource ) {
                    should.exist( resource );

                    resource.should.be.instanceOf( Board );

                    resource.getName().should.be.equal( 'test board modified' );

                    eventCalled.should.equal( true );

                    done();
                })
                .catch( done );
        });

    });

    afterEach(function (done) {
        queue.clearAll();

        var removeBoards = belt.findMany( 'board' )
            .then(function( resources ) {
                var promises = [];

                resources.forEach(function( resource ) {
                    if ( resource.getId() !== board.getId() ) {
                        promises.push( belt.delete( 'board', resource.getId() ) );
                    }
                });

                return RSVP.all( promises );
            });

        var removePockets = belt.findMany( 'pocket' )
            .then(function( resources ) {
                var promises = resources.map(function( resource ) {
                    return belt.delete( 'pocket', resource.getId() );
                });

                return RSVP.all( promises );
            });

        RSVP.all( [ removeBoards, removePockets ] )
            .then(function() {
                done();
            })
            .catch( done );
    });

    after(function (done) {
        belt.findMany( 'wall' )
            .then(function( walls ) {
                var promises = walls.map(function( wall ) {
                    return belt.delete( 'wall', wall.getId() );
                });

                return RSVP.all( promises );
            })
            .then(function() {
                return belt.delete( 'board', board.getId() );
            })
            .then(function() {
                done();
            })
            .catch( done );
    });

});

}).call(this,require("JkpR2F"))
},{"../lib/commands":2,"../lib/interface":3,"../lib/models/board":4,"../lib/models/cardlocation":5,"../lib/models/pocket":6,"../lib/models/region":7,"../lib/models/wall":9,"../lib/queries":10,"../lib/queue":13,"../lib/services":14,"JkpR2F":59,"belt":18,"chai":21,"memdown":62,"rsvp":121}],149:[function(require,module,exports){
(function (process){
function ExecutionTimer( object, label ) {
    for ( var key in object ) {
        wrapMethod.call( this, label, object, key );
    }

    ExecutionTimer.logs = {};
}

ExecutionTimer.process = function() {
    var logs = ExecutionTimer.logs, count = 0, stats = [];

    console.log( '\nSummary\n-------' );

    for (var label in logs) {
        var values = logs[ label ];

        values.forEach(addValues);

        var average = Math.round(count / values.length);

        stats.push({ label:label, count:values.length, average:average, values:values });

        count = 0;
    }

    stats.sort(function(a, b){
        return b.average - a.average;
    });

    stats.forEach(function(stat) {
        console.log( stat.label, stat.count, stat.average + 'ms' );
    });

    function addValues( val ) {
        count = count + val;
    }
};

function wrapMethod( label, object, propertyName ) {
    var original = object[ propertyName ], _this = this;

    if ( typeof( original ) !== 'function' ) return;

    object[ propertyName ] = function() {
        var start = process.hrtime();

        var output =  original.apply( object, arguments );

        if ( output.then ) {
            return output.then(function( resource ) {
                complete.call( _this, label + '.' + propertyName + '.then(' + !!resource + ')', start );

                return resource;
            });
        }

        // complete( label + '.' + propertyName + '(' + !!output + ')', start );

        return output;
    };
}

function complete( label, start ) {
    var timing = Math.round(process.hrtime( start )[1] / 1000000);

    //console.log( label, timing + 'ms' );

    ExecutionTimer.logs[ label ] = ExecutionTimer.logs[ label ] || [];
    ExecutionTimer.logs[ label ].push( timing );
}

module.exports = ExecutionTimer;

}).call(this,require("JkpR2F"))
},{"JkpR2F":59}],150:[function(require,module,exports){
var chai = require('chai')
  , should = chai.should()
  , RSVP = require('rsvp')
  , Promise = RSVP.Promise
  , ExecutionTimer = require('./executionTimer')
  , TestQueue = require('../lib/queue.extensions')
  , Application = require('../lib/application')
  , UI = require('../lib/interface');

var debug = false;

var queue = new TestQueue({ debug: debug });
var ui = new UI( queue );
var application = new Application( queue, ui, { debug: debug } );
var belt = application.belt;

ExecutionTimer( application.commands, 'Commands' );
ExecutionTimer( application.queries, 'Queries' );
ExecutionTimer( application.interface, 'Interface' );
ExecutionTimer( application.belt, 'Belt' );


/*
  CARD --> NEW, EDIT, UPDATE

  REGION --> NEW, EDIT, UPDATE, UPDATE

  TRANSFORM --> CREATE, UNLINK
*/

var _this = this;

var features = [
    require( './features/wall.new' )
  , require( './features/wall.create' )
  , require( './features/wall.select' )
  , require( './features/wall.select.withMultipleWalls' )
  , require( './features/wall.display' )
  , require( './features/wall.display.withCompleteBoard' )
  , require( './features/wall.edit' )
  , require( './features/wall.update' )

  , require( './features/board.new' )
  , require( './features/board.create' )
  , require( './features/board.create.withCompleteBoard' )
  , require( './features/board.display' )
  , require( './features/board.display.withCompleteBoard' )
  , require( './features/board.edit' )
  , require( './features/board.update' )

  , require( './features/card.create' )
  , require( './features/card.create.withMultipleBoard' )
  , require( './features/card.create.toDisplayedBoardOFMultipleBoards' )
  , require( './features/card.move.intoEmptyArea' )
  , require( './features/card.move.overARegion' )

  , require( './features/region.create' )
  , require( './features/region.move.intoEmptyArea' )
  , require( './features/region.move.UnderACard' )

];

Fixture('Application service API Features', function() {
    var featureSet = {}
      , fixture = {
          debug: debug
        , queue: queue
        , application: application
        , scenarios: {
            TwoBoardsOneWithRegions: setupPopulatedBoardScenario
          , OneEmptyBoard: setupEmptyBoardScenario
          , multipleWalls: setupMultipleWallScenario
        }
      };

    features.forEach(function( features ) {
        if (!features.length) {
            features = [ features ];
        }

        features.forEach(function( feature ) {
            featureSet[feature.title] = featureSet[feature.title] || [];

            featureSet[feature.title].push( feature );
        });
    });

    for (var title in featureSet) {
        Feature( title, generateCallList( featureSet[title] ) );
    }

    function generateCallList( calls ) {
        return function() {
            calls.forEach(function(feature ) {
                feature.call( fixture );
            });
        };
    }

    afterEach(function (done) {
        if (this.currentTest.state === 'failed') console.log( queue.getCalls() );

        queue.clearCalls();
        application.startListening();
/*
        var promises =[];

        [ 'region', 'cardlocation', 'pocket', 'board', 'wall' ]
            .forEach(function( schema ) {
                var promise = belt.findMany( schema )
                    .then(function( resources ) {
                        if (!resources.length) return;

                        var promises = resources.map(function( resource ) {
                            return new Promise(function(resolve, reject) {
                                belt.delete( schema, resource.getId() )
                                    .then(function() {
                                        resolve();
                                    })
                                    .catch( reject );
                            });
                        });

                        return RSVP.all( promises );
                    });

                promises.push( promise );
            });

        RSVP.all( promises )
            .then(function() {
                queue.clearCalls();
                application.startListening();

                done();
            })
            .catch( done );
        */

        done();
    });

    after(function() {
        ExecutionTimer.process();
    });
});

// helpers

function Fixture( title, fn ) {
    describe( underline( title, '=', 2, '\n' ), fn );
}

function Feature( title, fn ) {
    describe( underline( title, '-', 4, '' ), fn );
}

function underline( title, format, indent, endWith ) {
    return title + '\n' +
        new Array( indent + 1 ).join( ' ' ) +
        new Array( title.length + 1 ).join( format ) +
        endWith;
}




// setup routines

function setupMultipleWallScenario() {
    application.pauseListening();

    return new Promise(function( resolve, reject ) {
        var storage = {}
          , promises = [];

        promises.push( belt.create('wall', { name: 'Multiple Wall Scenario One' }) );
        promises.push( belt.create('wall', { name: 'Multiple Wall Scenario two' }) );
        promises.push( belt.create('wall', { name: 'Multiple Wall Scenario Three' }) );

        RSVP.all( promises )
            .then(function( resources ) {
                storage.walls = resources;

                var promises = [];

                promises.push( belt.create('board', { wall: resources[0].getId(), name: 'Empty Board One' }) );
                promises.push( belt.create('board', { wall: resources[1].getId(), name: 'Empty Board Two' }) );
                promises.push( belt.create('board', { wall: resources[2].getId(), name: 'Empty Board Three' }) );

                return RSVP.all( promises );
            })
            .then(function( resources ) {
                storage.boards = resources;

                application.startListening();

                resolve( storage );
            }, reject)
            .catch( reject );
    });
}

function setupEmptyBoardScenario() {
    application.pauseListening();

    return new Promise(function( resolve, reject ) {
        var storage = {};

        // one wall
        belt.create( 'wall', { name: 'Empty Board Scenario' })
            .then(function( resource ) {
                storage.wall = resource;

                var promises = [];

                promises.push( belt.create('board', { wall: storage.wall.getId(), name: 'Empty Board' }) );

                return RSVP.all( promises );
            })
            .then(function( resources ) {
                storage.boards = resources;

                application.startListening();

                resolve( storage );
            }, reject)
            .catch( reject );
    });
}

function setupPopulatedBoardScenario() {
    application.pauseListening();

    return new Promise(function( resolve, reject ) {
        var storage = {};

        // one wall
        belt.create( 'wall', { name: 'Populated Board Scenario' })
            .then(function( resource ) {
                storage.wall = resource;

                var promises = [];

                promises.push( belt.create('board', { wall: storage.wall.getId(), name: 'Board with cards only' }) );
                promises.push( belt.create('board', { wall: storage.wall.getId(), name: 'Board with regions' }) );

                return RSVP.all( promises );
            })
            .then(function( resources ) {
                storage.boards = resources;

                var promises = [], board = storage.boards[1];

                promises.push( belt.create('region', { board: board.getId(), label: 'Red Region', value: 1, color: 'red', x: 300, y:50, width:200, height:200 }) );
                promises.push( belt.create('region', { board: board.getId(), label: 'Blue Region', value: 2, color: 'blue', x: 300, y:300, width:200, height:200 }) );

                return RSVP.all( promises );
            })
            .then(function( resources ) {
                storage.regions = resources;

                var promises = [];

                promises.push( belt.create('pocket', { wall: storage.wall.getId(), title: 'First Card' }) );
                promises.push( belt.create('pocket', { wall: storage.wall.getId(), title: 'Second Card' }) );

                return RSVP.all( promises );
            })
            .then(function( resources ) {
                storage.pockets = resources;

                var promises = [];

                promises.push( belt.create('cardlocation', { pocket: storage.pockets[0].getId(), board: storage.boards[0].getId(), x:50, y:50 }) );
                promises.push( belt.create('cardlocation', { pocket: storage.pockets[1].getId(), board: storage.boards[0].getId(), x:50, y:50 }) );
                promises.push( belt.create('cardlocation', { pocket: storage.pockets[0].getId(), board: storage.boards[1].getId(), x:400, y:50 }) );
                promises.push( belt.create('cardlocation', { pocket: storage.pockets[1].getId(), board: storage.boards[1].getId(), x:400, y:50 }) );

                return RSVP.all( promises );
            })
            .then(function( resources ) {
                storage.locations = resources;

                application.startListening();

                resolve( storage );
            }, reject)
            .catch( reject );
    });
}




// additional assertions

chai.Assertion.addMethod('haveLogged', shouldHaveLogged);

function shouldHaveLogged( events ) {
    var queue = this._obj.getCalls();

    var i = 0, len = events.length;

    for (; i < len; i++) {
        queue[i].event.should.equal( events[i], 'expected queued event ' + i + ' to equal ' + events[i] + '\n' );
    }

    queue.length.should.equal( len, 'expected number of queued event to equal ' + len + '\n'  );
}

chai.Assertion.addMethod('specificWallResource', shouldBeSpecificWallResource);

function shouldBeSpecificWallResource( expectedName ) {
    var resource = this._obj;

    resource.should.respondTo( 'getId' );
    resource.should.respondTo( 'getName' );
    resource.getName().should.equal( expectedName );
}

chai.Assertion.addMethod('specificBoardResource', shouldBeSpecificBoardResource);

function shouldBeSpecificBoardResource( expectedName, expectedWallId ) {
    var resource = this._obj;

    resource.should.respondTo( 'getId' );
    resource.should.respondTo( 'getName' );
    resource.getName().should.equal( expectedName );
    resource.should.respondTo( 'getWall' );
    resource.getWall().should.equal( expectedWallId );
    resource.should.respondTo( 'getTransforms' );
    resource.should.respondTo( 'getCardLocations' );
    resource.should.respondTo( 'getRegions' );
}

chai.Assertion.addMethod('specificCardResource', shouldBeSpecificCardResource);

function shouldBeSpecificCardResource( expectedTitle, expectedWallId ) {
    var resource = this._obj;

    resource.should.respondTo( 'getId' );
    resource.should.respondTo( 'getTitle' );
    resource.getTitle().should.equal( expectedTitle );
    resource.should.respondTo( 'getWall' );
    resource.getWall().should.equal( expectedWallId );
    resource.should.respondTo( 'getContent' );
    resource.should.respondTo( 'getTags' );
    resource.should.respondTo( 'getMentions' );
    resource.should.respondTo( 'getCardnumber' );
    resource.should.respondTo( 'getCardLocations' );
    resource.should.respondTo( 'getRegions' );
}

chai.Assertion.addMethod('specificRegionResource', shouldBeSpecificRegionResource);

function shouldBeSpecificRegionResource( expectedLabel, expectedBoardId ) {
    var resource = this._obj;

    resource.should.respondTo( 'getId' );
    resource.should.respondTo( 'getLabel' );
    resource.getLabel().should.equal( expectedLabel );
    resource.should.respondTo( 'getBoard' );
    resource.getBoard().should.equal( expectedBoardId );
    resource.should.respondTo( 'getColor' );
    resource.should.respondTo( 'getValue' );
    resource.should.respondTo( 'getX' );
    resource.should.respondTo( 'getY' );
    resource.should.respondTo( 'getHeight' );
    resource.should.respondTo( 'getWidth' );
    resource.should.respondTo( 'getPockets' );
}

},{"../lib/application":1,"../lib/interface":3,"../lib/queue.extensions":12,"./executionTimer":149,"./features/board.create":151,"./features/board.create.withCompleteBoard":152,"./features/board.display":153,"./features/board.display.withCompleteBoard":154,"./features/board.edit":155,"./features/board.new":156,"./features/board.update":157,"./features/card.create":158,"./features/card.create.toDisplayedBoardOFMultipleBoards":159,"./features/card.create.withMultipleBoard":160,"./features/card.move.intoEmptyArea":161,"./features/card.move.overARegion":162,"./features/region.create":163,"./features/region.move.UnderACard":164,"./features/region.move.intoEmptyArea":165,"./features/wall.create":166,"./features/wall.display":167,"./features/wall.display.withCompleteBoard":168,"./features/wall.edit":169,"./features/wall.new":170,"./features/wall.select":171,"./features/wall.select.withMultipleWalls":172,"./features/wall.update":173,"chai":21,"rsvp":121}],151:[function(require,module,exports){
var chai = require('chai')
  , should = chai.should();

var storedName = 'new board'
  , storedWall
  , resourceChecked = false
  , queueChecked = false;



function features() {
    var services = this.application.services
      , belt = this.application.belt
      , queue = this.queue;

    before(function(done) {

        queue.once( 'boardcreator:displayed', function() {
            queue.clearCalls();

            done();
        });

        services.createWall({ name: 'wall for board' })
            .then(function( wall ) {
                storedWall = wall;
            });
    });

    it('Emit a <board:create> event passing a data object with a valid wall id and a name attribute to trigger the process of creating a new board\n',
        function( done ) {

            queue.trigger( 'board:create', { wall: storedWall.getId(), name: storedName } );

            queue.once( 'board:added', function( resource ) {
                should.exist( resource );

                resource.should.be.a.specificBoardResource( storedName, storedWall.getId() );

                resourceChecked = true;
            });

            queue.once( 'controls:enabled', function() {
                queue.should.haveLogged([
                        'board:create'
                      , 'board:created'
                      , 'board:added'
                      , 'board:displayed'
                      , 'controls:enabled'
                    ]);

                queueChecked = true;
            });

            queue.once( 'controls:enabled', function() {
                resourceChecked.should.equal( true );
                queueChecked.should.equal( true );

                done();
            });

        });

}

features.title = 'Creating a board';

module.exports = features;

},{"chai":21}],152:[function(require,module,exports){
var chai = require('chai')
  , should = chai.should();

var storedWall
  , storedBoard
  , storedName = 'board with cards added automatically'
  , resourceChecked = false
  , queueChecked = false;



function features() {
    var services = this.application.services
      , belt = this.application.belt
      , queue = this.queue
      , scenarios = this.scenarios;

    before(function(done) {

        scenarios.TwoBoardsOneWithRegions()
            .then(function( storage ) {
                storedWall = storage.wall;
                storedBoard = storage.boards[1];

                queue.clearCalls();

                done();
            });
    });

    it('Any cards that are already available to the Boards associated Wall will be automatically created and placed on the new Board\n',
        function( done ) {

            queue.trigger( 'board:create', { wall: storedWall.getId(), name: storedName } );

            queue.once( 'board:added', function( resource ) {
                should.exist( resource );

                resource.should.be.a.specificBoardResource( storedName, storedWall.getId() );

                resourceChecked = true;
            });

            queue.once( 'cardlocation:created', function() {
                // check on the second event

                queue.once( 'cardlocation:created', function() {
                    queue.should.haveLogged([
                            'board:create'
                          , 'board:created'
                          , 'board:added'
                          , 'cardlocation:created'
                          , 'cardlocation:created'
                        ]);

                    queueChecked = true;
                });

                queue.once( 'cardlocation:created', function() {
                    resourceChecked.should.equal( true );
                    queueChecked.should.equal( true );

                    done();
                });
            });

        });

}

features.title = 'Creating a board on a wall where cards already exist';

module.exports = features;

},{"chai":21}],153:[function(require,module,exports){
var chai = require('chai')
  , should = chai.should()
  , RSVP = require('rsvp')
  , Promise = RSVP.Promise;

var storedName = 'display board'
  , storedWall
  , storedBoard
  , resourceChecked = false
  , queueChecked = false;

function features() {
    var services = this.application.services
      , queue = this.queue;

    before(function(done) {

        services.createWall({ name: 'parent wall for board' })
            .then(function( wall ) {
                storedWall = wall;

                var promises = [];

                promises.push( services.createBoard({ wall: wall.getId(), name: 'other board' }) );
                promises.push( services.createBoard({ wall: wall.getId(), name: storedName }) );

                return RSVP.all( promises );
            })
            .then(function( boards ) {
                storedBoard = boards[1];

                queue.once( 'controls:enabled', function() {
                    queue.clearCalls();

                    done();
                });
            })
            .catch( done );
    });

    it('Emit a <board:display> event passing a valid board id to trigger the process of rendering an existing Board\n',
            function(done) {

        queue.trigger( 'board:display', storedBoard.getId() );

        queue.once( 'board:displayed', function( resource ) {
            should.exist( resource );

            resource.should.be.a.specificBoardResource( storedName, storedWall.getId() );
            resource.getId().should.equal( storedBoard.getId() );

            resourceChecked = true;
        });

        queue.once( 'controls:enabled', function() {
            queue.should.haveLogged([
                    'board:display'
                  , 'board:displayed'
                  , 'controls:enabled'
                ]);

            queueChecked = true;
        });

        queue.once( 'controls:enabled', function() {
            resourceChecked.should.equal( true );
            queueChecked.should.equal( true );

            done();
        });

    });
}

features.title = 'Selecting a Board for display';

module.exports = features;

},{"chai":21,"rsvp":121}],154:[function(require,module,exports){
var chai = require('chai')
  , should = chai.should()
  , RSVP = require('rsvp')
  , Promise = RSVP.Promise;

var storedName = 'Board with regions'
  , storedWall
  , storedBoard
  , resourceChecked = false
  , queueChecked = false;

function features() {
    var services = this.application.services
      , scenarios = this.scenarios
      , queue = this.queue;

    before(function(done) {
        queue.once('boardselector:displayed', function( board ) {
            queue.clearCalls();

            done();
        });

        scenarios.TwoBoardsOneWithRegions()
            .then(function( storage ) {
                storedWall = storage.wall;
                storedBoard = storage.boards[1];

                queue.trigger( 'wall:display', storedWall.getId() );
            });
    });

    it('Any card and regions already associated with a board will also be displayed\n',
            function(done) {

        queue.trigger( 'board:display', storedBoard.getId() );

        queue.once( 'board:displayed', function( resource ) {
            should.exist( resource );

            resource.should.be.a.specificBoardResource( storedName, storedWall.getId() );
            resource.getId().should.equal( storedBoard.getId() );

            resourceChecked = true;
        });

        queue.once( 'controls:enabled', function() {
            queue.should.haveLogged([
                    'board:display'
                  , 'cardlocation:displayed'
                  , 'cardlocation:displayed'
                  , 'board:displayed'
                  , 'controls:enabled'
                ]);

            queueChecked = true;
        });

        queue.once( 'controls:enabled', function() {
            resourceChecked.should.equal( true );
            queueChecked.should.equal( true );

            done();
        });

    });
}

features.title = 'Selecting a pre populated Board for display';

module.exports = features;

},{"chai":21,"rsvp":121}],155:[function(require,module,exports){
var chai = require('chai')
  , should = chai.should();

var storedName = 'unedited board'
  , storedWall
  , storedBoard
  , resourceChecked = false
  , queueChecked = false;



function features() {
    var services = this.application.services
      , queue = this.queue;

    before(function(done) {

        queue.once( 'board:created', function( board ) {
            storedBoard = board;
        });

        queue.once( 'controls:enabled', function() {
            queue.clearCalls();

            done();
        });

        services.createWall({ name: 'parent wall for board' })
            .then(function( wall ) {
                storedWall = wall;

                services.createBoard({ wall: wall.getId(), name: storedName });
            });
    });

    it('Emit a <board:edit> event with a valid board id to access an input control allowing you to enter new details for a Board\n',
            function(done) {

        queue.trigger( 'board:edit', storedBoard.getId() );

        queue.once( 'boardeditor:displayed', function() {
            queue.should.haveLogged([
                    'board:edit'
                  , 'boardeditor:displayed'
                ]);

            queueChecked = true;
        });

        queue.once( 'boardeditor:displayed', function() {
            queueChecked.should.equal( true );

            done();
        });

    });

}

features.title = 'Accessing the board editor input control';

module.exports = features;

},{"chai":21}],156:[function(require,module,exports){
var chai = require('chai')
  , should = chai.should();

var resourceChecked = false
  , queueChecked = false
  , storedWall;

function features() {
    var services = this.application.services
      , queue = this.queue;

    before(function(done) {

        queue.once( 'boardcreator:displayed', function() {
            queue.clearCalls();

            done();
        });

        services.createWall({ name: 'wall for board' })
            .then(function( wall ) {
                storedWall = wall;
            });
    });

    it('Emit a <wall:new> event passing a valid wall id to access an input control allowing you to enter details required to create a new Board\n',
            function(done) {

        queue.trigger( 'board:new', storedWall.getId() );

        queue.once( 'boardcreator:displayed', function( resource ) {
            should.not.exist( resource );

            resourceChecked = true;
        });

        queue.once( 'boardcreator:displayed', function() {
            queue.should.haveLogged([
                    'board:new'
                  , 'boardcreator:displayed'
                ]);

            queueChecked = true;
        });

        queue.once( 'boardcreator:displayed', function() {
            resourceChecked.should.equal( true );
            queueChecked.should.equal( true );

            done();
        });

    });

}

features.title = 'Accessing the board creator input control';

module.exports = features;

},{"chai":21}],157:[function(require,module,exports){
var chai = require('chai')
  , should = chai.should();

var storedName = 'unedited board'
  , editedName = 'edited board'
  , storedWall
  , storedBoard
  , resourceChecked = false
  , queueChecked = false;

function features() {
    var services = this.application.services
      , queue = this.queue;

    before(function(done) {

        queue.once( 'board:created', function( board ) {
            storedBoard = board;
        });

        queue.once( 'controls:enabled', function() {
            queue.clearCalls();

            done();
        });

        services.createWall({ name: 'parent wall for board' })
            .then(function( wall ) {
                storedWall = wall;

                services.createBoard({ wall: wall.getId(), name: storedName });
            });
    });

    it('Emit a <board:update> event passing an updated data object with a valid board id trigger the process of updating the stored data for an existing Board\n',
            function(done) {

        var update = {
            id: storedBoard.getId(),
            wall: storedBoard.getWall(),
            name: editedName
        };

        queue.trigger( 'board:update', update );

        queue.once( 'board:updated', function( resource ) {
            should.exist( resource );

            resource.should.be.a.specificBoardResource( editedName, storedWall.getId() );
            resource.getId().should.equal( storedBoard.getId() );

            resourceChecked = true;
        });

        queue.once( 'board:updated', function() {
            queue.should.haveLogged([
                    'board:update'
                  , 'board:updated'
                ]);

            queueChecked = true;
        });

        queue.once( 'board:updated', function() {
            resourceChecked.should.equal( true );
            queueChecked.should.equal( true );

            done();
        });

    });

}

features.title = 'Updating a Board';

module.exports = features;

},{"chai":21}],158:[function(require,module,exports){
var chai = require('chai')
  , should = chai.should();

var storedName = 'new card'
  , resourceChecked = false
  , queueChecked = false;



function features() {
    var services = this.application.services
      , queue = this.queue;

    before(function(done) {

        queue.once( 'boardcreator:displayed', function() {
            queue.clearCalls();

            done();
        });

        services.createWall({ name: 'wall for card' })
            .then(function( wall ) {
                storedWall = wall;
            });
    });

    it('Emit a <pocket:create> event passing a data object with a valid wall id and a title attribute to trigger the process of creating a new Card\n',
            function( done ) {

        queue.trigger( 'pocket:create', { wall: storedWall.getId(), title: storedName } );

        queue.once( 'pocket:created', function( resource ) {
            should.exist( resource );

            resource.should.be.a.specificCardResource( storedName, storedWall.getId() );

            resourceChecked = true;
        });

        queue.once( 'pocket:created', function() {
            queue.should.haveLogged([
                    'pocket:create'
                  , 'pocket:created'
                ]);

            queueChecked = true;
        });

        queue.once( 'pocket:created', function() {
            resourceChecked.should.equal( true );
            queueChecked.should.equal( true );

            done();
        });

    });

}

features.title = 'Creating a Card on a Board';

module.exports = features;

},{"chai":21}],159:[function(require,module,exports){
var chai = require('chai')
  , should = chai.should();

var storedName = 'new card'
  , storedWall
  , storedBoard
  , storedPocket
  , resourceChecked = false
  , locationChecked = false
  , queueChecked = false;



function features() {
    var services = this.application.services
      , scenarios = this.scenarios
      , queue = this.queue;

    before(function(done) {

        scenarios.TwoBoardsOneWithRegions()
            .then(function( storage ) {
                storedWall = storage.wall;
                storedBoard = storage.boards[0];

                return services.displayWall( storedWall.getId() );
            })
            .then(function() {
                return services.displayBoard( storedBoard.getId() );
            })
            .then(function() {
                queue.clearCalls();

                done();
            });
    });

    it('Emit a <pocket:create> event passing a data object with a valid wall id and a title attribute to trigger the process of creating a new Card\n',
        function( done ) {

            queue.trigger( 'pocket:create', { wall: storedWall.getId(), title: storedName } );

            queue.once( 'pocket:created', function( resource ) {
                storedPocket = resource;

                should.exist( resource );

                resource.should.be.a.specificCardResource( storedName, storedWall.getId() );

                resourceChecked = true;
            });

            queue.once( 'cardlocation:created', function( resource ) {
                should.exist( resource );

                resource.should.respondTo( 'getId' );
                resource.should.respondTo( 'getPocket' );
                resource.getPocket().should.equal( storedPocket.getId() );
                resource.should.respondTo( 'getBoard' );
                resource.getBoard().should.equal( storedBoard.getId() );

                queue.once( 'cardlocation:created', function( resource ) {
                    should.exist( resource );

                    resource.should.respondTo( 'getId' );
                    resource.should.respondTo( 'getPocket' );
                    resource.getPocket().should.equal( storedPocket.getId() );
                    resource.should.respondTo( 'getBoard' );
                    resource.getBoard().should.not.equal( storedBoard.getId() );

                    locationChecked = true;
                });

                queue.once( 'cardlocation:created', function() {
                    queue.should.haveLogged([
                            'pocket:create'
                          , 'cardlocation:displayed'  // muddy event from displayWall
                          , 'cardlocation:displayed'  // muddy event from displayWall
                          , 'pocket:created'
                          , 'cardlocation:created'
                          , 'cardlocation:displayed'
                          , 'cardlocation:created'
                        ]);

                    queueChecked = true;
                });

                queue.once( 'cardlocation:created', function() {
                    resourceChecked.should.equal( true );
                    locationChecked.should.equal( true );
                    queueChecked.should.equal( true );

                    done();
                });
            });

        });

}

features.title = 'Creating a Card for a displayed board when there are multiple other Boards';

module.exports = features;

},{"chai":21}],160:[function(require,module,exports){
var chai = require('chai')
  , should = chai.should();

var storedName = 'new card'
  , storedWall
  , storedBoard
  , storedPocket
  , resourceChecked = false
  , locationChecked = false
  , queueChecked = false;

function features() {
    var services = this.application.services
      , scenarios = this.scenarios
      , queue = this.queue;

    before(function(done) {

        scenarios.TwoBoardsOneWithRegions()
            .then(function( storage ) {
                storedWall = storage.wall;
                storedBoard = storage.boards[0];

                queue.clearCalls();

                done();
            });
    });

    it('Emit a <pocket:create> event passing a data object with a valid wall id and a title attribute to trigger the process of creating a new Card\n',
        function( done ) {


            queue.trigger( 'pocket:create', { wall: storedWall.getId(), title: storedName } );

            queue.once( 'pocket:created', function( resource ) {
                storedPocket = resource;

                should.exist( resource );

                resource.should.be.a.specificCardResource( storedName, storedWall.getId() );

                resourceChecked = true;
            });

            queue.once( 'cardlocation:created', function( resource ) {
                should.exist( resource );

                resource.should.respondTo( 'getId' );
                resource.should.respondTo( 'getPocket' );
                resource.should.respondTo( 'getBoard' );
                resource.getPocket().should.equal( storedPocket.getId() );

                locationChecked = true;
            });

            queue.once( 'cardlocation:created', function() {
                queue.once( 'cardlocation:created', function() {
                    queue.should.haveLogged([
                            'pocket:create'
                          , 'pocket:created'
                          , 'cardlocation:created'
                          , 'cardlocation:created'
                        ]);

                    queueChecked = true;
                });

                queue.once( 'cardlocation:created', function() {
                    resourceChecked.should.equal( true );
                    locationChecked.should.equal( true );
                    queueChecked.should.equal( true );

                    done();
                });
            });

        });

}

features.title = 'Creating a Card on a wall with multiple Boards';

module.exports = features;

},{"chai":21}],161:[function(require,module,exports){
var chai = require('chai')
  , should = chai.should();

var storedName = 'new card'
  , storedWall
  , storedBoard
  , storedPocket
  , storedLocation
  , resourceChecked = false
  , locationChecked = false
  , queueChecked = false
  , update;



function features() {
    var services = this.application.services
      , scenarios = this.scenarios
      , queue = this.queue;

    before(function(done) {

        scenarios.TwoBoardsOneWithRegions()
            .then(function( storage ) {
                storedWall = storage.wall;
                storedBoard = storage.boards[0];
                storedPocket = storage.pockets[0];
                storedLocation = storage.locations[0];

                update = {
                    id: storedLocation.getId(),
                    x: 600,
                    y: 600
                };

                queue.clearCalls();

                done();
            });
    });

    it('Emit a <cardlocation:move> event passing a data object with a valid location id and coordinates to trigger the process of moving a Card around a Board\n',
        function( done ) {

            queue.trigger( 'cardlocation:move', update );

            queue.once( 'cardlocation:updated', function( resource ) {
                should.exist( resource );

                resource.should.respondTo( 'getId' );
                resource.should.respondTo( 'getPocket' );
                resource.getPocket().should.equal( storedPocket.getId() );
                resource.should.respondTo( 'getBoard' );
                resource.getBoard().should.equal( storedBoard.getId() );
                resource.should.respondTo( 'getX' );
                resource.getX().should.equal( update.x );
                resource.should.respondTo( 'getY' );
                resource.getY().should.equal( update.y );

                locationChecked = true;
            });

            queue.once( 'cardlocation:updated', function() {
                queue.should.haveLogged([
                        'cardlocation:move'
                      , 'cardlocation:updated'
                    ]);

                queueChecked = true;
            });

            queue.once( 'cardlocation:updated', function() {
                locationChecked.should.equal( true );
                queueChecked.should.equal( true );

                done();
            });

        });

}

features.title = 'Moving a displayed card into an empty area on the displayed board';

module.exports = features;

},{"chai":21}],162:[function(require,module,exports){
var chai = require('chai')
  , should = chai.should();

var storedName = 'new card'
  , storedWall
  , storedBoard
  , storedPocket
  , storedRegion
  , storedLocation
  , resourceChecked = false
  , locationChecked = false
  , queueChecked = false
  , update;



function features() {
    var services = this.application.services
      , scenarios = this.scenarios
      , queue = this.queue;

    before(function(done) {

        scenarios.TwoBoardsOneWithRegions()
            .then(function( storage ) {
                storedWall = storage.wall;
                storedBoard = storage.boards[1];
                storedPocket = storage.pockets[0];
                storedRegion = storage.regions[0];
                storedLocation = storage.locations[2];

                update = {
                    id: storedLocation.getId(),
                    x: 350,
                    y: 100
                };

                queue.clearCalls();

                done();
            });
    });

    it('Emit a <cardlocation:move> event passing a data object with a valid location id and coordinates within a Region on the same Board to trigger the process of moving a Card over a Region on a Board\n',
        function( done ) {

            queue.trigger( 'cardlocation:move', update );

            queue.once( 'cardlocation:updated', function( resource ) {
                should.exist( resource );

                resource.should.respondTo( 'getId' );
                resource.should.respondTo( 'getPocket' );
                resource.getPocket().should.equal( storedPocket.getId() );
                resource.should.respondTo( 'getBoard' );
                resource.getBoard().should.equal( storedBoard.getId() );
                resource.should.respondTo( 'getX' );
                resource.getX().should.equal( update.x );
                resource.should.respondTo( 'getY' );
                resource.getY().should.equal( update.y );

                locationChecked = true;
            });

            queue.once( 'pocket:updated', function( resource ) {
                resource.getId().should.equal( storedPocket.getId() );
                resource.getRegions().should.contain( storedRegion.getId() );

                resourceChecked = true;
            });

            queue.once( 'pocket:regionenter', function( info ) {
                info.pocket.getId().should.equal( storedPocket.getId() );
                info.region.getId().should.equal( storedRegion.getId() );

                queue.should.haveLogged([
                        'cardlocation:move'
                      , 'cardlocation:updated'
                      , 'pocket:updated'
                      , 'pocket:regionenter'
                    ]);

                queueChecked = true;
            });

            queue.once( 'pocket:regionenter', function() {
                resourceChecked.should.equal( true );
                locationChecked.should.equal( true );
                queueChecked.should.equal( true );

                done();
            });

        });

}

features.title = 'Moving a displayed card over a region on the displayed board';

module.exports = features;

},{"chai":21}],163:[function(require,module,exports){
var chai = require('chai')
  , should = chai.should()
  , RSVP = require('rsvp')
  , Promise = RSVP.Promise;

var storedName = 'Created Region'
  , storedWall
  , storedBoard
  , resourceChecked = false
  , queueChecked = false;

function features() {
    var services = this.application.services
      , queue = this.queue;

    before(function(done) {

        services.createWall({ name: 'Regions  wall' })
            .then(function( wall ) {
                storedWall = wall;

                return services.createBoard({ wall: wall.getId(), name: 'Board for Region Create' });
            })
            .then(function( board ) {
                storedBoard = board;

                queue.once( 'controls:enabled', function() {
                    queue.clearCalls();

                    done();
                });
            })
            .catch( done );
    });

    it('Emit a <region:create> event passing a data object with a valid Board id and a label attribute to trigger the process of creating a new Region\n',
            function( done ) {

        queue.trigger( 'region:create', { board: storedBoard.getId(), label: storedName } );

        queue.once( 'region:created', function( resource ) {
            should.exist( resource );

            resource.should.be.a.specificRegionResource( storedName, storedBoard.getId() );

            resourceChecked = true;
        });

        queue.once( 'region:created', function() {
            queue.should.haveLogged([
                    'region:create'
                  , 'region:created'
                ]);

            queueChecked = true;
        });

        queue.once( 'region:created', function() {
            resourceChecked.should.equal( true );
            queueChecked.should.equal( true );

            done();
        });

    });
}

features.title = 'Creating a Region on a Board';

module.exports = features;

},{"chai":21,"rsvp":121}],164:[function(require,module,exports){
var chai = require('chai')
  , should = chai.should();

var storedName = 'new region'
  , storedWall
  , storedBoard
  , storedPocket
  , storedRegion
  , storedLocation
  , resourceChecked = false
  , locationChecked = false
  , queueChecked = false
  , update;



function features() {
    var services = this.application.services
      , scenarios = this.scenarios
      , queue = this.queue;

    before(function(done) {

        scenarios.TwoBoardsOneWithRegions()
            .then(function( storage ) {
                storedWall = storage.wall;
                storedBoard = storage.boards[1];
                storedPocket = storage.pockets[0];
                storedRegion = storage.regions[0];
                storedLocation = storage.locations[2];

                update = {
                    id: storedRegion.getId(),
                    x: 400,
                    y: 0
                };

                queue.clearCalls();

                done();
            });
    });

    it('Emit a <region:move> event passing a data object with a valid region id and coordinates which enclose a Card on the same Board to trigger the process of moving a Region under a Card on a Board\n',
        function( done ) {

            queue.trigger( 'region:move', update );

            queue.once( 'region:updated', function( resource ) {
                should.exist( resource );

                resource.should.respondTo( 'getId' );
                resource.should.respondTo( 'getBoard' );
                resource.getBoard().should.equal( storedBoard.getId() );
                resource.should.respondTo( 'getX' );
                resource.getX().should.equal( update.x );
                resource.should.respondTo( 'getY' );
                resource.getY().should.equal( update.y );

                locationChecked = true;
            });

            queue.once( 'region:updated', function( resource ) {
                resource.getId().should.equal( storedRegion.getId() );
                //resource.getPockets().should.contain( storedPocket.getId() );

                resourceChecked = true;
            });

            queue.once( 'pocket:regionenter', function( info ) {
                info.pocket.getId().should.equal( storedPocket.getId() );
                info.region.getId().should.equal( storedRegion.getId() );

                queue.should.haveLogged([
                        'region:move'
                      , 'region:updated'
                      , 'pocket:updated'
                      , 'pocket:regionenter'
                    ]);

                queueChecked = true;
            });

            queue.once( 'pocket:regionenter', function() {
                resourceChecked.should.equal( true );
                locationChecked.should.equal( true );
                queueChecked.should.equal( true );

                done();
            });

        });

}

features.title = 'Moving a displayed Region under a Card on the displayed Board';

module.exports = features;

},{"chai":21}],165:[function(require,module,exports){
var chai = require('chai')
  , should = chai.should();

var storedName = 'new Region'
  , storedWall
  , storedBoard
  , storedRegion
  , resourceChecked = false
  , locationChecked = false
  , queueChecked = false
  , update;



function features() {
    var services = this.application.services
      , scenarios = this.scenarios
      , queue = this.queue;

    before(function(done) {

        scenarios.TwoBoardsOneWithRegions()
            .then(function( storage ) {
                storedWall = storage.wall;
                storedBoard = storage.boards[1];
                storedRegion = storage.regions[0];

                update = {
                    id: storedRegion.getId(),
                    x: 600,
                    y: 600
                };

                queue.clearCalls();

                done();
            });
    });

    it('Emit a <region:move> event passing a data object with a valid region id and coordinates to trigger the process of moving a Region around a Board\n',
        function( done ) {

            queue.trigger( 'region:move', update );

            queue.once( 'region:updated', function( resource ) {
                should.exist( resource );

                resource.should.respondTo( 'getId' );
                resource.should.respondTo( 'getBoard' );
                resource.getBoard().should.equal( storedBoard.getId() );
                resource.should.respondTo( 'getX' );
                resource.getX().should.equal( update.x );
                resource.should.respondTo( 'getY' );
                resource.getY().should.equal( update.y );

                locationChecked = true;
            });

            queue.once( 'region:updated', function() {
                queue.should.haveLogged([
                        'region:move'
                      , 'region:updated'
                    ]);

                queueChecked = true;
            });

            queue.once( 'region:updated', function() {
                locationChecked.should.equal( true );
                queueChecked.should.equal( true );

                done();
            });

        });

}

features.title = 'Moving a displayed Region into an empty area on the displayed Board';

module.exports = features;

},{"chai":21}],166:[function(require,module,exports){
var chai = require('chai')
  , should = chai.should();

var storedName = 'new wall'
  , resourceChecked = false
  , queueChecked = false;

function features() {
    var services = this.application.services
      , queue = this.queue;

    it('Emit a <wall:create> event passing a data object with a name attribute to trigger the process of creating a new wall\n',
        function( done ) {

            queue.trigger( 'wall:create', { name: storedName } );

            queue.once( 'wall:created', function( resource ) {
                should.exist( resource );

                resource.should.be.a.specificWallResource( storedName );

                resourceChecked = true;
            });

            queue.once( 'boardcreator:displayed', function() {
                queue.should.haveLogged([
                        'wall:create'
                      , 'wall:created'
                      , 'wall:displayed'
                      , 'boardselector:displayed'
                      , 'wall:firsttime'
                      , 'boardcreator:displayed'
                    ]);

                queueChecked = true;
            });

            queue.once( 'boardcreator:displayed', function() {
                resourceChecked.should.equal( true );
                queueChecked.should.equal( true );

                done();
            });

        });

}

features.title = 'Creating a wall';

module.exports = features;

},{"chai":21}],167:[function(require,module,exports){
var chai = require('chai')
  , should = chai.should();

var storedName = 'display wall'
  , storedWall
  , resourceChecked = false
  , queueChecked = false;

function features() {
    var services = this.application.services
      , queue = this.queue;

    before(function(done) {

        queue.once( 'boardcreator:displayed', function() {
            queue.clearCalls();

            done();
        });

        services.createWall({ name: storedName })
            .then(function( wall ) {
                storedWall = wall;
            });
    });

    it('Emit a <wall:display> event with a valid wall id to open the wall\n',
            function(done) {

        queue.trigger( 'wall:display', storedWall.getId() );

        queue.once( 'wall:displayed', function( resource ) {
            should.exist( resource );

            resource.should.be.a.specificWallResource( storedName );

            resourceChecked = true;
        });

        queue.once( 'boardcreator:displayed', function() {
            queue.should.haveLogged([
                    'wall:display'
                  , 'wall:displayed'
                  , 'boardselector:displayed'
                  , 'wall:firsttime'
                  , 'boardcreator:displayed'
                ]);

            queueChecked = true;
        });

        queue.once( 'boardcreator:displayed', function() {
            resourceChecked.should.equal( true );
            queueChecked.should.equal( true );

            done();
        });
    });

}

features.title = 'Displaying a wall';

module.exports = features;

},{"chai":21}],168:[function(require,module,exports){
var chai = require('chai')
  , should = chai.should();

var storedName = 'display wall'
  , storedWall
  , storedBoard
  , wallChecked = false
  , boardChecked = false
  , queueChecked = false;

function features() {
    var services = this.application.services
      , scenarios = this.scenarios
      , queue = this.queue;

    before(function(done) {
        scenarios.TwoBoardsOneWithRegions()
            .then(function( storage ) {
                storedWall = storage.wall;
                storedBoard = storage.boards[0];

                queue.clearCalls();

                done();
            });
    });

    it('If the Wall has any associated Boards then the first board will be selected and displayed\n',
            function(done) {

        queue.trigger( 'wall:display', storedWall.getId() );

        queue.once( 'wall:displayed', function( resource ) {
            should.exist( resource );

            resource.should.be.a.specificWallResource( storedWall.getName() );

            wallChecked = true;
        });

        queue.once( 'board:displayed', function( resource ) {
            should.exist( resource );

            resource.should.be.a.specificBoardResource( storedBoard.getName(), storedWall.getId() );

            boardChecked = true;
        });

        queue.once( 'controls:enabled', function() {
            queue.should.haveLogged([
                    'wall:display'
                  , 'wall:displayed'
                  , 'boardselector:displayed'
                  , 'board:displayed'
                  , 'controls:enabled'
                ]);

            queueChecked = true;
        });

        queue.once( 'controls:enabled', function() {
            wallChecked.should.equal( true );
            boardChecked.should.equal( true );
            queueChecked.should.equal( true );

            done();
        });
    });

}

features.title = 'Displaying a wall with multiple boards containing cards and regions';

module.exports = features;

},{"chai":21}],169:[function(require,module,exports){
var chai = require('chai')
  , should = chai.should();

var resourceChecked = false
  , queueChecked = false
  , storedName = 'display wall'
  , storedWall;

function features() {
    var services = this.application.services
      , queue = this.queue;

    before(function(done) {

        queue.once( 'wall:firsttime', function() {
            queue.clearCalls();

            done();
        });

        services.createWall({ name: storedName })
            .then(function( wall ) {
                storedWall = wall;
            });
    });

    it('Emit a <wall:edit> event with a valid wall id to access an input control allowing you to enter new details for a Wall\n',
            function(done) {

        queue.trigger( 'wall:edit', storedWall.getId() );

        queue.once( 'walleditor:displayed', function() {
            queue.should.haveLogged([
                    'wall:edit'
                  , 'walleditor:displayed'
                ]);

            queueChecked = true;
        });

        queue.once( 'walleditor:displayed', function() {
            queueChecked.should.equal( true );

            done();
        });

    });

}

features.title = 'Accessing the wall editor input control';

module.exports = features;

},{"chai":21}],170:[function(require,module,exports){
var chai = require('chai')
  , should = chai.should();

var resourceChecked = false
  , queueChecked = false;

function features() {
    var services = this.application.services
      , queue = this.queue;

    it('Emit a <wall:new> event - no data object is needed - to access an input control allowing you to enter details required to create a new Wall\n',
        function(done) {

            queue.trigger( 'wall:new' );

            queue.once( 'wallcreator:displayed', function( resource ) {
                should.not.exist( resource );

                resourceChecked = true;
            });

            queue.once( 'wallcreator:displayed', function() {
                queue.should.haveLogged([
                        'wall:new'
                      , 'wallcreator:displayed'
                    ]);

                queueChecked = true;
            });

            queue.once( 'wallcreator:displayed', function() {
                resourceChecked.should.equal( true );
                queueChecked.should.equal( true );

                done();
            });

        });

}

features.title = 'Accessing the wall creator input control';

module.exports = features;

},{"chai":21}],171:[function(require,module,exports){
var chai = require('chai')
  , should = chai.should();

var resourceChecked = false
  , queueChecked = false
  , storedName = 'display wall'
  , storedWall;

function features() {
    var services = this.application.services
      , queue = this.queue;

    before(function(done) {

        queue.once( 'wall:firsttime', function() {
            queue.clearCalls();

            done();
        });

        services.createWall({ name: storedName })
            .then(function( wall ) {
                storedWall = wall;
            });
    });

    it('Emit a <wall:select> event - no data object is needed - to access an input control allowing you to select a Wall for display\n',
            function(done) {

        queue.trigger( 'wall:select' );

        queue.once( 'wallselector:displayed', function() {
            queue.should.haveLogged([
                    'wall:select'
                  , 'wallselector:displayed'
                ]);

            queueChecked = true;
        });

        queue.once( 'wallselector:displayed', function() {
            queueChecked.should.equal( true );

            done();
        });

    });

}

features.title = 'Selecting a Wall';

module.exports = features;

},{"chai":21}],172:[function(require,module,exports){
var chai = require('chai')
  , should = chai.should();

var queueChecked = false;

function features() {
    var services = this.application.services
      , scenarios = this.scenarios
      , queue = this.queue;

    before(function(done) {

        scenarios.multipleWalls()
            .then(function() {
                queue.clearCalls();

                done();
            });
    });

    it('If there are several walls configured then the Wall Selector input control will display all available walls\n',
            function(done) {

        queue.trigger( 'wall:select' );

        queue.once( 'wallselector:displayed', function() {
            queue.should.haveLogged([
                    'wall:select'
                  , 'wallselector:displayed'
                ]);

            queueChecked = true;
        });

        queue.once( 'wallselector:displayed', function() {
            queueChecked.should.equal( true );

            done();
        });

    });

}

features.title = 'Selecting a Wall from multiple';

module.exports = features;

},{"chai":21}],173:[function(require,module,exports){
var chai = require('chai')
  , should = chai.should();

var resourceChecked = false
  , queueChecked = false
  , storedName = 'unedited wall'
  , editedName = 'edited wall'
  , storedWall;

function features() {
    var services = this.application.services
      , queue = this.queue;

    before(function(done) {

        queue.once( 'boardcreator:displayed', function() {
            queue.clearCalls();

            done();
        });

        services.createWall({ name: storedName })
            .then(function( wall ) {
                storedWall = wall;
            });
    });

    it('Emit a <wall:update> event passing an updated data object with a valid wall id trigger the process of updating the stored data for an existing wall\n',
            function(done) {

        var update = {
            id: storedWall.getId(),
            name: editedName
        };

        queue.trigger( 'wall:update', update );

        queue.once( 'wall:updated', function( resource ) {
            should.exist( resource );

            resource.should.be.a.specificWallResource( editedName );
            resource.getId().should.equal( storedWall.getId() );

            resourceChecked = true;
        });

        queue.once( 'wall:updated', function() {
            queue.should.haveLogged([
                    'wall:update'
                  , 'wall:updated'
                ]);

            queueChecked = true;
        });

        queue.once( 'wall:updated', function() {
            resourceChecked.should.equal( true );
            queueChecked.should.equal( true );

            done();
        });
    });

}

features.title = 'Updating a wall';

module.exports = features;

},{"chai":21}],174:[function(require,module,exports){
(function (process){
var should = require('chai').should()
  , RSVP = require('rsvp')
  , Promise = RSVP.Promise
  , Belt = require('belt')
  , Queue = require('../lib/queue')
  , Commands = require('../lib/commands')
  , Queries = require('../lib/queries')
  , Interface = require('../lib/interface')
  , Services = require('../lib/services')
  , Wall = require('../lib/models/wall')
  , Board = require('../lib/models/board')
  , Region = require('../lib/models/region')
  , Pocket = require('../lib/models/pocket')
  , CardLocation = require('../lib/models/cardlocation');

describe.skip('using an adapter', function() {
    var ids = {}
      , opts = {};

    if ( !process.browser ) {
        opts.db = require('memdown');
    }

    var belt = new Belt( 'belt_pocket_management_test', opts);
    var queue = new Queue();
    var interface = new Interface( queue );
    var commands = new Commands( belt );
    var queries = new Queries( belt );

    var services = new Services( interface, commands, queries );

    var wall, pocket;
    before(function (done) {
        belt.resource( 'wall', Wall.constructor )
            .schema( Wall.schema )
            .validator( Wall.validator )
            .beforeCreate( Wall.onBeforeCreate )
            .beforeUpdate( Wall.onBeforeUpdate );

        belt.schema( 'board', Board.schema )
            .resource( Board.constructor )
            .validator( Board.validator )
            .beforeCreate( Board.onBeforeCreate )
            .beforeUpdate( Board.onBeforeUpdate );

        belt.resource( 'region', Region.constructor )
            .schema( Region.schema )
            .validator( Region.validator )
            .beforeCreate( Region.onBeforeCreate )
            .beforeUpdate( Region.onBeforeUpdate );

        belt.resource( 'pocket', Pocket.constructor )
            .schema( Pocket.schema )
            .validator( Pocket.validator )
            .beforeCreate( Pocket.onBeforeCreate )
            .beforeUpdate( Pocket.onBeforeUpdate );

        belt.resource( 'cardlocation', CardLocation.constructor )
            .schema( CardLocation.schema )
            .validator( CardLocation.validator )
            .beforeCreate( CardLocation.onBeforeCreate )
            .beforeUpdate( CardLocation.onBeforeUpdate );

        services
            .createWall( { name: 'test wall' } )
            .then(function( resource ) {
                wall = resource;

                return services.createPocket( { wall: wall.getId(), title: 'test pocket' } );
            })
            .then(function( resource ) {
                pocket = resource;

                done();
            })
            .catch( done );
    });

    describe('adding pockets', function() {

        it('adding a pocket to a wall', function( done ) {

            services
                .createPocket( { wall: wall.getId(), title: 'test pocket' } )
                .then(function( resource ) {
                    should.exist( resource );

                    resource.should.be.instanceOf( Pocket );

                    resource.getWall().should.be.equal( wall.getId() );

                    done();
                })
                .catch( done );
        });

    });

    describe('opening pockets for editing', function() {

        it('retreiving all data for displaying a pocket editor', function( done ) {
            var storedId = pocket.getId(), storedTitle = pocket.getTitle();

            services
                .editPocket( pocket.getId() )
                .then(function( pocket ) {
                    pocket.getId().should.be.equal( storedId );
                    pocket.getTitle().should.be.equal( storedTitle );

                    done();
                })
                .catch( done );
        });

    });

    describe('modifying pocket data', function() {

        it('updating one pocket', function( done ) {
            var update = {
                id: pocket.getId()
              , title: 'test pocket modified'
              , wall: pocket.getWall()
            };

            services
                .updatePocket( update )
                .then(function( resource ) {
                    should.exist( resource );

                    resource.should.be.instanceOf( Pocket );

                    resource.getTitle().should.be.equal( 'test pocket modified' );

                    done();
                })
                .catch( done );
        });

    });

    afterEach(function (done) {
        queue.clearAll();

        belt.findMany( 'pocket' )
            .then(function( resources ) {
                var promises = [];

                resources.forEach(function( resource ) {
                    if ( resource.getId() !== pocket.getId() ) {
                        promises.push( belt.delete( 'pocket', resource.getId() ) );
                    }
                });

                return RSVP.all( promises );
            })
            .then(function() {
                done();
            })
            .catch( done );
    });

    after(function (done) {

        var removeWalls = belt.findMany( 'wall' )
            .then(function( resources ) {
                var promises = resources.map(function( resource ) {
                    return belt.delete( 'wall', resource.getId() );
                });

                return RSVP.all( promises );
            });

        var removePocket = belt.delete( 'pocket', pocket.getId() );

        RSVP.all( [ removeWalls, removePocket ] )
            .then(function() {
                done();
            })
            .catch( done );
    });

});

}).call(this,require("JkpR2F"))
},{"../lib/commands":2,"../lib/interface":3,"../lib/models/board":4,"../lib/models/cardlocation":5,"../lib/models/pocket":6,"../lib/models/region":7,"../lib/models/wall":9,"../lib/queries":10,"../lib/queue":13,"../lib/services":14,"JkpR2F":59,"belt":18,"chai":21,"memdown":62,"rsvp":121}],175:[function(require,module,exports){
(function (process){
var should = require('chai').should()
  , RSVP = require('rsvp')
  , Promise = RSVP.Promise
  , Belt = require('belt')
  , Queue = require('../lib/queue')
  , Commands = require('../lib/commands')
  , Queries = require('../lib/queries')
  , Interface = require('../lib/interface')
  , Services = require('../lib/services')
  , Wall = require('../lib/models/wall')
  , Board = require('../lib/models/board')
  , Region = require('../lib/models/region')
  , Pocket = require('../lib/models/pocket')
  , CardLocation = require('../lib/models/cardlocation');

describe.skip('using an adapter', function() {
    var ids = {}
      , opts = {};

    if ( !process.browser ) {
        opts.db = require('memdown');
    }

    var belt = new Belt( 'belt_region_management_test', opts);
    var queue = new Queue();
    var interface = new Interface( queue );
    var commands = new Commands( belt );
    var queries = new Queries( belt );

    var services = new Services( interface, commands, queries );

    var wall, board, region;
    before(function (done) {
        belt.resource( 'wall', Wall.constructor )
            .schema( Wall.schema )
            .validator( Wall.validator )
            .beforeCreate( Wall.onBeforeCreate )
            .beforeUpdate( Wall.onBeforeUpdate );

        belt.schema( 'board', Board.schema )
            .resource( Board.constructor )
            .validator( Board.validator )
            .beforeCreate( Board.onBeforeCreate )
            .beforeUpdate( Board.onBeforeUpdate );

        belt.resource( 'region', Region.constructor )
            .schema( Region.schema )
            .validator( Region.validator )
            .beforeCreate( Region.onBeforeCreate )
            .beforeUpdate( Region.onBeforeUpdate );

        belt.resource( 'pocket', Pocket.constructor )
            .schema( Pocket.schema )
            .validator( Pocket.validator )
            .beforeCreate( Pocket.onBeforeCreate )
            .beforeUpdate( Pocket.onBeforeUpdate );

        belt.resource( 'cardlocation', CardLocation.constructor )
            .schema( CardLocation.schema )
            .validator( CardLocation.validator )
            .beforeCreate( CardLocation.onBeforeCreate )
            .beforeUpdate( CardLocation.onBeforeUpdate );

        services
            .createWall( { name: 'test wall' } )
            .then(function( resource ) {
                wall = resource;

                return services.createBoard( { wall: wall.getId(), name: 'test board' } );
            })
            .then(function( resource ) {
                board = resource;

                return services.createRegion( { board: board.getId(), label: 'test region', value: 'test value' } );
            })
            .then(function( resource ) {

                region = resource;

                done();
            })
            .catch( done );
    });

    describe('adding regions', function() {

        it('adding a region to a board', function( done ) {

            belt
                .on('region:created', function( resource ) {
                    should.exist( resource );

                    resource.should.be.instanceOf( Region );

                    resource.getBoard().should.be.equal( board.getId() );

                    done();
                });

            services
                .createRegion( { board: board.getId(), label: 'test region', value: 'test value' } )
                .then(function( resource ) {
                    should.exist( resource );

                    resource.should.be.instanceOf( Region );

                    resource.getBoard().should.be.equal( board.getId() );
                })
                .catch( done );
        });

    });

    describe('opening regions for editing', function() {

        it('retreiving all data for displaying a region editor', function( done ) {
            var storedId = region.getId(), storedLabel = region.getLabel(), storedValue = region.getValue();

            queue
                .on('regioneditor:displayed', function( region ) {

                    region.getId().should.be.equal( storedId );
                    region.getLabel().should.be.equal( storedLabel );
                    region.getValue().should.be.equal( storedValue );

                    done();
                });

            services
                .editRegion( region.getId() )
                .then(function( data ) {
                    data.getId().should.be.equal( storedId );
                    data.getLabel().should.be.equal( storedLabel );
                    data.getValue().should.be.equal( storedValue );
                })
                .catch( done );
        });

    });

    describe('modifying region data', function() {

        it('updating one region', function( done ) {
            var update = {
                id: region.getId()
              , label: 'test region modified'
              , board: region.getBoard()
            };

            belt
                .on('region:updated', function( resource ) {
                    should.exist( resource );

                    resource.should.be.instanceOf( Region );

                    resource.getLabel().should.be.equal( 'test region modified' );

                    done();
                });

            services
                .updateRegion( update )
                .then(function( resource ) {
                    should.exist( resource );

                    resource.should.be.instanceOf( Region );

                    resource.getLabel().should.be.equal( 'test region modified' );
                })
                .catch( done );
        });

    });

    afterEach(function (done) {
        queue.clearAll();

        belt.findMany( 'region' )
            .then(function( resources ) {
                var promises = [];

                resources.forEach(function( resource ) {
                    if ( resource.getId() !== region.getId() ) {
                        promises.push( belt.delete( 'region', resource.getId() ) );
                    }
                });

                return RSVP.all( promises );
            })
            .then(function() {
                done();
            })
            .catch( done );
    });

    after(function (done) {

        var promises = [];

        var removeWalls = belt.findMany( 'wall' )
            .then(function( resources ) {
                if (!resources.length) return;

                var promises = resources.map(function( resource ) {
                    return belt.delete( 'wall', resource.getId() );
                });

                return RSVP.all( promises );
            });
        promises.push( removeWalls );

        var removeBoards = belt.findMany( 'board' )
            .then(function( resources ) {
                if (!resources.length) return;

                var promises = [];

                resources.forEach(function( resource ) {
                    if ( resource.getId() !== board.getId() ) {
                        promises.push( belt.delete( 'board', resource.getId() ) );
                    }
                });

                return RSVP.all( promises );
            });
        promises.push( removeBoards );

        if (region) {
            var removeRegion = belt.delete( 'region', region.getId() );

            promises.push( removeRegion );
        }

        RSVP.all( promises )
            .then(function() {
                done();
            })
            .catch( done );
    });

});

}).call(this,require("JkpR2F"))
},{"../lib/commands":2,"../lib/interface":3,"../lib/models/board":4,"../lib/models/cardlocation":5,"../lib/models/pocket":6,"../lib/models/region":7,"../lib/models/wall":9,"../lib/queries":10,"../lib/queue":13,"../lib/services":14,"JkpR2F":59,"belt":18,"chai":21,"memdown":62,"rsvp":121}],176:[function(require,module,exports){
(function (process){
var should = require('chai').should()
  , RSVP = require('rsvp')
  , Promise = RSVP.Promise
  , Belt = require('belt')
  , Queue = require('../lib/queue')
  , Commands = require('../lib/commands')
  , Queries = require('../lib/queries')
  , Interface = require('../lib/interface')
  , Services = require('../lib/services')
  , Wall = require('../lib/models/wall');

describe.skip('using an adapter', function() {
    var ids = {}
      , opts = {};

    if ( !process.browser ) {
        opts.db = require('memdown');
    }

    var belt = new Belt( 'belt_wall_management_test', opts);
    var queue = new Queue();
    var interface = new Interface( queue );
    var commands = new Commands( belt );
    var queries = new Queries( belt );

    var services = new Services( interface, commands, queries );

    var wall;
    before(function (done) {
        belt.resource( 'wall', Wall.constructor )
            .schema( Wall.schema )
            .validator( Wall.validator )
            .beforeCreate( Wall.onBeforeCreate )
            .beforeUpdate( Wall.onBeforeUpdate );

        services.createWall( { name: 'test wall' } )
            .then(function( resource ) {
                wall = resource;
            })
            .then(function() {
                done();
            })
            .catch( done );
    });

    describe('adding walls', function() {

        it('adding one wall', function( done ) {
            services
                .createWall( { name: 'test wall' } )
                .then(function( resource ) {
                    should.exist( resource );

                    resource.should.be.instanceOf( Wall );

                    done();
                })
                .catch( done );
        });

    });

    describe('listing walls', function() {

        before(function (done) {
            var firstWall = services.createWall( { name: 'test wall three' } );
            var secondWall = services.createWall( { name: 'test wall two' } );

            RSVP.all( [ firstWall, secondWall ] )
                .then(function() {
                    done();
                })
                .catch( done );
        });

        it('listing all walls for display in selector', function( done ) {

            queue
                .on( 'wallselector:displayed', function( walls ) {
                    walls.forEach(function( resource ) {
                        resource.should.be.instanceOf( Wall );
                    });

                    done();
                });

            services
                .selectWall( { preventDefault: function(){} } )
                .catch( done );
        });

    });

    describe('displaying walls', function() {

        it('blank wall', function( done ) {
            var storedId = wall.getId(), storedName = wall.getName(), displayCalled = false;

            queue
                .on( 'wall:displayed', function( wall ) {
                    displayCalled.should.not.be.equal( true );
                    displayCalled = true;

                    wall.getId().should.be.equal( storedId );
                    wall.getName().should.be.equal( storedName );
                });

            queue
                .on( 'wall:firsttime', function( wall ) {
                    displayCalled.should.be.equal( true );

                    wall.getId().should.be.equal( storedId );
                    wall.getName().should.be.equal( storedName );

                    done();
                });

            services
                .displayWall( wall.getId() )
                .catch( done );
        });

    });

    describe('opening walls for editing', function() {

        it('retreiving all data for displaying a wall editor', function( done ) {
            var storedId = wall.getId(), storedName = wall.getName();

            queue
                .on( 'wallselector:displayed', function( walls ) {
                    walls.length.should.be.equal( 1 );

                    var wall = walls[0];

                    wall.getId().should.be.equal( storedId );
                    wall.getName().should.be.equal( storedName );

                    done();
                });

            services
                .selectWall( { 'data-target': wall.getId() } )
                .catch( done );
        });

    });

    describe('modifying wall data', function() {

        it('updating one wall', function( done ) {
            var update = {
                id: wall.getId()
              , name: 'test wall modified'
            };

            services
                .updateWall( update )
                .then(function( resource ) {
                    should.exist( resource );

                    resource.should.be.instanceOf( Wall );

                    resource.getName().should.be.equal( 'test wall modified' );

                    done();
                })
                .catch( done );
        });

    });

    afterEach(function (done) {
        queue.clearAll();

        belt.findMany( 'wall' )
            .then(function( resources ) {
                var promises = [];

                resources.forEach(function( resource ) {
                    if ( resource.getId() !== wall.getId() ) {
                        promises.push( belt.delete( 'wall', resource.getId() ) );
                    }
                });

                return RSVP.all( promises );
            })
            .then(function() {
                done();
            })
            .catch( done );
    });

    after(function (done) {
        belt.delete( 'wall', wall.getId() )
            .then(function() {
                done();
            })
            .catch( done );
    });

});

}).call(this,require("JkpR2F"))
},{"../lib/commands":2,"../lib/interface":3,"../lib/models/wall":9,"../lib/queries":10,"../lib/queue":13,"../lib/services":14,"JkpR2F":59,"belt":18,"chai":21,"memdown":62,"rsvp":121}]},{},[148,149,150,174,175,176]);