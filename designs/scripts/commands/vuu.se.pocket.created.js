define(function() {

    function initialize( app ) {
        app.queue.on( app, 'pocket:created', clonePocket );

        // handlers

        function clonePocket( data ) {
            var pocket = app.getPocketById( data.id );

            if ( !pocket && app.addPocket( data ) ) {
                pocket = app.getPocketById( data.id );
            }

            if ( !pocket ) {
                throw( 'Failed to clone pocket <'+ data.id +'> from data' );
            }

            var wall = app.getWallById( pocket.getWall() );

            if ( wall.addPocket( pocket ) ) {
                app.queue.trigger( app, 'pocket:added', pocket );
            }

            app.queue.trigger( app, 'pocket:cloned', pocket );
        }
    }

    return {
        initialize: initialize
    };

});
