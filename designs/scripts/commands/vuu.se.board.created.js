define(function() {

    function initialize( app ) {
        app.queue.on( app, 'board:created', cloneBoard );
        app.queue.on( app, 'board:added', cloneBoard );

        // handlers

        function cloneBoard( data ) {
            var board = app.getBoardById( data.id );

            if ( !board && app.addBoard( data ) ) {
                board = app.getBoardById( data.id );
            }

            if ( !board ) {
                throw( 'Failed to clone board <'+ data.id +'> from data' );
            }

            var wall = app.getWallById( board.getWall() );

            if ( wall.addBoard( board ) ) {
                app.queue.trigger( app, 'board:added', board );
            }

            app.queue.trigger( app, 'board:cloned', board );
        }
    }

    return {
        initialize: initialize
    };

});
