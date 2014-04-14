define(function() {

    function initialize( app ) {
        app.element.on( 'mouseup touchend', '.add-wall', triggerAddWall );

        function triggerAddWall( ev ) {
          var name = prompt( 'Please provide a name for this wall', '' );

          if (name === '') {
              return;
          }

          var data = {
              walls: [
                  {
                      name: name
                  }
              ]
          };

          $.ajax({
                  url: '/walls/',
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
