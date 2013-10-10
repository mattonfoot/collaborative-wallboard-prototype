var CanvasCard = (function() {

// defaults

var size = { w: 100, h: 65 };

var colors = {
  fill: '#f6f6f6',
  stroke: { active: '#aaa', inactive: '#e5e5e5' }
};

var shadow = {
  color: 'black',
  offset: { active: 2, inactive: 1 },
  blur: { active: 9, inactive: 5 }
};

// constructor

function Card( config ) {   
  var shape = new Kinetic.Group();
  var id = config.id;
  var title = config.title;

  var cardback = __createCardback( id, size.w, size.h, colors.fill, shadow.color );
  var tag = __createTag( id );
  
  shape.add( cardback );
  shape.add( __createIdText( id ) );
  shape.add( __createTitleText( id, title ) );
  shape.add( tag );

  // public methods
  
  shape.displayActiveState = function() {
    cardback.setStroke( colors.stroke.active );
    cardback.setShadowBlur( shadow.blur.active );
    cardback.setShadowOffset( shadow.offset.active );

    return shape;
  };
  
  shape.displayInactiveState = function() {
    cardback.setStroke( colors.stroke.inactive );
    cardback.setShadowBlur( shadow.blur.inactive );
    cardback.setShadowOffset( shadow.offset.inactive );

    return shape;
  };
  
  shape.moveTo = function( x, y ) {
    shape.setX( x );
    shape.setY( y );
    
    return shape;
  };
  
  shape.tag = function( color ) {  
    tag.setFill( color );
    tag.setOpacity( 1 );
    
    return shape;
  };
  
  shape.untag = function() {
    tag.setOpacity( 0 );
    
    return shape;
  };
  
  // initialise
  
  shape.displayActiveState();
  shape.untag();
  
  // instance

  return shape;
}

// private methods

function __createCardback( id, w, h, fill, shadow ) {
  return new Kinetic.Rect({
    id: 'card_' + id + '_cardback',
    x: 0,
    y: 0,
    width: w,
    height: h,
    cornerRadius: 5,
    fill: fill,
    strokeWidth: 1,
    shadowOpacity: 0.5,
    shadowColor: shadow,
  });
};

function __createIdText( id ) {
  return new Kinetic.Text({
    id: 'card_' + id + '_id',
    x: 5,
    y: 2,
    text: '#' + id,
    fontSize: 15,
    fontFamily: 'Calibri',
    fill: '#666'
  });
};

function __createTitleText( id, title ) {
  return new Kinetic.Text({
    id: 'card_' + id + '_title',
    x: 5,
    y: 22,
    width: 85,
    height: 36,
    text: title,
    fontSize: 11,
    fontFamily: 'Calibri',
    fill: '#666'
  });
};

function __createTag( id ) {
  return new Kinetic.Rect({
    id: 'card_' + id + '_tag',
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
};

// public methods

return Card;

})();