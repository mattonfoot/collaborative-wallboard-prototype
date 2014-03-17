define(function() {

function initialize( app ) {
    var socket = app.socket
      , queue = app.queue;

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

    socket.on( 'card:updated', function( data ) {
      queue.trigger( app, 'card:updated', data );
    });

    socket.on( 'region:updated', function( data ) {
      queue.trigger( app, 'region:updated', data );
    });
}

return {
    initialize: initialize
};

});
