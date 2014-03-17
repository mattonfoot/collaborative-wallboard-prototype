
// event <-- board:cloned

// event --> 

define(function() {

function initialize( app ) {
    app.queue.on( app, 'board:cloned', addTab );

    function addTab( data ) {
      var tablist = app.element.find( '.add-board' ).parent()
        , boardid = data.board.id;;

      tablist.find( 'li.active' ).removeClass('active');

      $( '<li class="active"><a href="#'+ boardid +'" data-toggle="tab">' + data.board.getKey() + '</a></li>' )
          .insertBefore( tablist );

      app.wall.setActiveBoardById( boardid );
    }

}

return {
initialize: initialize
};

});
