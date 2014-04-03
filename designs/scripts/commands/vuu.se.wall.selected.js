
// event <-- wall:opened

// event --> wall:displayed, board:opened, pocket:added

define(function() {

function initialize( app ) {
    app.queue.on( app, 'wall:selected', cloneWall );

    // handlers

    function cloneWall( wall ) {
      app.wall = wall;

      app.element.data('wall', wall);

      if ( wall.links && wall.links.boards && wall.links.boards.length > 0 ) {
          app.queue.trigger( app, 'wall:opened', wall );
      } else {
          app.queue.trigger( app, 'wall:firsttime', wall );
      }
    }
}

return {
  initialize: initialize
};

});
