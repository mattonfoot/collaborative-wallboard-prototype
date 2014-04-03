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

    var ui = {
        socket: io.connect('http://localhost:5000'),

        queue: new EventQueue({ debug: true }),

        element: $('#board'),

        initialize: function( resources ) {
            this.size = {
                width: this.element.outerWidth(),
                height: this.element.outerHeight()
            };

            this.queue.trigger( this, 'board:displayed', { app: this } );
        }
    };

    // triggers

    ui.socket.on('connect', function() {
        console.log( 'You are connected to the server' );
    });


    ui.socket.on('disconnect', function() {
        console.log( 'You seem to have been disconected from the server.' );
    });

    [
      'vuu.se.monitor',

      'commands/vuu.se.board.created',
      'commands/vuu.se.canvas.board.opened',
      'commands/vuu.se.canvas.card.opened',
      'commands/vuu.se.canvas.region.opened',
      'commands/vuu.se.canvasboard.created',
      'commands/vuu.se.canvascard.moved',
      'commands/vuu.se.canvasregion.moved',
      'commands/vuu.se.canvasregion.resized',
      'commands/vuu.se.card.created',
      'commands/vuu.se.pocket.added',
      'commands/vuu.se.pocket.created',
      'commands/vuu.se.pocket.updated',
      'commands/vuu.se.region.created',
      'commands/vuu.se.region.updated'
    ].forEach(function( plugin ){
        require([ plugin ], function( command ) { command.initialize( app ); });
    });

    return app;

});
