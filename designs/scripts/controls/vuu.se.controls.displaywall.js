
// event <-- .list-group-item:mouseup, .list-group-item:touchend

// event --> wall:opened

define(function() {

    function initialize( app ) {
        var queue = app.queue;

        app.element.on( 'mouseup touchend', '.list-group-item', triggerDisplayWall );

        function triggerDisplayWall( e ) {
            e.preventDefault();

            var wall = $( e.target ).data( 'wall');

            // the following should be a method on the app

            $('#wallModal').modal( 'hide' );

            app.wall = {};

            queue.trigger( app, 'wall:opened', wall );
        }

    }

    return {
        initialize: initialize
    };

});
