define(function() {

    function initialize( app ) {
        app.element.on( 'mouseup touchend', '.add-board', triggerAddBoard );
        app.queue.on( app, 'wall:firsttime', triggerAddBoard );

        function triggerAddBoard( ev ) {
          var name = prompt( 'Please provide a name for this board', '' );

          if (!name || name === '') {
              return;
          }

          var data = {
              boards: [
                  {
                      name: name,
                      wall: app.activewall.id
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
