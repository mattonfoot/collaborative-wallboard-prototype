define(function() {

    // factory

    function CardFactory( data, queue ) {
        if ( data instanceof Card ) {
            return data;
        }

        // instance

        return new Card( data, queue );
    }

    // constructor

    function Card( data, queue ) {
        for ( var prop in data ) {
            if ( prop === 'links' ) continue;

            this[prop] = data[prop];
        }

        for ( var link in data.links ) {
            this[link] = data.links[link];
        }

        this.constructor = Card;

        var card = this;

        queue
          .on( this, 'canvascard:moved', function( data ) {
            if ( card.id === data.card.id &&
                ( card.x != data.x || card.y != data.y ) ) {
              card.moveTo( data.x, data.y );
            }
          })
          .on( this, 'card:moved', function( data ) {
            if ( card.id === data.id &&
                ( card.x != data.x || card.y != data.y ) ) {
              card.moveTo( data.x, data.y );
            }
          })
          .on( this, 'card:updated', function( data ) {
            if ( card.id === data.id &&
                ( card.x != data.x || card.y != data.y ) ) {
              card.moveTo( data.x, data.y );
            }
          });
    }

    // prototype

    Card.prototype = {

        constructor: Card,

        getId: function() {
          return this.id;
        },

        getPocket: function() {
          return this.pocket;
        },

        getBoard: function() {
          return this.board;
        },

        getPosition: function() {
            return {
                board: this.board,
                x: this.x,
                y: this.y
            };
        },

        moveTo: function( x, y ) {
            if ( this.x === x && this.y === y ) {
                return false;
            }

            this.x = x;
            this.y = y;

            return true;
        }
    };

    // export

    return CardFactory;

});
