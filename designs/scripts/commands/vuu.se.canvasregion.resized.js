define(function() {

    function initialize( app ) {
        app.queue.on( app, 'canvasregion:resized', updateSize );

        function updateSize( data ) {

            var dimensions = {
                height: data.height,
                width: data.width
            };

            $.ajax({
                    url: '/regions/' + data.region.id + '/resize',
                    dataType: "json",
                    contentType: "application/json;charset=utf-8",
                    type: "POST",
                    data: JSON.stringify( dimensions )
                });

        }

      }

      return {
          initialize: initialize
      };

  });
