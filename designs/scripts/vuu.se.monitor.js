define(function() {

    function initialize( app ) {
        var socket = app.socket
          , queue = app.queue;

        // creates

        socket.on( 'card:created', function( data ) {
          queue.trigger( app, 'card:created', data );
        });

        socket.on( 'pocket:created', function( data ) {
          queue.trigger( app, 'pocket:created', data );
        });

        socket.on( 'board:created', function( data ) {
          queue.trigger( app, 'board:created', data );
        });

        socket.on( 'region:created', function( data ) {
          queue.trigger( app, 'region:created', data );
        });

        socket.on( 'wall:created', function( data ) {
          queue.trigger( app, 'wall:created', data );
        });

        // updates

        socket.on( 'card:updated', function( data ) {
          queue.trigger( app, 'card:updated', data );
        });

        socket.on( 'pocket:updated', function( data ) {
          queue.trigger( app, 'region:updated', data );
        });

        socket.on( 'board:updated', function( data ) {
          queue.trigger( app, 'region:updated', data );
        });

        socket.on( 'region:updated', function( data ) {
          queue.trigger( app, 'region:updated', data );
        });

        socket.on( 'wall:updated', function( data ) {
          queue.trigger( app, 'wall:updated', data );
        });

        // specific updates

        socket.on( 'card:moved', function( data ) {
          queue.trigger( app, 'card:moved', data );
        });

        socket.on( 'region:moved', function( data ) {
          queue.trigger( app, 'region:moved', data );
        });

        socket.on( 'region:resized', function( data ) {
          queue.trigger( app, 'region:resized', data );
        });
    }

    return {
        initialize: initialize
    };

});
