
// event <-- .add-board:mouseup, .add-board:touchend

// event -->

define(function() {

    function initialize( app ) {
        app.element.on( 'mouseup touchend', '.add-board', triggerAddBoard );

        function triggerAddBoard( ev ) {
          var key = prompt( 'Please provide a data key that this board represents', '' );

          $.post('/boards/', { wall: app.wall, key: key })
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
