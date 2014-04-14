define(function() {

    function initialize( app ) {
        app.element.on( 'mouseup touchend', '.add-region', triggerAddRegion );

        function triggerAddRegion( e ) {
            var name = prompt( 'Please provide a value for this region', '' );

            if (name === '') {
                return;
            }

            var data = {
                regions: [
                    {
                        x: 10,
                        y: 10,
                        width: 250,
                        height: 150,
                        board: app.activewall.getActiveBoard(),
                        name: name,
                        value: "",
                        color: ""
                    }
                ]
            };

            $.ajax({
                    url: '/regions/',
                    dataType: "json",
                    contentType: "application/json;charset=utf-8",
                    type: "POST",
                    data: JSON.stringify( data )
                });
        }

    }

    return {
        initialize: initialize
    };

});
