




  // triggers

queue.on( app.wall, 'pocket:add', addPocket );

queue.on( app.wall, 'pocket:clone', clonePocket );

queue.on( app.wall, 'pocket:createbegin', createPocket );

socket.on( 'pocket:created', completePocket );






  // handlers

function addPocket() {
  var title = prompt( 'Please provide a title for this card', 'Sample Card' );
  
  queue.trigger( app.wall, 'pocket:createbegin', { wall: app.wall, title: title } );
}

function clonePocket( data ) {
  __buildPocket( 'pocket:cloned', data );
}

function createPocket( data ) {  
  socket.emit( 'pocket:create', data );
}
      
function completePocket( data ) {  
  __buildPocket( 'pocket:createend', data );
}




// helpers

function __buildPocket( ev, data ) {
  if ( app.wall.getPocketById( data.id ) ) {
    return; // we already have it ( should we check if it's fully synced? )
  }

  var pocket = new Pocket( queue, socket, data );

  app.wall.addPocket( pocket );
  
  queue.trigger( app.wall, ev, { pocket: pocket } );

  return pocket;
}