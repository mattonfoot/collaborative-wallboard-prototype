




  // triggers

queue.on( app.wall, 'region:add', addRegion );

queue.on( app.wall, 'region:createbegin', createRegion );

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

function createRegion( data ) {  
  socket.emit( 'region:create', data );
}

function completeRegion( data ) {  
  var board = app.wall.getBoardById( data.links.board );

  var region = new Region( queue, socket, data );

  if ( board.addRegion( region ) ) {
    queue.trigger( region, 'region:createend', { region: region } );
  }
}