
// event <-- .add-pocket:mouseup, .add-board:touchend

// event -->

define(function() {

    function initialize( app ) {
        app.element.on( 'mouseup touchend', '.add-pocket', triggerAddPocket );

        function triggerAddPocket( ev ) {
          var title = prompt( 'Please provide a title for this card', 'Sample Card' );

          $.post('/pockets/', { wall: app.wall, title: title })
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
