define(function() {

    function initialize( app ) {

        vuu.se.plugins.register(function( app, queue ) {

          return {

            name: 'displayColorTag',

            description: 'Displays a colored tag on a card when its pocket data has a color value set',

            keys: [ 'color' ],

            process: function( pocket, cards, key, value ) {
              cards.forEach(function( card ) {
                if ( !!value ) {
                  return card.tag( value );
                }

                return card.untag();
              });
            }

          };

        });
        
    }

    return {
        initialize: initialize
    };

});
