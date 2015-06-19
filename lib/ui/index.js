var CanvasView = require('./shapes/view'),
    CanvasCard = require('./shapes/card'),
    CanvasRegion = require('./shapes/region'),
    events = require('events'),
    util = require('util');

function UI( queue, $element, options, $ ) {
    var ui = this;
    var queue = this._queue = queue;

    this._$element = $element;
    this._$navbar = $element.find('> .navbar');

    this._size = calculateHeight( $(window), this._$element, this._$navbar );

    this.constructor = UI;

    events.EventEmitter.call( this );

    var clicks = [ 'new', 'edit', 'select', 'display', 'unlink' ];

    // e.g. on click or touch for [data-new="wall"] trigger 'wall:new' with id
    // e.g. on click or touch for [data-edit="view"] trigger 'view:edit' with id
    clicks.forEach(function( task ) {
        $element.on( 'click touch', '[data-'+ task +']', function( ev ) {
            ev.preventDefault();

            var type = $(this).data( task );

            var target = $(this).data( type ) || $(this).data('parent') || ( $(this).attr('href') || '' ).replace('#', '');

            // console.log( 'EMIT', type + '.' + task, target );

            ui.emit( type + '.' + task, target );
        });
    });

    var submits = [ 'create', 'update' ];

    // e.g. on submit for [data-create="wall"] trigger 'wall:new' with ev

    submits.forEach(function( task ) {
        $element.on( 'submit', '[data-'+ task +']', function( ev ) {
            ev.preventDefault();

            var data = {};
            var a = $(this).serializeArray();
            a.forEach(function( pair ) {
                var key = pair.name, value = pair.value;

                if (data[key] !== undefined) {
                    if (!data[key].push) {
                        data[key] = [data[key]];
                    }
                    data[key].push(value || '');
                } else {
                    data[key] = value || '';
                }
            });

            var userToken = localStorage.getItem( 'userToken' );
            if ( userToken ) {
              data.user = userToken;
            }

            // console.log( 'EMIT', $(this).data( task ) + '.' + task, data );

            ui.emit( $(this).data( task ) + '.' + task, data );

            $(this).modal('hide');
        });
    });

    queue.subscribe('#.fail', function( error ) {
      console.log( error );
    });

    setInterval(function() {
      var cur_size = ui._size;
      ui._size = calculateHeight( $(window), ui._$element, ui._$navbar );

      if ( cur_size.width !== ui._size.width || cur_size.height !== ui._size.height ) {
        if (ui._canvasview) ui._canvasview.resize( ui._size );
      }
    }, 10);
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

    this._viewcreator[0].reset();
    this._viewcreator.find('[name="wall"]').val( wall.getId() );

    this._viewcreator.modal( 'show' );
};

UI.prototype.displayViewEditor = function( view, views ) {
    this._vieweditor = this._vieweditor || this._$element.find('[data-update="view"]');

    this._vieweditor[0].reset();
    this._vieweditor.find('[name="view"]').val( view.getId() );
    this._vieweditor.find('[name="name"]').val( view.getName() );
    this._vieweditor.find('[name="wall"]').val( view.getWall() );

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

    this._transformcreator[0].reset();
    this._transformcreator.find('[name="view"]').val( view.getId() );
    this._transformcreator.find('[name="rules_attr"]').focus();
    this._transformcreator.find('[name="rules_from_selector"]').html( options );

    this._transformcreator.modal( 'show' );
};

UI.prototype.displayTransformEditor = function( transform, views ) {
    this._transformeditor = this._transformeditor || this._$element.find('[data-update="transform"]');

    var rules = transform.getRules();
    var options = views.map(function( view ) {
        return '<option value="'+ view.getId() +'">'+ view.getName() +'</option>';
    });

    this._transformeditor[0].reset();
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

    this._cardcreator[0].reset();
    this._cardcreator.find('[name="wall"]').val( wall.getId() );
    this._cardcreator.find('[name="title"]').focus();

    this._cardcreator.modal( 'show' );
};

UI.prototype.displayCardEditor = function( card ) {
    this._cardeditor = this._cardeditor || this._$element.find('[data-update="card"]');

    this._cardeditor[0].reset();
    this._cardeditor.find('[name="card"]').val( card.getId() );
    this._cardeditor.find('[name="title"]').val( card.getTitle() ).focus();
    this._cardeditor.find('[name="content"]').val( card.getContent() );
    this._cardeditor.find('[name="tags"]').val( card.getTags() );
    this._cardeditor.find('[name="mentions"]').val( card.getMentions() );
    this._cardeditor.find('[name="wall"]').val( card.getWall() );

    this._cardeditor.modal( 'show' );
};

// regions

UI.prototype.displayRegion = function( region ) {
    var canvasregion = new CanvasRegion( this._queue, this, region );

    this._canvasview.addRegion( canvasregion );
};

UI.prototype.displayRegionCreator = function( view ) {
    this._regioncreator = this._regioncreator || this._$element.find('[data-create="region"]');

    this._regioncreator[0].reset();
    this._regioncreator.find('[name="view"]').val( view.getId() );
    this._regioncreator.find('[name="label"]').focus();

    this._regioncreator.modal( 'show' );
};

UI.prototype.displayRegionEditor = function( region ) {
    this._regioneditor = this._regioneditor || this._$element.find('[data-update="region"]');

    this._regioneditor[0].reset();
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

    this._wallcreator[0].reset();
    this._wallcreator.find('[name="name"]').focus();

    this._wallcreator.modal( 'show' );
};

UI.prototype.displayWallEditor = function( wall ) {
    this._walleditor = this._walleditor || this._$element.find('[data-update="wall"]');

    this._walleditor[0].reset();
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
}

UI.prototype.enableControls = function( view ) {
  this._$element.find('[data-new="card"]').removeAttr( 'disabled' ).data( 'parent', view.getWall() );
  this._$element.find('[data-new="region"]').removeAttr( 'disabled' ).data( 'parent', view.getId() );
  this._$element.find('[data-new="transform"]').removeAttr( 'disabled' ).data( 'parent', view.getId() );
};

module.exports = UI;







function calculateHeight( $window, $container, $footer ) {
    return {
        height: $window.innerHeight() - $footer.innerHeight() - $container.position().top
      , width: $container.innerWidth()
    };
}
