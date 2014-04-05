require.config({
    baseUrl: 'scripts',

    shim: {
        "bootstrap": { deps: [ "jquery" ] }
    },

    paths: {
        jquery: 'vendor/jquery-2.1.0'
      , bootstrap: 'vendor/bootstrap.min'
      , kinetic: 'vendor/kinetic-v4.6.0.min'
      , socketio: '/socket.io/socket.io'
      , eventqueue: 'vuu.se.eventqueue'
    }
});

define([

      'jquery',
      'bootstrap',
      'socketio',
      'eventqueue',

      'models/vuu.se.board',
      'models/vuu.se.card',
      'models/vuu.se.pocket',
      'models/vuu.se.region',
      'models/vuu.se.wall'

], function( $, bs, io, EventQueue, Board, Card, Pocket, Region, Wall ) {

    function Application() {
        this.size = {
            width: this.tabcontent.outerWidth(),
            height: this.tabcontent.outerHeight()
        };
    };

    Application.prototype = {
        socket: io.connect('//:5000'),
        queue: new EventQueue({ debug: true }),
        element: $('#app'),
        walllist: $('#wallList'),
        tabs: $('#app .nav-tabs'),
        tabcontent: $('#app .tab-content'),
        controls: $('#app .add-pocket, #app .add-region'),

        boards: {},

        addBoard: function( board ) {
            if ( this.boards[ board.id ] ) {
                return false;
            }

            this.boards[board.id] = new Board( board );

            return true;
        },

        updateBoard: function( board ) {
            if ( !this.boards[ board.id ] ) {
                return false;
            }

            this.boards[board.id] = new Board( board );

            return true;
        },

        getBoardById: function( id ) {
            return this.boards[ id ];
        },

        cards: {},

        addCard: function( card ) {
            if ( this.cards[ card.id ] ) {
                return false;
            }

            this.cards[card.id] = new Card( card, app.queue );

            return true;
        },

        updateCard: function( card ) {
            if ( !this.cards[ card.id ] ) {
                return false;
            }

            this.cards[card.id] = new Card( card, app.queue );

            return true;
        },

        getCardById: function( id ) {
            return this.cards[ id ];
        },

        pockets: {},

        addPocket: function( pocket ) {
            if ( this.pockets[ pocket.id ] ) {
                return false;
            }

            this.pockets[pocket.id] = new Pocket( pocket );

            return true;
        },

        updatePocket: function( pocket ) {
            if ( !this.pockets[ pocket.id ] ) {
                return false;
            }

            this.pockets[pocket.id] = new Pocket( pocket );

            return true;
        },

        getPocketById: function( id ) {
            return this.pockets[ id ];
        },

        regions: {},

        addRegion: function( region ) {
            if ( this.regions[ region.id ] ) {
                return false;
            }

            this.regions[region.id] = new Region( region, app.queue );

            return true;
        },

        updateRegion: function( region ) {
            if ( !this.regions[ region.id ] ) {
                return false;
            }

            this.regions[region.id] = new Region( region, app.queue );

            return true;
        },

        getRegionById: function( id ) {
            return this.regions[ id ];
        },

        walls: {},

        addWall: function( data ) {
            if ( this.walls[ data.id ] ) {
                return false;
            }

            this.walls[ data.id ] = new Wall( data );

            var option = $('<a href="#" class="list-group-item">'+ ( data.name || data.id ) +'</a>').data( 'target', data.id );
            app.walllist.append( option );

            return true;
        },

        updateWall: function( data ) {
            if ( !this.walls[ data.id ] ) {
                return false;
            }

            this.walls[ data.id ] = new Wall( data );

            return true;
        },

        getWallById: function( id ) {
            return this.walls[ id ];
        },

        enableControls: function( data ) {
            this.controls.removeAttr( 'disabled' );
        }

    };

    var app = new Application();

    // triggers

    app.socket.on('connect', function() {
        console.log( 'You are connected to the server' );
    });


    app.socket.on('disconnect', function() {
        console.log( 'You seem to have been disconected from the server.' );
    });

    app.socket.on( 'app:init', function( resources ) {
        $.each(resources, function() {
            app.addWall( this );
        });

        app.queue.trigger( app, 'app:initend', app );
    });

    // pocket:tagged
    app.queue.on( app, 'card:tagged', function( data ) {
        app.socket.emit( 'card:tagged', data ); // should be put to server
    });

    // pocket:untagged
    app.queue.on( app, 'card:untagged', function( data ) {
        app.socket.emit( 'card:untagged', data ); // should be put to server
    });

    // load plugins

    [
      'vuu.se.monitor',

      'commands/vuu.se.board.cloned',
      'commands/vuu.se.board.created',
      'commands/vuu.se.canvasboard.created',
      'commands/vuu.se.canvasboard.opened',
      'commands/vuu.se.canvascard.moved',
      'commands/vuu.se.canvascard.opened',
      'commands/vuu.se.canvasregion.moved',
      'commands/vuu.se.canvasregion.opened',
      'commands/vuu.se.canvasregion.resized',
      'commands/vuu.se.card.created',
      'commands/vuu.se.pocket.added',
      'commands/vuu.se.pocket.created',
      'commands/vuu.se.pocket.updated',
      'commands/vuu.se.region.clone',
      'commands/vuu.se.region.update',
      'commands/vuu.se.wall.opened',
      'commands/vuu.se.wall.selected',

      'controls/vuu.se.controls.addboard',
      'controls/vuu.se.controls.addpocket',
      'controls/vuu.se.controls.addregion',
      'controls/vuu.se.controls.displayboard',
      'controls/vuu.se.controls.displaywall',
      'controls/vuu.se.controls.enable',
      'controls/vuu.se.controls.tab.create'
    ].forEach(function( plugin ){
        require([ plugin ], function( command ) { command.initialize( app ); });
    });

    return app;

});
