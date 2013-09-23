
var CardFactory = (function() {

// constructor

function CardFactory( eq, options ) {
  this.options = options || { enabled: true };
  this.eq = eq;
  
  this.counter = 0;
  
  __watch.call( this );
}

// private functions

function __watch() {
  var cf = this;
  var options = cf.options;

  var stage = 0;
  var coords = { x: 0, y: 0, w: 100, h: 65 };
  var card = null;

  this.eq.on( 'board:dbltap', function( data,  board ) {
    if ( options.enabled ) {
      var x = coords.x = data.x;
      var y = coords.y = data.y;
      var w = coords.w;
      var h = coords.h;
      
      coords.cardid = ++cf.counter;
      coords.title = prompt('Please enter a title fo rthe card', 'Sample card');
    
      card = new Card( 'card' + coords.cardid, cf.eq, coords );
    
      this.eq.trigger( card, 'cardcreate:start', coords );
      this.eq.trigger( card, 'cardcreate:end', coords );
      
      card = null;
    }
  }); 
};

// public functions

CardFactory.prototype.enable = function() {
  this.options.enabled = true;
};

CardFactory.prototype.disable = function() {
  this.options.enabled = false;
};

return CardFactory;

})();