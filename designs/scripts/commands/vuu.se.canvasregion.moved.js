define(function() {

    function initialize( app ) {
        app.queue.on( app, 'canvasregion:moved', updateCoordinates );

        function updateCoordinates( data ) {

            var coordinates = {
                x: data.x,
                y: data.y
            };

            $.ajax({
                    url: '/regions/' + data.region.id + '/move',
                    dataType: "json",
                    contentType: "application/json;charset=utf-8",
                    type: "POST",
                    data: JSON.stringify( coordinates )
                });

        }

      }

      return {
          initialize: initialize
      };

  });
