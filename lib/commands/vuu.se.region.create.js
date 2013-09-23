
var RegionFactory = (function() {

// constructor

function RegionFactory( eq, options ) {
  this.options = options || { enabled: false };
  this.eq = eq;
  
  this.counter = 0;
  
  __watch.call( this );
}

// private functions

function __watch() {
  var rf = this;
  var options = rf.options;
  
  var coords = { x:0, y:0, w:10, h:10 };  
  var region = null;

  this.eq.on( 'board:dbltapstart', function( data,  board ) {
    if ( options.enabled ) {
      var x = coords.x = data.x;
      var y = coords.y = data.y;
      var w = coords.w;
      var h = coords.h;
    
      region = new Region( 'region' + (++rf.counter), rf.eq, coords );
    
      this.eq.trigger( region, 'regioncreate:start', coords );
    }
  });

  this.eq.on( 'board:tapend', function( data,  board ) {
    if ( options.enabled && region !== null ){
      var w = coords.w = data.x - coords.x;
      var h = coords.h = data.y - coords.y;
    
      region.resize( w, h );
      
      region.setColor( prompt('what color should I be?', '#e7e7e7') );
    
      this.eq.trigger( region, 'regioncreate:end', coords);
      
      region = null;
    }
  });  
};

// public functions

RegionFactory.prototype.enable = function() {
  this.options.enabled = true;
};

RegionFactory.prototype.disable = function() {
  this.options.enabled = false;
};

return RegionFactory;

})();