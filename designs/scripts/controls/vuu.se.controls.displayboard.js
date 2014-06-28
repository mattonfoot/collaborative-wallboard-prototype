define(function() {

    function initialize( app ) {
        app.element.on( 'shown.bs.tab', '[data-toggle="tab"]', activateBoard );

        function activateBoard(e) {
            var hash = e.target.hash
              , boardid = hash.substr( 1, hash.length - 1 );

            app.activateBoardById( boardid );
        }

    }

    return {
        initialize: initialize
    };

});
