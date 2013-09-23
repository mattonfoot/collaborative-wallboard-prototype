<!DOCTYPE HTML>
<html>
  <head>
    <title>VUU.SE UI Prototype</title>
    
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    
    <!-- Bootstrap -->
    <link href="./css/vendor/bootstrap.min.css" rel="stylesheet" media="screen">
    <link href="./css/vendor/bootstrap-theme.min.css" rel="stylesheet" media="screen">
  </head>
  <body>
    <div id="container" style="border: 1px dashed #ccc; display: inline-block;"></div>
    
    <script src="./lib/vendor/kinetic-v4.6.0.min.js"></script>
    <script src="./lib/vendor/gator.js"></script>
    <script src="./lib/vendor/store+json2.min.js"></script>
    
    <script src="./lib/vuu.se.eventqueue.js"></script>
    
    <script src="./lib/vuu.se.wall.js"></script>
    <script src="./lib/vuu.se.board.js"></script>
    <script src="./lib/vuu.se.region.js"></script>
    <script src="./lib/vuu.se.card.js"></script>
    
    <script src="./lib/commands/vuu.se.region.create.js"></script>
    <script src="./lib/commands/vuu.se.card.create.js"></script>
    
    <script defer="defer">
      
      /*
      
      card tagging
      
      modify region data
      modify card data
      
      resize region
      multi select cards
      
      multiple boards
      
      link cards between boards
      
      */
      
      var config = {
        w: 1000,
        h: 400
      };
      
      // create event queue
      
      var queue = new EventQueue( { debug: true } );
      
      // create an mode switch menu
      renderModeMenu( queue );

      // create a wall      
      var wall = new Wall( 'wall1', queue, config );
      
      // create a board
      var board = new Board( 'board1', queue, config );
      
      // create a region factory
      var regionFactory = new RegionFactory( queue );
      
      // create a card factory
      var cardFactory = new CardFactory( queue );
      
      
      
  
      // register board with wall
      wall.addBoard( board );
      
      
      
      // event co-ordinators
      
      queue.on( 'modemenu:switchmode', function( data ) {
        if ( data.mode === 'region' ) {
          regionFactory.enable();
          board.allowRegionDrag();
          
          cardFactory.disable();
          board.disallowCardDrag();
          
        } else {
          cardFactory.enable();
          board.allowCardDrag();
          
          regionFactory.disable();
          board.disallowRegionDrag();
        }
      });
      
      queue.on( 'regioncreate:start', function( data, region ) {
        board.addRegion( region );
      });
      
      queue.on( 'regioncreate:end', function() {
        board.refreshUI();
      });
      
      queue.on( 'cardcreate:start', function( data, card ) {
        board.addCard( card );
      });
      
      queue.on( 'cardcreate:end', function() {
        board.refreshUI();
      });
      
      queue.on( 'region:inactive', function() {
        board.refreshUI();
      });
      
      queue.on( 'card:inactive', function() {
        board.refreshUI();
      });
      
      // board handles whether cards and regions should interact?
      
      queue.on( 'card:moveend', function( data, card ) {
        board.updateCard( card ); // boards shouldn't do this
      });
      
      queue.on( 'card:updated', function( data, card ) {
        board.refreshUI();
      });
      
      
      // tagging library listens for card and region move events
      // tagging library tracks relationships between regions and cards
      // tagging library adds or removes tags from cards




// private functions

function renderModeMenu( eq ) {
  var menu = document.createElement( 'div' );
  
  menu.className = 'system-menu';
  
  document.body.appendChild( menu );
  
  menu.innerHTML = '<ul class="nav nav-pills"><li class="switch active"><a href="javascript:void(0);">card</a></li><li class="switch"><a href="javascript:void(0);">region</a></li></ul>';

  menu.card = menu.firstChild.children[0];
  menu.region = menu.firstChild.children[1]; // convert menu to canvas shape to remove need for gator

  Gator( menu ).on( 'click', '.switch', function(e) {
    e.preventDefault();
    
    menu.card.className = 'switch';
    menu.region.className = 'switch';

    this.className += ' active';
    
    var mode = this.firstChild.innerHTML;
    
    eq.trigger( this, 'modemenu:switchmode', { mode: mode });
  });
};
      
      
    </script>
  </body>
</html>