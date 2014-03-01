





// example plugin

vuu.se.plugins.register(function( app, queue, socket ) {

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