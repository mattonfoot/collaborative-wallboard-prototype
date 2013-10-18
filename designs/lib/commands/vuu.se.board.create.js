




  // triggers

queue.on( app.wall, 'board:add', addBoard );

queue.on( app.wall, 'board:clone', cloneBoard );

queue.on( app.wall, 'board:createbegin', createBoard );

socket.on( 'board:created', completeBoard );






  // handlers
    
function addBoard() {
  var key = prompt( 'Please provide a data key that this board represents', '' );
  
  console.log( app.wall );
  
  var data = { wall: app.wall, key: key };
  
  queue.trigger( app.wall, 'board:createbegin', data );
}

function cloneBoard( data ) {
  __buildBoard( 'board:cloned', data );
}

function createBoard( data ) {  
  socket.emit( 'board:create', data );
}

function completeBoard( data ) {
  __buildBoard( 'board:createend', data );
}




// helpers

function __buildBoard( ev, data ) {
  var board = new Board( queue, data );

  if ( app.wall.addBoard( board ) ) {
    var id = board.getId();
  
    app.element.find( '.tab-content > .active, .nav-tabs > .active' ).removeClass( 'active' );    
    app.element.find( '.tab-content' ).append( '<div class="tab-pane active" id="'+ id +'"></div>' );
    
    __buildCanvasBoard( app, board );

    queue.trigger( board, ev, { board: board } );
    
    // clone the regions
    
    console.log( '-->', data );
    
    // create cards for existing pockets
    
    app.wall.links.pockets.forEach(function( pocket ) {
      queue.trigger( app.wall, 'card:add', { board: board, pocket: pocket } );
    });
  }
}

function __buildCanvasBoard( app, board ) {
  var id = board.id;
  var canvasboard = new CanvasBoard(queue, { container: id, width: app.size.width, height: app.size.height });
  
    // triggers
  
  queue.on( canvasboard, 'card:createend', addCanvasCard);
  queue.on( canvasboard, 'card:cloned', addCanvasCard);
  
  queue.on( canvasboard, 'region:createend', addCanvasRegion);
  queue.on( canvasboard, 'region:cloned', addCanvasRegion);
  
  // handlers
  
  function addCanvasCard( data ) {  
    if ( data.card.links.board == id ) {
      var canvascard = new CanvasCard( queue, data.card, app.wall.getPocketById( data.card.links.pocket ) );
    
      canvasboard.addCard( canvascard );
    }
  }
  
  function addCanvasRegion( data ) {
    if ( data.region.links.board == id ) {
      var canvasregion = new CanvasRegion( queue, data.region );
    
      canvasboard.addRegion( canvasregion );
    }
  }
}