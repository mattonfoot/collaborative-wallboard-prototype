define(function() {

    function initialize( app ) {
        app.element.on( 'mouseup touchend', '.transform-list [data-delete]', triggerDeleteTransform );

        function triggerDeleteTransform( ev ) {
          var $target = $(ev.target)
            , $item = $target.parents('.transform').first()
            , path = $target.data('delete');

          if (!path || path === '') {
              return;
          }

          $item.addClass('text-warning');

          $.ajax({
                  url: path,
                  dataType: "json",
                  contentType: "application/json;charset=utf-8",
                  type: "DELETE"
              })
              .success(function(){
                  $item.slideUp();
              });
        }

    }

    return {
        initialize: initialize
    };

});
