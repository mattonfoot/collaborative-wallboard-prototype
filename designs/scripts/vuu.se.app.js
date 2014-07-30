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
    }
});

define([

      'jquery',
      'bootstrap',
      'socketio'

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

    };

    var hypermedia = {
    }

    var app = new UI( hypermedia );

    // triggers

    app.socket.on('connect', function() {
        console.log( 'You are connected to the server' );
    });

    app.socket.on('disconnect', function() {
        console.log( 'You seem to have been disconected from the server.' );
    });

    app.socket.on( 'app:init', function(  ) {

        app.queue.trigger( app, 'app:initend', app );
    });

    // load plugins

    [
      'vuu.se.monitor',
    ].forEach(function( plugin ) {
        require([ plugin ], function( command ) { command.initialize( app ); });
    });

    return app;

});
