
// event <-- .add-region:mouseup, .add-region:touchend

// event -->

define(function() {

    function initialize( app ) {
        app.element.on( 'mouseup touchend', '.add-region', triggerAddRegion );

        function triggerAddRegion( e ) {
            var val = prompt( 'Please provide a value for this region', '' );
            var board = app.wall.getActiveBoard();

            var data = {
              x: 10,
              y: 10,
              width: 250,
              height: 150,
              board: board,
              value: val
            };

            $.post('/regions/', data)
                .done(function() {
                //  alert( "success" );
                })
                .fail(function() {
                  alert( "error" );
                })
                .always(function() {
                  alert( "finished" );
                });
        }

    }

    return {
        initialize: initialize
    };

});
