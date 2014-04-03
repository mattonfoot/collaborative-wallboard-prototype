
// event <-- board:cloned

// event -->

define(function() {

    function initialize( app ) {
        app.queue.on( app, 'board:cloned', addTab );

        function addTab( data ) {
          var $tablist = app.element.find( '.nav-tabs' );

          $( '<li class="active"><a href="#'+ data.board.id +'" data-toggle="tab">' + data.board.getKey() + '</a></li>' )
              .insertBefore( $tablist )
              .tab('show');
        }

    }

    return {
        initialize: initialize
    };

});
