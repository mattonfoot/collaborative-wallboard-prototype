define(function() {

    function initialize( app ) {
        app.queue.on( app, 'board:created', cloneBoard );
        app.queue.on( app, 'board:added', cloneBoard );

        // handlers

        function cloneBoard( data ) {
            var board = app.getBoardById( data.id );

            if ( !board ) {
                app.addBoard( data );
            }
        }
    }

    return {
        initialize: initialize
    };

});
