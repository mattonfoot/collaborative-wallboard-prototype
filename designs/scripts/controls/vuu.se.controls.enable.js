define(function() {

    function initialize( app ) {
        app.queue.on( app, 'board:activated', enableControls );

        function enableControls() {
            app.enableControls();
        }
    }

    return {
        initialize: initialize
    };

});
