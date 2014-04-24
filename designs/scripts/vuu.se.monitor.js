(function () { "use strict";

    function monitorSocketIO( app ) {
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

    var monitor = { initialize: monitorSocketIO };

    // export as AMD module / Node module / browser variable
    if (typeof define === 'function' && define.amd) {
        define(function() {
            return monitor;
        });
    } else if (typeof module !== 'undefined') {
        module.exports = monitor;
    } else {
        window.vuu = window.vuu || { se: {} };

        window.vuu.se.monitor = monitor;
    }

})();
