// defaults

var colors = {
  fill: '#f6f6f6',
  stroke: { active: '#aaa', inactive: '#e5e5e5' }
};

var shadow = {
  color: 'black',
  offset: { active: 2, inactive: 1 },
  blur: { active: 9, inactive: 5 }
};

var size = {    // issue is that the server needs to know this as well
  width: 100,
  height: 65
};

// constructor

function CanvasCard( queue, ui, view, card ) {
  var pos = card.getPosition( view.getId() );

    var shape = new Kinetic.Group({
      id: card.id,
      x: pos.x || 5,
      y: pos.y || 5,
      draggable: true
    });

    var fill = card.getMetadata( view.getId() )[ 'color' ];
    var cardback = __createCardback( size.width, size.height, (fill || colors.fill), shadow.color );
    var cardnumber = __createIdText( '00' );
    var cardtitle = __createTitleText( card.getTitle() );

    shape.add( cardback );
    shape.add( cardnumber );
    shape.add( cardtitle );

    queue.subscribe( 'card.moved', function( data ) {
      var pos = card.getPosition( view.getId() );

      if ( card.getId() === data.card &&
            view.getId() === data.view &&
          ( shape.getX() !== pos.x || shape.getY() !== pos.y ) ) {
        __moveTo( pos.x, pos.y );
      }
    });

    queue.subscribe( 'card.updated', function( data ) {
      if ( card.getId() === data.card ) {
        __UpdateDisplay( card );
      }
    });

    queue.subscribe( 'card.transformed', function( data ) {
      if ( card.getId() === data.card && view.getId() == data.view ) {
        __UpdateDisplay( card );
      }
    });

    shape.on('mousedown touchstart', function() {
      __displayActiveState();

      ui.emit( 'card.activate', card.getId() );
    });

    shape.on('mouseup touchend', function() {
      __displayInactiveState();

      ui.emit( 'card.deactivate', card.getId() );
    });

    shape.on('dragend', function() {
      card.move({
        card: card.getId(),
        view: view.getId(),
        x: shape.getX(),
        y: shape.getY()
      });
    });

    shape.on('dblclick dbltap', function( e ) {
      e.cancelBubble = true;
      shape.getStage().preventEvents = true;

      ui.emit( 'card.edit', card.getId() );
    });

    // private methods

    function __redrawLayer() {
      try {
        var layer = shape.getLayer();

        if (layer) {
          layer.batchDraw();
        }
      } catch(e) {
      }
    }

    function __UpdateDisplay( card ) {
      cardtitle.setText( card.getTitle() || "" );
      cardnumber.setText( '#00' );

      var bg = colors.fill;
      var color = card.getMetadata( view.getId() )[ 'color' ];

      if ( color && color !== 'undefined' && color !== 'null' ) {
        bg = color;
      }
      cardback.setFill( bg );

      __redrawLayer();
    }

    function __moveTo( x, y ) {
      shape.moveToTop();

      shape.setX( x );
      shape.setY( y );

      __redrawLayer();
    }

    function __displayActiveState() {
      cardback.setStroke( colors.stroke.active );
      cardback.setShadowBlur( shadow.blur.active );
      cardback.setShadowOffset( shadow.offset.active );

      shape.moveToTop();

      __redrawLayer();
    }

    function __displayInactiveState() {
      cardback.setStroke( colors.stroke.inactive );
      cardback.setShadowBlur( shadow.blur.inactive );
      cardback.setShadowOffset( shadow.offset.inactive );

      __redrawLayer();
    }

    // initialise

    __displayInactiveState();

    // instance

    return shape;
}

  // private methods

function __createCardback( w, h, fill, shadow ) {
  return new Kinetic.Rect({
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
}

function __createIdText( id ) {
  return new Kinetic.Text({
    x: 5,
    y: 2,
    text: id,
    fontSize: 15,
    fontFamily: 'Calibri',
    fill: '#666'
  });
}

function __createTitleText( title ) {
  return new Kinetic.Text({
    x: 5,
    y: 22,
    width: 85,
    height: 36,
    text: title,
    fontSize: 11,
    fontFamily: 'Calibri',
    fill: '#666'
  });
}

module.exports = CanvasCard;
