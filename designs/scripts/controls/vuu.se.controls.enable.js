
// event <-- board:added

// event --> controls:enabled

define(function() {

    function initialize( app ) {
        app.queue.on( app, 'board:added', enableBoardControls );

        // the following should be a method on the app

        function enableBoardControls( data ) {
            app.element.find('.add-pocket, .add-region').removeAttr( 'disabled' );

            app.queue.trigger( app, 'controls:enabled', { wall: data.wall, board: data.board } );
        }

    }

    return {
        initialize: initialize
    };

});
