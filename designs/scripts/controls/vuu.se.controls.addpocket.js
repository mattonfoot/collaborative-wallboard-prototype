
define(function() {

    function initialize( app ) {
        app.element.on( 'mouseup touchend', '.add-pocket', triggerAddPocket );

        function triggerAddPocket( ev ) {
          var title = prompt( 'Please provide a title for this card', 'Sample Card' );

          var data = {
              pockets: [
                  {
                      title: title,
                      wall: app.activewall.id
                  }
              ]
          };

          $.ajax({
                  url: '/pockets/',
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
