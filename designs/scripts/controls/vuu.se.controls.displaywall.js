
// event <-- .list-group-item:mouseup, .list-group-item:touchend

// event --> wall:opened

define([ 'models/vuu.se.wall' ], function( Wall ) {

    function initialize( app ) {
        app.element.on( 'mouseup touchend', '.list-group-item', triggerDisplayWall );

        function triggerDisplayWall( e ) {
            e.preventDefault();

            var data = $( e.target ).data( 'wall');

            data.links = data.links || {};

            var wall = new Wall( app.queue, data );

            app.queue.trigger( app, 'wall:selected', wall );

            $('#wallModal').modal( 'hide' );
        }
    }

    return {
        initialize: initialize
    };

});
