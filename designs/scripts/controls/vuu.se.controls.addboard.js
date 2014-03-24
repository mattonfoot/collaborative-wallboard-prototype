
// event <-- .add-board:mouseup, .add-board:touchend

// event -->

define(function() {

    function initialize( app ) {
        app.element.on( 'mouseup touchend', '.add-board', triggerAddBoard );

        function triggerAddBoard( ev ) {
          var key = prompt( 'Please provide a data key that this board represents', '' );

          var data = {
              boards: [
                  {
                      key: key,
                      wall: app.wall.id
                  }
              ]
          };

          $.ajax({
                  url: '/boards/',
                  dataType: "json",
                  contentType: "application/json;charset=utf-8",
                  type: "POST",
                  data: JSON.stringify( data )
              });
        }

    }

    return {
        initialize: initialize
    };

});
