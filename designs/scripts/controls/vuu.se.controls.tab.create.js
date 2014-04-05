
// event <-- board:cloned

// event -->

define(function() {

    function initialize( app ) {
        app.queue.on( app, 'board:cloned', addTab );

        function addTab( board ) {
          $( '<li class="active"><a href="#'+ board.id +'" data-toggle="tab">' + board.key + '</a></li>' )
              .insertBefore( app.tabs.children().last() )
              .tab('show');
        }

    }

    return {
        initialize: initialize
    };

});
