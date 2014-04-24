define(function() {

    function initialize( app ) {
        app.element.on( 'mouseup touchend', '.add-board', triggerAddBoard );
        app.queue.on( app, 'wall:firsttime', triggerAddBoard );

        function triggerAddBoard( ev ) {
          var key = prompt( 'Please provide a data key that this board represents', '' );

          if (!key || key === '') {
              return;
          }

          var data = {
              boards: [
                  {
                      key: key,
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
