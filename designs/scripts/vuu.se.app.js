require.config({
    baseUrl: 'scripts',

    shim: {
        "bootstrap": { deps: [ "jquery" ] }
    },

    paths: {
        jquery: 'vendor/jquery-2.1.0'
      , bootstrap: 'vendor/bootstrap.min'
      , kinetic: 'vendor/kinetic-v5.1.0.min'
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

    function calculateHeight( $window, $container, $footer ) {
        return {
            height: $window.innerHeight() - $footer.innerHeight() - $container.position().top
          , width: $container.innerWidth()
        };
    }

    function UI() {
        this.socket = io.connect();
        this.queue = new EventQueue({ debug: false });
        this.element = $('#app');
        this.footer = this.element.find('footer');
        this.viewer = this.element.find('#viewer')
        this.walllist = $('#wallList');
        this.controls = $('#app .api-controls .control');

        this.size = calculateHeight( $(window), this.element, this.footer );

        this.boards = {};
        this.canvasboards = {};
        this.cards = {};
        this.canvascards = {};
        this.pockets = {};
        this.regions = {};
        this.canvasregions = {};
        this.walls = {};

        this.constructor = UI;

        if (this.element.find('[data-auth="login"]').length > 0) {
            var auth = this.auth = new Auth0Widget({
                  domain: 'vuu-se.auth0.com',
                  clientID: 'X0n9ZaXJrJgeP9V4KAI7LXsiMsn6jN4G',
                  callbackURL: 'http://localhost:5000/callback'
                });

            this.element
                .on('click', '[data-auth="login"]', function() {
                    auth.signin();
                });
        }

        var instance = this;

        setInterval( function() {
            instance.size = calculateHeight( $(window), instance.element, instance.footer);

            instance.resize();
        }, 10);

    };

    UI.prototype = {

        constructor: UI,

        resize: function() {
            this.viewer.css( 'height', this.size.height );

            var instance = this;

            $.each( this.canvasboards, function () {
                this.setWidth( instance.size.width );
                this.setHeight( instance.size.height );
            });
        },

        addBoard: function( board ) {
            if ( this.boards[ board.id ] ) {
                return false;
            }

            board = this.boards[board.id] = new Board( board );

            var tabcontent = $('#' + board.getWall() + ' .tab-content');
            var tabs = $('#' + board.getWall() + ' .nav-tabs');

            tabcontent.append( '<div class="tab-pane" id="'+ board.getId() +'"></div>' );

            $( '<li><a href="#'+ board.getId() +'" data-toggle="tab">' + board.getKey() + '</a></li>' )
                .insertBefore( tabs.children().last() )
                .find('> a')
                .tab('show');

            return true;
        },

        updateBoard: function( board ) {
            if ( !this.boards[ board.id ] ) {
                return false;
            }

            this.boards[board.id] = new Board( board );

            // update the tab text

            return true;
        },

        getBoardById: function( id ) {
            return this.boards[ id ];
        },

        registerCanvasBoard: function( canvasboard ) {
            if ( this.canvasboards[ canvasboard.id() ] ) {
                return false;
            }

            this.canvasboards[ canvasboard.id() ] = canvasboard;

            return true;
        },

        getCanvasBoardById: function( id ) {
            return this.canvasboards[ id ];
        },

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

        addWall: function( data ) {
            if ( this.walls[ data.id ] ) {
                return false;
            }

            this.walls[ data.id ] = new Wall( data );

            var option = $('<a href="#" class="list-group-item">'+ ( data.name || data.id ) +'</a>').data( 'target', data.id );
            this.walllist.append( option );

            var panel = $('<div class="wall hidden" id="'+ data.id +'"> \
                    <ul class="nav nav-tabs"> \
                        <li><button type="button" class="btn btn-default add-board" title="Add Board"> \
                            <i class="glyphicon glyphicon-plus"></i></button></li> \
                    </ul> \
                    <div class="tab-content"></div> \
                </div>')

            this.viewer.prepend( panel );

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

            app.queue.trigger( app, 'controls:enabled', app );
        }

    };

    var app = new UI();

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
      'commands/vuu.se.wall.created',
      'commands/vuu.se.wall.opened',
      'commands/vuu.se.wall.selected',

      'controls/vuu.se.controls.addboard',
      'controls/vuu.se.controls.addpocket',
      'controls/vuu.se.controls.addregion',
      'controls/vuu.se.controls.addwall',
      'controls/vuu.se.controls.displayboard',
      'controls/vuu.se.controls.displaywall',
      'controls/vuu.se.controls.enable'
    ].forEach(function( plugin ){
        require([ plugin ], function( command ) { command.initialize( app ); });
    });

    return app;

});
