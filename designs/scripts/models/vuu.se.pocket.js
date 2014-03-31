
// event <--

// event --> pocket:updated

define(function() {

    var Pocket = (function() {

        function Pocket( queue, data ) {
            var pocket = this;

            pocket.id = data.id;
            pocket.title = data.title;
            pocket.links = data.links || {};
            pocket.cardnumber = data.cardnumber;
            pocket.content = data.content;
            pocket.tags = data.tags;
            pocket.mentions = pocket.mentions;

            // public functions

            pocket.getId = function() {
                return pocket.id;
            };

            pocket.addRegion = function( regionid ) {
                var regions = pocket.links.regions;

                if ( regions.indexOf( regionid ) < 0 ) {
                    regions.push( regionid );

                    return true;
                }

                return false;
            };

            pocket.getRegions = function() {
                return pocket.links.regions;
            }

            // instance

            return pocket;
        }

        // Factory

        return Pocket;

    })();

    // export

    return Pocket;

});
