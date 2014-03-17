require.config({
    baseUrl: 'scripts',

    shim: {
        "bootstrap": { deps: [ "jquery" ] }
    },

    paths: {
        jquery: 'vendor/jquery1.10.2.min'
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

        initialize: function( resources ) {
            this.size = {
                width: this.element.find('.tab-content').outerWidth(),
                height: this.element.find('.tab-content').outerHeight()
            };

            var walllist = [];
            $.each(resources, function() {
                var wallLink = $('<a href="#" class="list-group-item">'+ (this.name || this.id) +'</a>').data( 'wall', this );

                walllist.push( wallLink );
            });

            $('#wallList').append( walllist );

            $('#wallModal').modal( 'show' );

            this.queue.trigger( this, 'app:initend', { app: this } );
        }
    };

    // triggers

    app.socket.on( 'app:init', function( resources ) {
        app.initialize( resources );
    });

    // cardlocation:changed
    app.queue.on( app, 'card:moved', function( data ) {
      socket.emit( 'card:moved', data ); // should be put to server
    });

    // pocket:tagged
    app.queue.on( app, 'card:tagged', function( data ) {
      socket.emit( 'card:tagged', data ); // should be put to server
    });

    // pocket:untagged
    app.queue.on( app, 'card:untagged', function( data ) {
      socket.emit( 'card:untagged', data ); // should be put to server
    });

    app.queue.on( app, 'region:moved', function( data ) {
      socket.emit( 'region:moved', data ); // should be put to server
    });

    app.queue.on( app, 'region:resized', function( data ) {
      socket.emit( 'region:resized', data ); // should be put to server
    });

    [
      'vuu.se.monitor',
      'vuu.se.plugins',

      'commands/vuu.se.canvas.card.open',
      'commands/vuu.se.canvasboard.create',
      'commands/vuu.se.card.create',
      'commands/vuu.se.card.trackmovement',
      'commands/vuu.se.pocket.create',
      'commands/vuu.se.region.create',
      'commands/vuu.se.wall.create',

      'controls/vuu.se.controls.addboard',
      'controls/vuu.se.controls.addpocket',
      'controls/vuu.se.controls.addregion',
      'controls/vuu.se.controls.displayboard',
      'controls/vuu.se.controls.displaywall',
      'controls/vuu.se.controls.enable',
      'controls/vuu.se.controls.tab.create',

      'plugins/vuu.se.plugins.displayColorTag'
    ].forEach(function( plugin ){
        require([ plugin ], function( command ) { command.initialize( app ); });
    });

    return app;

});
