(function () {
    "use strict";

    function initialize( app ) {
        app.queue.on( app, 'card:created', cloneCard );

        // handlers

        function cloneCard( data ) {
            var card = app.getCardById( data.id );

            if ( !card && app.addCard( data ) ) {
                card = app.getCardById( data.id );
            }

            if ( !card ) {
                throw( 'Failed to clone card <'+ data.id +'> from data' );
            }

            var board = app.getBoardById( card.getBoard() );

            if ( board && board.addCard( card ) ) {
                app.queue.trigger( app, 'card:added', card );
            }

            app.queue.trigger( app, 'card:cloned', card );
        }
    }

    var api = {
        initialize: initialize
    };

    // export as AMD module / Node module / browser variable
    if (typeof define === 'function' && define.amd) {
        define(function() {
            return api;
        });
    } else if (typeof module !== 'undefined') {
        module.exports = api;
    } else {
        window.vuu = window.vuu || {};
        window.vuu.se = window.vuu.se || {};
        window.vuu.se.card = window.vuu.se.card || {};

        window.vuu.se.card.clone = api;
    }

})();
