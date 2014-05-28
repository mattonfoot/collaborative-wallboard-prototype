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
            ]
          , trackedEvents = [
              , 'board:sketchbegin'
            ];

        events.forEach(function( ev ) {
            socket.on( ev, function( data ) {
                queue.trigger( app, ev, data );

                if (ga) {
                    var  evArr = ev.split(':');

                    ga( 'send', 'event', evArr[0], evArr[1] );
                }
            });
        });

        trackedEvents.forEach(function( ev ) {
            queue.on( app, ev, function( data ) {
                if (ga) {
                    var  evArr = ev.split(':');

                    ga( 'send', 'event', evArr[0], evArr[1], data.id );
                }
            });
        });

        queue.on( app, 'canvasboard:scaled', function( data ) {
            if (ga) {
                ga( 'send', 'event', 'canvasboard', 'scaled', data.canvasboard.id(), data.scale );
            }
        });

        queue.on( app, 'wall:opened', function( data ) {
            if (ga) {
                ga( 'send', 'pageview', '/walls/' + data.id );
                ga( 'send', 'event', 'wall', 'opened', data.id );
            }
        });

        queue.on( app, 'board:activated', function( data ) {
            if (ga) {
                ga( 'send', 'pageview', '/walls/' + data.wall + '/board/' + data.id );
                ga( 'send', 'event', 'board', 'activated', data.id );
            }
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
