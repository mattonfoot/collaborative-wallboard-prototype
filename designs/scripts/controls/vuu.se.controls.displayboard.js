define(function() {

    function initialize( app ) {
        app.element.on( 'shown.bs.tab', '[data-toggle="tab"]', activateBoard );

        function activateBoard(e) {
            var hash = e.target.hash
              , wall = app.activewall
              , previous = app.getBoardById( wall.getActiveBoard() )
              , next = app.getBoardById( hash.substr( 1, hash.length - 1 ) );

            if ( wall.setActiveBoardById( next.id ) ) {
                app.queue.trigger( app, 'board:deactivated', previous );

                app.queue.trigger( app, 'board:activated', next );
            }
        }

    }

    return {
        initialize: initialize
    };

});
