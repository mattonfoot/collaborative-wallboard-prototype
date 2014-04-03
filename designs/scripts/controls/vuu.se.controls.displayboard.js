
// event <-- [data-toggle="tab"]:shown.bs.tab

// event -->

define(function() {

    function initialize( app ) {
        app.element.on( 'shown.bs.tab', '[data-toggle="tab"]', activateBoard );

        function activateBoard(e) {
            var hash = e.target.hash
              , boardid = hash.substr( 1, hash.length - 1 )
              , current = app.wall.getActiveBoard();

            if ( app.wall.setActiveBoardById( boardid ) ) {
                app.trigger( app, 'board:deactivated', current );

                app.trigger( app, 'board:activated', app.wall.getActiveBoard() );
            }
        }

    }

    return {
        initialize: initialize
    };

});
