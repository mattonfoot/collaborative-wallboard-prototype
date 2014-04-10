
// event <-- board:added

// event --> controls:enabled

define(function() {

    function initialize( app ) {
        app.queue.on( app, 'board:activated', enableControls );

        function enableControls() {
            app.enableControls();

            app.queue.trigger( app, 'controls:enabled', app );
        }
    }

    return {
        initialize: initialize
    };

});
