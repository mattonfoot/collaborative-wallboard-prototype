
var Region = (function() {

function Region( name, eq, config ) {
  this.eq = eq;
  this.cards = [];

  var shape = this.shape = new Kinetic.Rect({
    name: name,
    x: config.x,
    y: config.y,
    width: config.w,
    height: config.h,
    stroke: '#ddd',
    opacity: 0.5,
    draggable: true,
    shadowColor: 'transparent',
    shadowBlur: 3,
    shadowOffset: 2,
    shadowOpacity: 0.3
  });
  
  var self = this;
  
  this.shape
    .on('mousedown touchstart', function() {
      shape.setOpacity( .7 );
      
      self.eq.trigger( self, 'region:active' );      
    })
    .on('mouseup touchend', function() {
      shape.setOpacity( .5 );
      
      self.eq.trigger( self, 'region:inactive' );
    })
    .on('dragstart', function() {
      shape.setShadowColor( 'black' );
      
      self.eq.trigger( self, 'region:movestart', __getBounds.call( self ) );
    })
    /*
    .on('dragmove', function() {
      self.eq.trigger( self, 'region:move', __getBounds.call( self ) );
    })
    */
    .on('dragend', function() {
      shape.setShadowColor( 'transparent' );
      
      self.eq.trigger( self, 'region:moveend', __getBounds.call( self ) );
    });
  
}

// private methods

function __getBounds() {
  return { 
    x: this.shape.getX(), 
    y: this.shape.getY(), 
    w: this.shape.getWidth(), 
    h: this.shape.getHeight()
  }
};

// public methods

Region.prototype.allowDrag = function() {
  this.shape.setDraggable( true );
};

Region.prototype.disallowDrag = function() {
  this.shape.setDraggable( false );
};

Region.prototype.move = function( x, y ) {
  this.eq.trigger( this, 'region:movestart', __getBounds.call( this ) );
  
  this.shape.setX( x );
  this.shape.setY( y );
  
  this.eq.trigger( this, 'region:move', __getBounds.call( this ) );
  this.eq.trigger( this, 'region:moveend', __getBounds.call( this ) );
};

Region.prototype.resize = function( w, h ) {
  
  this.shape.setWidth( w );
  this.shape.setHeight( h );
  
  this.eq.trigger( this, 'region:resize', __getBounds.call( this ) );
};

Region.prototype.setColor = function( color ) {
  this.shape.setFill( color );
  this.shape.setStroke( 'transparent' );
  
  this.eq.trigger( this, 'region:updated', { color: color } );
};

return Region;

})();