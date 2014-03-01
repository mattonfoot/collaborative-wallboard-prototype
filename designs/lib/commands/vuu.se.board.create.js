
  // emits:  board:create
  
  // triggers:  board:createbegin, board:cloned, board:create, board:createend, region:clone, card:add, card:createend, card:cloned, region:createend, region:cloned
  
  // on (socket):  board:created --> board:createend + region:clone + card:add
  
  // on (queue):  board:add --> board:createbegin, board:clone --> board:cloned, board:createbegin --> board:create






  // triggers

queue.on( app.wall, 'board:clone', cloneBoard );

queue.on( app.wall, 'board:create', createBoard );






  // handlers

function cloneBoard( data ) {
  __buildBoard( 'board:cloned', data );
}

function createBoard( data ) {
  __buildBoard( 'board:created', data );
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
    
    var regions = data.links.regions || [];
    regions.forEach(function( id ) {
      queue.trigger( app.wall, 'region:clone', { board: board, region: { id: id } } );
    });
    
    // create cards for existing pockets
    
    app.wall.links.pockets.forEach(function( pocket ) {
      queue.trigger( app, 'pocket:cloned', { pocket: pocket } );
    });
  }
}

function __buildCanvasBoard( app, board ) {
  var id = board.id;
  var canvasboard = new CanvasBoard(queue, { container: id, width: app.size.width, height: app.size.height });
  
    // triggers
  
  queue.on( canvasboard, 'card:created', addCanvasCard);
  queue.on( canvasboard, 'card:cloned', addCanvasCard);
  
  queue.on( canvasboard, 'region:created', addCanvasRegion);
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