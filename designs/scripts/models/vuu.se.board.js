
// event <--

// event --> board:activated, board:deactivated

define(function() {

    var Board = (function() {

        // constructor

        function Board( queue, data ) {
            var board = this;

            this.id = data.id;
            this.key = data.key;

            var regions = this.regions = [];
            var cards = this.cards = [];
            var shelf;

            // public functions

            board.getId = function() {
                return board.id;
            };

            board.getKey = function() {
                return board.key;
            };

            board.addRegion = function( region ) {
              if ( board.getRegionById( region.id ) ) {
                return false; // we already have it
              }

              regions.push( region );

              return true;
            };

            board.getRegion = function( index ) {
              return regions[ index ];
            };

            board.getRegionById = function( id ) {
              var result;

              regions.forEach(function( region ) {
                if ( region.getId() == id ) {
                  result = region;
                }
              });

              return result;
            };

            board.addCard = function( card ) {
              if ( board.getCardById( card.id ) ) {
                return false; // we already have it
              }

              cards.push( card );

              return true;
            };

            board.getCard = function( index ) {
              return cards[ index ];
            };

            board.getCardById = function( id ) {
              var result;

              cards.forEach(function( card ) {
                if ( card.getId() == id ) {
                  result = card;
                }
              });

              return result;
            };

            board.addShelf = function( s ) {
              if ( board.getShelf() ) {
                return false; // we already one
              }

              shelf = s;

              return true;
            };

            board.getShelf = function( index ) {
              return shelf;
            };

            // instance

            return this;
        }

        // Factory

        return Board;

    })();

// export

return Board;

});
