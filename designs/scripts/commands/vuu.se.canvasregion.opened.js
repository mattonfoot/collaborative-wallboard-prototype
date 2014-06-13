define(function() {

    function initialize( app ) {
        app.queue.on( app, 'canvasregion:opened', displayRegionData);

        function displayRegionData( data ) {
            var region = app.getRegionById( data.region.id );

            var $modal = $('<div class="modal fade"></div>')
              .on('submit', '.editor-region', function( ev ) {
                ev.preventDefault();

                region.name = this.name.value;
                region.value = this.value.value;
                region.color = this.color.value;

                $.ajax({
                    url: '/regions/' + region.id,
                    dataType: "json",
                    contentType: "application/json;charset=utf-8",
                    type: "PUT",
                    data: JSON.stringify( { regions: [ region ] } )
                });

                $modal.modal('hide');
              });

            $modal.appendTo(app.element).modal({ remote: '/regions/' + region.id + '/edit' });
        }
    }

    return {
        initialize: initialize
    };

});
