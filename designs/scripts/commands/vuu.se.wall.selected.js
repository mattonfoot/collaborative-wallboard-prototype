define(function( Wall ) {

    function initialize( app ) {
        app.queue.on( app, 'wall:selected', selectWall );

        // handlers

        function selectWall( data ) {
            var wall = app.getWallById( data.id );

            if ( wall ) {
                app.selectWall( wall );
            }
        }
    }

    return {
        initialize: initialize
    };

});
