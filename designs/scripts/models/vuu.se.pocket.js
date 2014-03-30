
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

            var regions = pocket.links.regions;

            // public functions

            pocket.getId = function() {
                return pocket.id;
            };

            pocket.addRegion = function( regionid ) {
                if ( regions.indexOf( regionid ) < 0 ) {
                    regions.push( regionid );

                    return true;
                }

                return false;
            };

            pocket.getRegions = function() {
                return regions;
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
