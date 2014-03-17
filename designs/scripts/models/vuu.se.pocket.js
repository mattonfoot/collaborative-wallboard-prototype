
// event <--

// event --> pocket:updated

define(function() {

    var Pocket = (function() {

        function Pocket( queue, data ) {
            var pocket = this;

            pocket.id = data.id;
            pocket.title = data.title;
            pocket.cardnumber = data.cardnumber;

            var databag = {};

            // public functions

            pocket.getId = function() {
              return pocket.id;
            };

            pocket.set = function( key, value ) {
              var data = {
                pocket: this,
                key: key,
                value: value
              };

              databag[ data.key ] = data.value;

              queue.trigger( this, 'pocket:updated', data );

              return pocket;
            };

            pocket.get = function( key ) {
              return databag[ key ];
            };

            pocket.getData = function() {
              var d = {};

              for ( var key in databag ) {
                d[ key ] = databag[ key ];
              }

              return d;
            };

            // instance

            return pocket;
        }

        // Factory

        return Pocket;

    })();

    // export

    return Pocket;

});
