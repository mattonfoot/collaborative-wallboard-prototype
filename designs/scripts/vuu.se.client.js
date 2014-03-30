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

define([ 'jquery', 'bootstrap', 'socketio', 'eventqueue' ], function( $, bs, io, EventQueue ) {

    var app = {

        socket: io.connect('http://localhost:5000'),

        queue: new EventQueue({ debug: true }),

        element: $('#app'),

        wall: {},

        walls: [],

        initialize: function( resources ) {
            this.size = {
                width: this.element.find('.tab-content').outerWidth(),
                height: this.element.find('.tab-content').outerHeight()
            };

            var walllist = [];
            $.each(resources, function() {
                var data = this
                  , newResource = true;

                app.walls.forEach(function(wall) {
                    if (data.id === wall.id) {
                        newResource = false;
                    }
                });

                if (newResource) {
                    app.walls.push( data );

                    var wallLink = $('<a href="#" class="list-group-item">'+ (data.name || data.id) +'</a>').data( 'wall', data );

                    walllist.push( wallLink );
                }
            });

            $('#wallList').append( walllist );

            this.queue.trigger( this, 'app:initend', { app: this } );
        }
    };

    // triggers

    app.socket.on('connect', function() {
        console.log( 'You are connected to the server' );
    });


    app.socket.on('disconnect', function() {
        console.log( 'You seem to have been disconected from the server.' );
    });

    app.socket.on( 'app:init', function( resources ) {
        app.initialize( resources );
    });

    // pocket:tagged
    app.queue.on( app, 'card:tagged', function( data ) {
        app.socket.emit( 'card:tagged', data ); // should be put to server
    });

    // pocket:untagged
    app.queue.on( app, 'card:untagged', function( data ) {
        app.socket.emit( 'card:untagged', data ); // should be put to server
    });

    [
      'vuu.se.monitor',

      'commands/vuu.se.board.created',
      'commands/vuu.se.canvas.card.opened',
      'commands/vuu.se.canvasboard.created',
      'commands/vuu.se.canvascard.moved',
      'commands/vuu.se.canvasregion.moved',
      'commands/vuu.se.canvasregion.resized',
      'commands/vuu.se.card.created',
      'commands/vuu.se.pocket.added',
      'commands/vuu.se.pocket.created',
      'commands/vuu.se.region.created',
      'commands/vuu.se.wall.opened',

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
