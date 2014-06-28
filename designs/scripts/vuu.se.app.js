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

    function UI( repositories ) {
        this.socket = io.connect();
        this.queue = new EventQueue({ debug: false });
        this.element = $('#app');
        this.footer = this.element.find('footer');
        this.viewer = this.element.find('#viewer')
        this.walllist = $('#wallList');
        this.controls = $('#app .api-controls .control');

        this.hypermedia = repositories;

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
        instance.size = calculateHeight( $(window), instance.element, instance.footer );

        setInterval( function() {
            var newSize = calculateHeight( $(window), instance.element, instance.footer);

            if ( newSize.width !== instance.resize.width ||
                    newSize.height !== instance.resize.height ) {
              instance.size = newSize;

              instance.resize();
            }

        }, 10);

    };

    UI.prototype = {

        constructor: UI,

        // user interface

        resize: function() {
            var instance = this;

            instance.viewer.css( 'height', instance.size.height );

            $.each( this.hypermedia.canvasboards, function () {
                this.setWidth( instance.size.width );
                this.setHeight( instance.size.height );
            });
        },

        // boards

        addBoard: function( data ) {
            if ( this.hypermedia.boards[ data.id ] ) {
                return false;
            }

            var board = this.hypermedia.boards[ data.id ] = new Board( data );

            var tabcontent = $('#' + board.getWall() + ' .tab-content');
            var tabs = $('#' + board.getWall() + ' .nav-tabs');

            tabcontent.append( '<div class="tab-pane" id="'+ board.getId() +'"></div>' );

            $( '<li><a href="#'+ board.getId() +'" data-toggle="tab">' + board.getName() + '</a></li>' )
                .insertBefore( tabs.children().last() )
                .find('> a')
                .tab('show');

            var wall = this.getWallById( board.getWall() );

            if ( wall.addBoard( board ) ) {
                app.queue.trigger( app, 'board:added', board );
            } else {
                app.queue.trigger( app, 'board:cloned', board );
            }

            return true;
        },

        updateBoard: function( board ) {
            if ( !this.hypermedia.boards[ board.id ] ) {
                return false;
            }

            this.hypermedia.boards[board.id] = new Board( board );

            // update the tab text

            return true;
        },

        getBoardById: function( id ) {
            return this.hypermedia.boards[ id ];
        },

        // canvasboards

        registerCanvasBoard: function( canvasboard ) {
            if ( this.hypermedia.canvasboards[ canvasboard.id() ] ) {
                return false;
            }

            this.hypermedia.canvasboards[ canvasboard.id() ] = canvasboard;

            this.activateBoardById( canvasboard.id() );

            return true;
        },

        getCanvasBoardById: function( id ) {
            return this.hypermedia.canvasboards[ id ];
        },

        // cards

        addCard: function( card ) {
            if ( this.hypermedia.cards[ card.id ] ) {
                return false;
            }

            this.hypermedia.cards[card.id] = new Card( card, app.queue );

            return true;
        },

        updateCard: function( card ) {
            if ( !this.hypermedia.cards[ card.id ] ) {
                return false;
            }

            this.hypermedia.cards[card.id] = new Card( card, app.queue );

            return true;
        },

        getCardById: function( id ) {
            return this.hypermedia.cards[ id ];
        },

        // pockets

        addPocket: function( pocket ) {
            if ( this.hypermedia.pockets[ pocket.id ] ) {
                return false;
            }

            this.hypermedia.pockets[pocket.id] = new Pocket( pocket );

            return true;
        },

        updatePocket: function( pocket ) {
            if ( !this.hypermedia.pockets[ pocket.id ] ) {
                return false;
            }

            this.hypermedia.pockets[pocket.id] = new Pocket( pocket );

            return true;
        },

        getPocketById: function( id ) {
            return this.hypermedia.pockets[ id ];
        },

        // regions

        addRegion: function( region ) {
            if ( this.hypermedia.regions[ region.id ] ) {
                return false;
            }

            this.hypermedia.regions[region.id] = new Region( region, app.queue );

            return true;
        },

        updateRegion: function( region ) {
            if ( !this.hypermedia.regions[ region.id ] ) {
                return false;
            }

            this.hypermedia.regions[region.id] = new Region( region, app.queue );

            return true;
        },

        getRegionById: function( id ) {
            return this.hypermedia.regions[ id ];
        },

        // walls

        activateBoardById: function( boardid ) {
            var wall = this.activewall
              , previous = this.getBoardById( wall.getActiveBoard() )
              , next = this.getBoardById( boardid );

            if ( next ) {
                if ( previous ) {
                    app.queue.trigger( app, 'board:deactivated', previous );
                }

                app.queue.trigger( app, 'board:activated', next );
            }
        }

        addWall: function( data ) {
            if ( this.hypermedia.walls[ data.id ] ) {
                return false;
            }

            var wall = this.hypermedia.walls[ data.id ] = new Wall( data );

            var option = $('<a href="#" class="list-group-item">'+ ( wall.name || wall.id ) +'</a>').data( 'target', wall.id );
            this.walllist.append( option );

            var panel = $('<div class="wall hidden" id="'+ wall.id +'"> \
                    <ul class="nav nav-tabs"> \
                        <li><button type="button" class="btn btn-default add-board" title="Add Board"> \
                            <i class="glyphicon glyphicon-plus"></i></button></li> \
                    </ul> \
                    <div class="tab-content"></div> \
                </div>')

            this.viewer.prepend( panel );

            this.queue.trigger( this, 'wall:cloned', wall );

            return true;
        },

        updateWall: function( data ) {
            if ( !this.hypermedia.walls[ data.id ] ) {
                return false;
            }

            this.hypermedia.walls[ data.id ] = new Wall( data );

            return true;
        },

        selectWall: function ( wall ) {
            $('#app .wall').addClass('hidden');
            $('#' + wall.getId() + '.wall').removeClass('hidden');

            if ( wall.boards && wall.boards.length > 0 ) {
                app.queue.trigger( app, 'wall:opened', wall );
            } else {
                app.queue.trigger( app, 'wall:firsttime', wall );
            }
        },

        getWallById: function( id ) {
            return this.hypermedia.walls[ id ];
        },

        // controls

        enableControls: function( data ) {
            this.controls.removeAttr( 'disabled' );

            app.queue.trigger( app, 'controls:enabled', app );
        }

    };

    var hypermedia = {
        boards: {},
        canvasboards: {},
        cards: {},
        canvascards: {},
        pockets: {},
        regions: {},
        canvasregions: {},
        walls: {}
    }

    var app = new UI( hypermedia );

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
      'controls/vuu.se.controls.deletetransform',
      'controls/vuu.se.controls.displayboard',
      'controls/vuu.se.controls.displaywall',
      'controls/vuu.se.controls.enable'
    ].forEach(function( plugin ) {
        require([ plugin ], function( command ) { command.initialize( app ); });
    });

    return app;

});
