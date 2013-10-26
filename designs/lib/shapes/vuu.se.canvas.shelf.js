var CanvasShelf = (function() {

var spacing = 10;
var cardWidth = 100 + spacing;

var updateEvents = [ 'board:addcard', 'shelf:addcard', 'card:created', 'card:active', 'card:inactive', 'card:moved', 'card:tagged', 'card:untagged' ];

function CanvasShelf( stage, queue ) {
  var shelf = this;
  var numCards = 0;
  var width = 698;
  var height = 70;
  var upperBound = width;
  var cards = [];
  
  var layer = new Kinetic.Layer({
    x: 100,
    y: 515,
    clip: [0, 0, width, height]
  });

  var cardMenu = new Kinetic.Group({
    draggable: true,
    dragBoundFunc: function(pos) {
      var numCards = cardMenu.children.length;
    
      return {
        x: ( pos.x < 100 && (numCards * cardWidth >= width) ? pos.x : 100 ),
        y: cardMenu.getAbsolutePosition().y
      }
    }
  });

  layer.add( cardMenu );  
  stage.add( layer );
  
  // private methods
  
  function __batchDraw() {
    layer.batchDraw();
  };
  
  function __addCard( data, card ) {
    cards.push( card );
    cardMenu.add( card.shape );
    
    numCards++;    
    upperBound = ((numCards * cardWidth) - cardWidth - width) * -1;
    
    __organizeCards( cards );
  };
  
  // triggers

  queue.on( shelf, 'cardcreate:end', function( data, card ) {
    __addCard.call( shelf, data, card );
  });

  updateEvents.forEach(function( ev ) {
    queue.on( cardMenu, ev, __batchDraw);
  });
  
  // instance

  return shelf;
};

// private methods

function __organizeCards( cards ) {
  var x = spacing;
  var y = 2;
  
  cards.forEach(function( card ) {
    card.moveTo( x, y );
    
    x = x + cardWidth;
  });
};

// exports

return CanvasShelf;

})();