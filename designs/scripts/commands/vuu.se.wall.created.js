define(function() {

    function initialize( app ) {
        app.queue.on( app, 'wall:created', cloneWall );

        // handlers

        function cloneWall( data ) {
            var wall = app.getWallById( data.id );

            if ( !wall && app.addWall( data ) ) {
                wall = app.getWallById( data.id );
            }

            if ( !wall ) {
                throw( 'Failed to clone wall <'+ data.id +'> from data' );
            }

            app.queue.trigger( app, 'wall:cloned', wall );
        }
    }

    return {
        initialize: initialize
    };

});
