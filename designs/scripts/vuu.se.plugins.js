
var vuu = vuu || {};
vuu.se = vuu.se || {};

define(function() {

function initialize( app ) {
  var socket = app.socket
    , queue = app.queue;

  vuu.se.plugins = (function() {

      var plugins = {};

      function PluginRegistry() {
      };

      // private

      function appliesToKey( plugin, key ) {
        if (plugin.keys && plugin.keys.indexOf( key ) < 0) {
          return false; // ignore any plugin that is limited to other plugins
        }

        return true;
      };

      // public

      PluginRegistry.prototype.register = function( pluginfactory ) {
        // this can only be called when the app is initiated or app will be undefined
        /*

          if ( !appinitiated ) {
            parked.push( pluginfactory );

            return;
          }

        */


        var plugin = pluginfactory( app, queue );

        var name = plugin.name;
        var oldPlugin = plugins[name];

        if (oldPlugin) {
          console.log( 'Skipped plugin [' + name + '] as that plugin is already loaded' );

          return this;
        }

        plugins[name] = plugin;

        return this;
      };

      PluginRegistry.prototype.process = function( pocketid, key, value ) {
        var pocket = app.wall.getPocketById( pocketid );
        var cards = [];

        app.wall.links.boards.forEach(function( board ) {
          board.cards.forEach(function( card ) {
            if ( card.links.pocket == pocketid ) {
              cards.push( card );
            }
          });
        });

        for (var name in plugins) {
          var plugin = plugins[ name ];

          if ( appliesToKey( plugin, key ) ) {
            plugin.process( pocket, cards, key, value );
          }
        }

        return this;
      };

      function __updatePocket( data ) {
        registry.process( data.pocket, data.key, data.value );
      }

      var registry = new PluginRegistry();

      queue.on( registry, 'pocket:update', __updatePocket);

      return registry;

    })();
}

return {
  initialize: initialize
};

});
