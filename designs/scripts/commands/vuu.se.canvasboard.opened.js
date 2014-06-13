define(function() {

    function initialize( app ) {
        app.queue.on( app, 'canvasboard:opened', displayBoardData);

        function displayBoardData( data ) {
            var board = app.getBoardById( data.board.id );

            var $modal = $('<div class="modal fade"></div>')
              .on('submit', '.editor-board', function( ev ) {
                ev.preventDefault();

                board.name = this.name.value;
                board.key = this.key.value;
                board.transform = this.transform.value;

                $.ajax({
                    url: '/boards/' + board.id,
                    dataType: "json",
                    contentType: "application/json;charset=utf-8",
                    type: "PUT",
                    data: JSON.stringify( { boards: [ board ] } )
                });

                $modal.modal('hide');
              });

            $modal.appendTo(app.element).modal({ remote: '/boards/' + board.id + '/edit' });
        }
    }

    return {
        initialize: initialize
    };

});
