var CanvasView = require('./shapes/view');
var CanvasCard = require('./shapes/card');
var CanvasRegion = require('./shapes/region');
var events = require('events');
var util = require('util');

function UI( q, $element, options, $ ) {
    var ui = this;
    var queue = this._queue = q;

    this._$element = $element;
    this._$navbar = $element.find('> .navbar');

    this._size = calculateHeight( $(window), this._$element, this._$navbar );

    this.constructor = UI;

    events.EventEmitter.call( this );


    var $body = $( document.body );

    trackClickTouchEventsFor( $element, ui, [ 'new', 'edit', 'select', 'display', 'unlink' ] );
    trackSubmitEventsFor( $element, ui, [ 'create', 'update' ]);

    trackNewCardEvents( $body, ui );
    trackNewRegionEvents( $body, ui );
    trackFileDropEvents( $body, ui );

    // failure logger
    queue.subscribe('#.fail', function( err ) {
      console.log( err );
    });

    setInterval(function() {
      var curSize = ui._size;
      ui._size = calculateHeight( $(window), ui._$element, ui._$navbar );

      if ( curSize.width !== ui._size.width || curSize.height !== ui._size.height ) {
        ui.emit( 'ui.resize', ui._size );
      }
    }, 10);
}

function calculateHeight( $window, $container, $footer ) {
    return {
        height: $window.innerHeight() - $footer.innerHeight() - $container.position().top
      , width: $container.innerWidth()
    };
}

util.inherits( UI, events.EventEmitter );

UI.prototype.displayView = function( view ) {
    var viewer = '<div id="'+ view.getId() +'" class="tab-content" data-viewer="view"></div>';

    this._$element.find('[data-viewer="view"]').replaceWith( viewer );

    this._$element.find('[data-selector="view"] .active').removeClass('active');
    this._$element.find('[data-display="view"][href="#'+ view.getId() +'"]').parent().addClass('active');

    this._canvasview = new CanvasView( this._queue, this, view, this._size );
    this._canvascards = [];
    this._canvasregions = [];
};

UI.prototype.displayViewCreator = function( wall ) {
    this._viewcreator = this._viewcreator || this._$element.find('[data-create="view"]');

    this._viewcreator[ 0 ].reset();
    this._viewcreator.find('[name="wall"]').val( wall.getId() );

    this._viewcreator.modal( 'show' );
};

UI.prototype.displayViewEditor = function( view, transforms ) {
    this._vieweditor = this._vieweditor || this._$element.find('[data-update="view"]');

    var options = transforms.map(function( view ) {
        return '<li class="list-group-item">'+ view.getPhrase() +'<a href="#'+ view.getId() +'" class="pull-right close" data-delete="transform">x</a></li>';
    });

    this._vieweditor[ 0 ].reset();
    this._vieweditor.find('[name="view"]').val( view.getId() );
    this._vieweditor.find('[name="name"]').val( view.getName() );
    this._vieweditor.find('[name="wall"]').val( view.getWall() );
    this._vieweditor.find('[data-list="transform"]').html( options );

    this._vieweditor.modal( 'show' );
};

UI.prototype.displayViewSelector = function( wall, views ) {
    var selector = this._$element.find('[data-selector="view"]');

    var options = views.map(function( view ) {
        return '<li><a href="#'+ view.getId() +'" data-display="view">'+ view.getName() +'</a></li>';
    });

    options.push('<li><button type="button" class="btn btn-default" data-new="view" data-parent="'+ wall.getId() +'" title="Add View"><i class="glyphicon glyphicon-plus"></i></button></li>');

    selector.empty().append( options.join('') );
};

UI.prototype.updateViewSelector = function( view ) {
    var selector = this._$element.find('[data-selector="view"]');

    selector.find('.active').removeClass('active');

    var lastChild = selector.children().last();

    $('<li class="active"><a href="#'+ view.getId() +'" data-display="view">'+ view.getName() +'</a></li>')
        .insertBefore( lastChild );

    return true;
};

// transforms

UI.prototype.displayTransformCreator = function( view, views ) {
    this._transformcreator = this._transformcreator || this._$element.find('[data-create="transform"]');

    var options = views.map(function( view ) {
        return '<option value="'+ view.getId() +'">'+ view.getName() +'</option>';
    });

    this._transformcreator[ 0 ].reset();
    this._transformcreator.find('[name="view"]').val( view.getId() );
    this._transformcreator.find('[name="rules_attr"]').focus();
    this._transformcreator.find('[name="rules_from_selector"]').html( options );

    this._transformcreator.modal( 'show' );
};

UI.prototype.displayTransformEditor = function( transform, views ) {
    this._transformeditor = this._transformeditor || this._$element.find('[data-update="transform"]');

    var rules = transform.getRules();
    views.map(function( view ) {
      return '<option value="'+ view.getId() +'">'+ view.getName() +'</option>';
    });

    this._transformeditor[ 0 ].reset();
    this._transformeditor.find('[name="transform"]').val( transform.getId() );

    console.log( rules );

    /*
    this._transformeditor.find('[name="rules_attr"]').val( rules.attr ).focus();
    this._transformeditor.find('[name="rules_from_attr"]').val( rules.from.attr );
    this._transformeditor.find('[name="rules_from_node"]').val( rules.from.node );
    this._transformeditor.find('[name="rules_from_selector"]').val( rules.from.selector );
    this._transformeditor.find('[name="rules_when_relationship"]').val( rules.when.relationship );
    this._transformeditor.find('[name="rules_when_filter"]').val( rules.when.filter );
    */

    this._transformeditor.modal( 'show' );
};

// cards

UI.prototype.displayCard = function( view, card ) {
    var canvascard = new CanvasCard( this._queue, this, view, card );

    this._canvasview.addCard( canvascard );
};

UI.prototype.displayCardCreator = function( wall ) {
    this._cardcreator = this._cardcreator || this._$element.find('[data-create="card"]');

    this._cardcreator[ 0 ].reset();
    this._cardcreator.find('[name="wall"]').val( wall.getId() );
    this._cardcreator.find('[name="title"]').focus();

    this._cardcreator.modal( 'show' );
};

UI.prototype.displayCardEditor = function( card ) {
    this._cardeditor = this._cardeditor || this._$element.find('[data-update="card"]');

    this._cardeditor[ 0 ].reset();
    this._cardeditor.find('[name="card"]').val( card.getId() );
    this._cardeditor.find('[name="title"]').val( card.getTitle() ).focus();
    this._cardeditor.find('[name="content"]').val( card.getContent() );
    this._cardeditor.find('[name="wall"]').val( card.getWall() );

    this._cardeditor.modal( 'show' );
};

// regions

UI.prototype.setInRegionCreateMode = function() {
    this._$element.addClass( 'mode-create-region' );

    this.unsetInRegionDrawMode();

    this.inRegionCreateMode = true;
};

UI.prototype.unsetInRegionCreateMode = function() {
    this._$element.find( '[data-new="region"]' ).blur();

    this._$element.removeClass( 'mode-create-region' );

    this.inRegionCreateMode = false;
};

UI.prototype.setInRegionDrawMode = function() {
    this._$element.addClass( 'mode-draw-region' );

    this.unsetInRegionCreateMode();

    this.inRegionDrawMode = true;
};

UI.prototype.unsetInRegionDrawMode = function() {
    this._$element.removeClass( 'mode-draw-region' );

    this.inRegionDrawMode = false;
};

UI.prototype.setInNewCardDragMode = function() {
    this._$element.addClass( 'mode-draw-region' );

    this.inNewCardDragMode = true;
};

UI.prototype.unsetInNewCardDragMode = function() {
    this._$element.removeClass( 'mode-draw-region' );

    this.inNewCardDragMode = false;
};

UI.prototype.displayRegion = function( region ) {
    var canvasregion = new CanvasRegion( this._queue, this, region );

    this._canvasview.addRegion( canvasregion );
};

UI.prototype.displayRegionCreator = function( view ) {
    this._regioncreator = this._regioncreator || this._$element.find('[data-create="region"]');

    this._regioncreator[ 0 ].reset();
    this._regioncreator.find('[name="view"]').val( view.getId() );
    this._regioncreator.find('[name="label"]').focus();

    this._regioncreator.modal( 'show' );
};

UI.prototype.displayRegionEditor = function( region ) {
    this._regioneditor = this._regioneditor || this._$element.find('[data-update="region"]');

    this._regioneditor[ 0 ].reset();
    this._regioneditor.find('[name="region"]').val( region.getId() );
    this._regioneditor.find('[name="label"]').val( region.getLabel() ).focus();
    this._regioneditor.find('[name="value"]').val( region.getValue() );
    this._regioneditor.find('[name="color"]').val( region.getColor() );
    this._regioneditor.find('[name="view"]').val( region.getView() );

    this._regioneditor.modal( 'show' );
};

// walls

UI.prototype.displayWall = function( wall ) {
    var viewer = $('<div id="'+ wall.getId() +'" class="container" data-viewer="wall"> \
            <ul data-selector="view" class="nav nav-tabs"></ul> \
            <div class="tab-content" data-viewer="view"></div> \
        </div>');

    this._$element.find('[data-viewer="wall"]').replaceWith( viewer );
};

UI.prototype.displayWallCreator = function() {
    this._wallcreator = this._wallcreator || this._$element.find('[data-create="wall"]');

    this._wallcreator[ 0 ].reset();
    this._wallcreator.find('[name="name"]').focus();

    this._wallcreator.modal( 'show' );
};

UI.prototype.displayWallEditor = function( wall ) {
    this._walleditor = this._walleditor || this._$element.find('[data-update="wall"]');

    this._walleditor[ 0 ].reset();
    this._walleditor.find('[name="wall"]').val( wall.getId() );
    this._walleditor.find('[name="name"]').val( wall.getName() );

    this._walleditor.modal( 'show' );
};

UI.prototype.displayWallSelector = function( walls ) {
    this._wallselector = this._wallselector || this._$element.find('[data-selector="wall"]');

    var options = walls.map(function( wall ) {
        return '<a href="#'+ wall.getId() +'" class="list-group-item" data-display="wall" data-dismiss="modal">'+ wall.getName() +'</a>';
    });

    this._wallselector.find('[data-options="list"]').empty().append( options.join('') );

    this._wallselector.modal( 'show' );
};

// controls

UI.prototype.enable = function() {
  this._$element.removeClass( 'hide' );
};

UI.prototype.enableControls = function( view ) {
  this._$element.find('[data-new="card"]').removeAttr( 'disabled' ).data( 'parent', view.getWall() );
  this._$element.find('[data-new="region"]').removeAttr( 'disabled' ).data( 'parent', view.getId() );
  this._$element.find('[data-new="transform"]').removeAttr( 'disabled' ).data( 'parent', view.getId() );
};

module.exports = UI;






function trackClickTouchEventsFor( $element, ui, tasks ) {
  // e.g. on click or touch for [data-new="wall"] trigger 'wall:new' with id
  tasks.forEach(function( task ) {
      $element.on( 'click touch', '[data-'+ task +']', function( ev ) {
          var $el = $( this );
          var type = $el.data( task );

          if ( task === 'new' && type === 'card' ) {
            return;
          }

          ev.preventDefault();

          var target = type || $el.data( 'parent' ) || ( $el.attr( 'href' ) || '' ).replace( '#', '' );

          // console.log( 'EMIT', type + '.' + task, target );

          ui.emit( type + '.' + task, target );
      });
  });
}

function trackSubmitEventsFor( $element, ui, tasks ) {
  // e.g. on submit for [data-create="wall"] trigger 'wall:new' with ev
  tasks.forEach(function( task ) {
      $element.on( 'submit', '[data-'+ task +']', function( ev ) {
          var $el = $( this );
          var type = $el.data( task );

          ev.preventDefault();

          var data = {};
          var a = $el.serializeArray();
          a.forEach(function( pair ) {
              var key = pair.name, value = pair.value;

              if (data[ key ] !== undefined) {
                  if (!data[ key ].push) {
                      data[ key ] = [ data[ key ] ];
                  }
                  data[ key ].push(value || '');
              } else {
                  data[ key ] = value || '';
              }
          });

          var userToken = localStorage.getItem( 'userToken' );
          if ( userToken ) {
            data.user = userToken;
          }

          // console.log( 'EMIT', $(this).data( task ) + '.' + task, data );

          ui.emit( type + '.' + task, data );

          $el.modal( 'hide' );
      });
  });
}




function trackFileDropEvents( $body, ui) {
  $body
    .on( 'dragover', ( ev ) => ev.preventDefault() )
    .on( 'drop',     onFileDropRequest.bind( ui ) );
}

function onFileDropRequest( ev ) {
  var ui = this;

  ev.preventDefault();

  var files = ev.originalEvent.dataTransfer.files;
  if ( files.length ) {
    if ( typeof FileReader !== 'undefined' ) {
      files.forEach(function( file ) {
          var reader = new FileReader();

          reader.onload = function ( ev ) {
            if ( ev.target && ev.target.result ) {
              triggerFileDrop( file.type, ev.target.result );
            }
          };

          if ( ~file.type.indexOf( 'text' ) ) {
            return reader.readAsText( file );
          }

          reader.readAsArrayBuffer( file );
      });
    }

    return;
  }

  var items = ev.originalEvent.dataTransfer.items;
  items.forEach(function( item ) {
    item.getAsString(function ( result ) {
      triggerFileDrop( 'text/plain', result );
    });
  });

  function triggerFileDrop( filetype, data ) {
    ui.emit( 'card.create', {
      wall: $('[data-viewer="wall"]').attr( 'id' ),
      view: $('[data-viewer="view"]').attr( 'id' ),
      x: ev.clientX,
      y: ev.clientY,
      file: {
        type: filetype,
        data: data
      }
    });
  }
}




function trackNewCardEvents( $body, ui ) {
  $body
    .on( 'mousedown touchstart',  '[data-new="card"]',      newCardStart.bind( ui ) )      // will cancel the click
    .on( 'keydown',                                         withKey( 27, newCardCancel.bind( ui ) ) )
    .on( 'mousemove touchmove',                             newCardDrag.bind( ui ) )
    .on( 'mouseup touchend',                                newCardEnd.bind( ui ) );
}

var dragCard;
function newCardStart( evt ) {
  var ui = this;

  ui.setInNewCardDragMode();

  dragCard = $('<div class="drag-card"></div>').appendTo( document.body );

  newCardDrag( evt );

  evt.preventDefault();
}

function newCardCancel( /* evt */ ) {
  var ui = this;

  if ( !ui.inNewCardDragMode ) {
    return;
  }

  ui.unsetInNewCardDragMode();

  dragCard.remove();
  dragCard = false;
}

function newCardDrag( evt ) {
  var ui = this;

  if ( !ui.inNewCardDragMode ) {
    return;
  }

  var e = evt.originalEvent;
  dragCard.css({ left: getClientXCoordinate( e ) - ( 90 / 2 ), top: getClientYCoordinate( e ) - ( 60 / 2 ) });
}

function newCardEnd( /* evt */ ) {
  var ui = this;

  if ( !ui.inNewCardDragMode ) {
    return;
  }

  var position = dragCard.position();

  ui._canvasview.createCard({ clientX: position.left, clientY: position.top });

  dragCard.remove();
  dragCard = false;

  ui.unsetInNewCardDragMode();
}




function trackNewRegionEvents( $body, ui ) {
  $body
    .on( 'click', '[data-new="region"]',                    newRegionRequest.bind( ui ) )
    .on( 'mousedown touchstart',                            newRegionStart.bind( ui ) )
    .on( 'keydown',                                         withKey( 27, newRegionCancel.bind( ui ) ) )
    .on( 'mousemove touchmove',                             newRegionDrag.bind( ui ) )
    .on( 'mouseup touchend',                                newRegionEnd.bind( ui ) )
    .on( 'newRegionRequest',                                newRegionRequest.bind( ui ) );
}

var newRegionTracker = {

  startFromEvent: function( e ) {
    this.x = this.xx =getClientXCoordinate( e );
    this.y = this.yy = getClientYCoordinate( e );

    return this;
  },

  updateFromEvent: function( e ) {
    this.xx = getClientXCoordinate( e );
    this.yy = getClientYCoordinate( e );

    return this;
  },

  getCoordinates: function() {
    return {
      x: this.x,
      y: this.y,
      xx: this.xx,
      yy: this.yy,
    };
  }

};





var outline = false;
function newOutline( ui, evt ) {
  var scale = stage.getScale().x;
  var startPointer = plotPointer( { x: evt.x, y: evt.y }, stage, scale );

  outline = new Kinetic.Rect({
      x: startPointer.x,
      y: startPointer.y,
      width: 1,
      height: 1,
      strokeWidth: 1,
      stroke: '#bcd',
      opacity: 0.7
  });
  regionLayer.add( outline );

  stage.batchDraw();
}
function updateOutline( stage, evt ) {
  var scale = stage.getScale().x;
  var startPointer = plotPointer( { x: evt.x, y: evt.y }, stage, scale );
  var endPointer = plotPointer( { x: evt.xx, y: evt.yy }, stage, scale );

  var left = startPointer.x <= endPointer.x ? startPointer.x : endPointer.x;
  var right = startPointer.x > endPointer.x ? startPointer.x : endPointer.x;
  var top = startPointer.y >= endPointer.y ? startPointer.y : endPointer.y;
  var bottom = startPointer.y < endPointer.y ? startPointer.y : endPointer.y;

  outline.setX( left );
  outline.setY( top );
  outline.setWidth( right - left );
  outline.setHeight( bottom - top );

  stage.batchDraw();
}
function removeOutline( stage ) {
  outline.remove();
  outline = false;

  stage.batchDraw();
}





function newRegionRequest( /* evt */ ) {
  var ui = this;
  ui.setInRegionCreateMode();
}

function newRegionStart( evt ) {
  var ui = this;

  if ( !ui.inRegionCreateMode ) {
    return;
  }

  newOutline( ui, newRegionTracker.startFromEvent( evt.originalEvent ).getCoordinates() );

  ui.setInRegionDrawMode();

  evt.preventDefault();
}

function newRegionCancel( /* evt */ ) {
  var ui = this;

  if ( !ui.inRegionCreateMode && !ui.inRegionDrawMode ) {
    return;
  }

  ui.unsetInRegionCreateMode();

  newRegionComplete( ui );
}

function newRegionDrag( evt ) {
  var ui = this;

  if ( !ui.inRegionDrawMode ) {
    return;
  }

  updateOutline( ui, newRegionTracker.updateFromEvent( evt.originalEvent ).getCoordinates() );
}

function newRegionEnd( evt ) {
  var ui = this;

  if ( !ui.inRegionDrawMode ) {
    return;
  }

  ui._canvasview.createRegion( newRegionTracker.updateFromEvent( evt.originalEvent ).getCoordinates() );

  newRegionComplete( ui );
}

function newRegionComplete( ui ) {
  removeOutline( ui );

  ui.unsetInRegionDrawMode();
}





// helpers

function getClientXCoordinate( e ) {
  return getClientCoordinate( e, 'X' );
}

function getClientYCoordinate( e ) {
  return getClientCoordinate( e, 'Y' );
}

function getClientCoordinate( e, c ) {
  var prop = 'client' + c;

  return e[ prop ] || e.changedTouches && e.changedTouches.length && e.changedTouches[ 0 ][ prop ] || 0;
}

function withKey( keycode, fn ) {
  return function( evt ) {
    if ( evt.keyCode === keycode ) {
      fn( evt );
    }
  };
}
