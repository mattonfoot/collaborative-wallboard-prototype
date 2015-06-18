

function UI() {
    this.element = $('#app');
    this.footer = this.element.find('footer');

    var instance = this;
    instance.size = calculateHeight( $(window), instance.element, instance.footer );

    setInterval( function() {
        var newSize = calculateHeight( $(window), instance.element, instance.footer);

        if ( newSize.width !== instance.resize.width ||
                newSize.height !== instance.resize.height ) {
          instance.size = newSize;

          instance.resize();
        }

    }, 10);

};

UI.prototype = {

    constructor: UI,

    // user interface

    resize: function() {
        var instance = this;

        instance.viewer.css( 'height', instance.size.height );

        $.each( this.hypermedia.canvasboards, function () {
            this.setWidth( instance.size.width );
            this.setHeight( instance.size.height );
        });
    },

};

var app = new UI();
