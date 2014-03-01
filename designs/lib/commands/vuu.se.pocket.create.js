
  // emits:  pocket:create
  
  // triggers:  pocket:createbegin, pocket:cloned, pocket:createend
  
  // on (socket):  pocket:created --> pocket:createend
  
  // on (queue):  pocket:add --> pocket:createbegin, pocket:clone --> pocket:cloned, pocket:createbegin --> pocket:create






  // triggers

queue.on( app.wall, 'pocket:clone', clonePocket );

queue.on( app.wall, 'pocket:create', createPocket );






  // handlers

function clonePocket( data ) {
  __buildPocket( 'pocket:cloned', data );
}

function createPocket( data ) {
  __buildPocket( 'pocket:created', data );
}




// helpers

function __buildPocket( ev, data ) {
  if ( app.wall.getPocketById( data.id ) ) {
    return; // we already have it ( should we check if it's fully synced? )
  }

  var pocket = new Pocket( queue, data );

  app.wall.addPocket( pocket );
  
  queue.trigger( app.wall, ev, { pocket: pocket } );
}