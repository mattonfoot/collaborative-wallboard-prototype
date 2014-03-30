define(function() {

    function initialize( app ) {
        var socket = app.socket
          , queue = app.queue
          , events = [
              'card:created'
            , 'card:updated'
            , 'card:moved'

            , 'pocket:created'
            , 'pocket:updated'
            , 'pocket:regionenter'
            , 'pocket:regionexit'

            , 'board:created'
            , 'board:updated'

            , 'region:created'
            , 'region:updated'
            , 'region:moved'
            , 'region:resized'
            
            , 'wall:created'
            , 'wall:updated'
          ];

        events.forEach(function( ev ) {
            socket.on( ev, function( data ) {
                queue.trigger( app, ev, data );
            });
        });
    }

    return {
        initialize: initialize
    };

});
