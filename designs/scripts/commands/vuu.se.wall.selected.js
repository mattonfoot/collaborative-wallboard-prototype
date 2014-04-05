
define(function( Wall ) {

    function initialize( app ) {
        app.queue.on( app, 'wall:selected', cloneWall );

        // handlers

        function cloneWall( data ) {
            var wall = app.getWallById( data.id );

            if ( wall.boards && wall.boards.length > 0 ) {
                app.queue.trigger( app, 'wall:opened', wall );
            } else {
                app.queue.trigger( app, 'wall:firsttime', wall );
            }
        }
    }

    return {
        initialize: initialize
    };

});
