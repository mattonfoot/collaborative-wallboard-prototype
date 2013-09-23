
var Card = (function() {

function Card( name, eq, config ) {
  this.eq = eq;
  this.id = config.cardid;
  this.title = config.title;
      
  var shape = this.shape = new Kinetic.Group({
    x: config.x,
    y: config.y,
    draggable: true
  });

  var cardback = new Kinetic.Rect({
    name: name,
    x: 0,
    y: 0,
    width: config.w,
    height: config.h,
    fill: '#f6f6f6',
    stroke: '#e5e5e5',
    strokeWidth: 1,
    shadowColor: 'black',
    shadowBlur: 3,
    shadowOffset: 2,
    shadowOpacity: 0.1,
    cornerRadius: 5
  });
  
  shape.add( cardback );
      
  var idText = new Kinetic.Text({
    x: 5,
    y: 2,
    text: '#' + this.id,
    fontSize: 15,
    fontFamily: 'Calibri',
    fill: '#666'
  });
    
  shape.add( idText );
  
  var titleText = new Kinetic.Text({
    x: 5,
    y: 22,
    width: 85,
    height: 36,
    text: this.title,
    fontSize: 11,
    fontFamily: 'Calibri',
    fill: '#666'
  });
    
  shape.add( titleText );
  
  this.tag = createTag.call();
  shape.add( this.tag );  
  
  var self = this;
  
  this.shape
    .on('mousedown touchstart', function() {
      cardback.setStroke('#666' );
      cardback.setShadowBlur( 9 );
      cardback.setShadowOffset( 6 );
      
      self.eq.trigger( self, 'card:active' );
      self.eq.trigger( self, 'card:updated' );    
    })
    .on('mouseup touchend', function() {
      cardback.setStroke( '#aaa' );
      cardback.setShadowBlur( 3 );
      cardback.setShadowOffset( 2 );
      
      self.eq.trigger( self, 'card:inactive' );
      self.eq.trigger( self, 'card:updated' );
    })
    .on('dragstart', function() {      
      self.eq.trigger( self, 'card:movestart', __getCoordinates.call( self ) );
    })
    /*
    .on('dragmove', function() {
      self.eq.trigger( self, 'card:move', __getCoordinates.call( self ) );
    })
    */
    .on('dragend', function() {      
      self.eq.trigger( self, 'card:moveend', __getCoordinates.call( self ) );
      self.eq.trigger( self, 'card:updated', __getCoordinates.call( self ) );
    });
  
}

// private methods

function __getCoordinates() {
  return { 
    x: this.shape.getX(), 
    y: this.shape.getY()
  }
}

function createTag() {
  return new Kinetic.Rect({
    name: 'tag' + ( this.id ),
    x: 95,
    y: 5,
    width: 10,
    height: 10,
    fill: '#eee',
    stroke: '#666',
    strokeWidth: 1,
    cornerRadius: 2,
    opacity: 0
  });
}

// public methods

Card.prototype.allowDrag = function() {
  this.shape.setDraggable( true );
};

Card.prototype.disallowDrag = function() {
  this.shape.setDraggable( false );
};

Card.prototype.move = function( x, y ) {
  this.eq.trigger( this, 'card:movestart', __getCoordinates.call( this ) );
  
  this.shape.setX( x );
  this.shape.setY( y );
  
  this.eq.trigger( this, 'card:move', __getCoordinates.call( this ) );
  this.eq.trigger( this, 'card:moveend', __getCoordinates.call( this ) );
  this.eq.trigger( this, 'card:updated', __getCoordinates.call( this ) );
};

Card.prototype.addTag = function( color ) {  
  this.tag.setFill( color );
  this.tag.setOpacity( 1 );
  
  this.eq.trigger( this, 'card:updated', { color: color } );
};

Card.prototype.removeTag = function() {
  this.tag.setOpacity( 0 );
};

return Card;

})();