define(function() {

    function initialize( app ) {
        app.queue.on( app, 'wall:created', cloneWall );

        // handlers

        function cloneWall( data ) {
            var wall = app.getWallById( data.id );

            if( !wall ) {
                app.addWall( data );
            }
        }
    }

    return {
        initialize: initialize
    };

});
