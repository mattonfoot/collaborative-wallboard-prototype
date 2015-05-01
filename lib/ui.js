var CanvasView = require('./shapes/view')
  , CanvasCard = require('./shapes/card')
  , CanvasRegion = require('./shapes/region');


function UI( queue, $element, options, $ ) {
    this._queue = queue;

    this._$element = $element;

    this._size = {
        height: $(window).innerHeight(),
        width: $(window).innerWidth()
    };

    this.constructor = UI;

    var clicks = [ 'new', 'edit', 'select', 'display', 'unlink' ];

    // e.g. on click or touch for [data-new="wall"] trigger 'wall:new' with id
    // e.g. on click or touch for [data-edit="view"] trigger 'view:edit' with id

    clicks.forEach(function( task ) {
        $element.on( 'click touch', '[data-'+ task +']', function( ev ) {
            ev.preventDefault();

            var type = $(this).data( task );

            var target = $(this).data( type ) || $(this).data('parent') || ( $(this).attr('href') || '' ).replace('#', '');

            queue.publish( type + '.' + task, target );
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

            queue.publish( $(this).data( task ) + '.' + task, data );
        });
    });

    var ui = this;
    queue.subscribe('#.fail', function( error ) {
      console.log( error );
    });
}

UI.prototype.displayView = function( view ) {
    var viewer = '<div id="'+ view.getId() +'" class="tab-content" data-viewer="view"></div>';

    this._$element.find('[data-viewer="view"]').replaceWith( viewer );

    this._canvasview = new CanvasView( this._queue, view, this._size );
    this._canvascards = [];
    this._canvasregions = [];
};

UI.prototype.displayViewCreator = function( wall ) {
    this._viewcreator = this._viewcreator || this._$element.find('[data-create="view"]');

    this._viewcreator[0].reset();
    this._viewcreator.find('[name="wall"]').val( wall.getId() );

    this._viewcreator.modal( 'show' );
};

UI.prototype.displayViewEditor = function( view ) {
    this._vieweditor = this._vieweditor || this._$element.find('[data-update="view"]');

    this._vieweditor[0].reset();
    this._vieweditor.find('[name="id"]').val( view.getId() );
    this._vieweditor.find('[name="name"]').val( view.getName() );
    this._vieweditor.find('[name="transform"]').val( view.getWall() );
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

// cardlocations

UI.prototype.displayCardLocation = function( cardlocation, card ) {
    var canvascard = new CanvasCard( this._queue, cardlocation, card );

    this._canvasview.addCard( canvascard );
};

UI.prototype.displayCardCreator = function( wall ) {
    this._cardcreator = this._cardcreator || this._$element.find('[data-create="card"]');

    this._cardcreator[0].reset();
    this._cardcreator.find('[name="wall"]').val( wall.getId() );

    this._cardcreator.modal( 'show' );
};

UI.prototype.displayCardEditor = function( card ) {
    this._cardeditor = this._cardeditor || this._$element.find('[data-update="card"]');

    this._cardeditor[0].reset();
    this._cardeditor.find('[name="id"]').val( card.getId() );
    this._cardeditor.find('[name="title"]').val( card.getTitle() );
    this._cardeditor.find('[name="content"]').val( card.getContent() );
    this._cardeditor.find('[name="tags"]').val( card.getTags() );
    this._cardeditor.find('[name="mentions"]').val( card.getMentions() );
    this._cardeditor.find('[name="wall"]').val( card.getWall() );

    this._cardeditor.modal( 'show' );
};

// regions

UI.prototype.displayRegion = function( region ) {
    var canvasregion = new CanvasRegion( this._queue, region );

    this._canvasview.addRegion( canvasregion );
};

UI.prototype.displayRegionCreator = function( view ) {
    this._regioncreator = this._regioncreator || this._$element.find('[data-create="region"]');

    this._regioncreator[0].reset();
    this._regioncreator.find('[name="view"]').val( view.getId() );

    this._regioncreator.modal( 'show' );
};

UI.prototype.displayRegionEditor = function( region ) {
    this._regioneditor = this._regioneditor || this._$element.find('[data-update="region"]');

    this._regioneditor[0].reset();
    this._regioneditor.find('[name="id"]').val( region.getId() );
    this._regioneditor.find('[name="label"]').val( region.getLabel() );
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

    this._wallcreator.modal( 'show' );
};

UI.prototype.displayWallEditor = function( wall ) {
    this._walleditor = this._walleditor || this._$element.find('[data-update="wall"]');

    this._walleditor[0].reset();
    this._walleditor.find('[name="id"]').val( wall.getId() );
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

UI.prototype.enableControls = function() {
    this._$element.find('[data-new]:disabled').removeAttr( 'disabled' );
};

module.exports = UI;
