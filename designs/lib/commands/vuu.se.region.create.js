




  // triggers

queue.on( app.wall, 'region:add', addRegion );

queue.on( app.wall, 'region:createbegin', createRegion );

queue.on( app.wall, 'region:clone', cloneRegions );

socket.on( 'region:created', completeRegion );






  // handlers

function addRegion() {  
  var board = app.wall.getActiveBoard();
  
  var val = prompt( 'Please provide a value for this region', '' );
  
  var data = {
    x: 10,
    y: 10,
    width: 250,
    height: 150,
    board: board,
    value: val
  };
  
  queue.trigger( this, 'region:createbegin', data );
}

function cloneRegions( data ) {
  $.get('/regions/' + data.region.id, function( resources ) {
    resources.regions.forEach(function( region ) {    
      if ( region.links.board == data.board.id ) {
        __buildRegion( 'region:cloned', region );
      }
    });
  });
}

function createRegion( data ) {  
  socket.emit( 'region:create', data );
}

function completeRegion( data ) {
  __buildRegion( 'region:createend', region );
}




  // helpers

function __buildRegion( ev, data ) {
  var board = app.wall.getBoardById( data.links.board );

  var region = new Region( queue, socket, data );

  if ( board.addRegion( region ) ) {
    queue.trigger( region, ev, { region: region } );
  }
}