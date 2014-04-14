define(function() {

    function initialize( app ) {
        app.element.on( 'mouseup touchend', '.add-sketch', triggerAddSketch );

        function triggerAddSketch( ev ) {
            var wall = app.getWallById( app.activewall.id )
              , board = app.getBoardById( wall.getActiveBoard() );

            app.queue.trigger( app, 'board:sketchbegin', board );
        }

    }

    return {
        initialize: initialize
    };

});
