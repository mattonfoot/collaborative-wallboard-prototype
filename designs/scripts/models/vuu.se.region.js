define(function() {

    // factory

    function RegionFactory( data, queue ) {
        if ( data instanceof Region ) {
            return data;
        }

        // instance

        return new Region( data, queue );
    }

    // constructor

    function Region( data, queue ) {
        for ( var prop in data ) {
            if ( prop === 'links' ) continue;

            this[prop] = data[prop];
        }

        this.pockets = [];

        for ( var link in data.links ) {
            this[link] = data.links[link];
        }

        this.constructor = Region;

        var region = this;

        queue
          .on( this, 'canvasregion:moved', function( data ) {
            if ( region.id === data.region.id &&
                ( region.x != data.x || region.y != data.y ) ) {
              region.moveTo( data.x, data.y );
            }
          })
          .on( this, 'canvasregion:resized', function( data ) {
            if ( region.id === data.region.id &&
                ( region.width != data.width || region.height != data.height ) ) {
              region.resizeTo( data.width, data.height );
            }
          })
          .on( this, 'region:updated', function( data ) {
            if ( region.id === data.id &&
                ( region.width != data.width || region.height != data.height || region.x != data.x || region.y != data.y ) ) {
              region.moveTo( data.x, data.y );
              region.resizeTo( data.width, data.height );
            }
          });
    }

    // prototype

    Region.prototype = {

        constructor: Region,

        getId: function() {
          return this.id;
        },

        getName: function() {
          return this.name;
        },

        getColor: function() {
          return this.color;
        },

        getValue: function() {
          return this.color;
        },

        getBoard: function() {
          return this.board;
        },

        moveTo: function( x, y ) {
            if ( this.x === x && this.y === y ) {
                return false;
            }

            this.x = x;
            this.y = y;

            return true;
        },

        resizeTo: function( width, height ) {
            if ( this.width === width && this.height === height ) {
                return false;
            }

            this.width = width;
            this.height = height;

            return true;
        }
    };

    // export

    return RegionFactory;

});
