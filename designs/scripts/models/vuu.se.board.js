define(function() {

    // factory

    function BoardFactory( data ) {
        if ( data instanceof Board ) {
            return data;
        }

        // instance

        return new Board( data );
    }

    // constructor

    function Board( data ) {
        for ( var prop in data ) {
            if ( prop === 'links' ) continue;

            this[prop] = data[prop];
        }

        this.cards = [];
        this.regions = [];

        for ( var link in data.links ) {
            this[link] = data.links[link];
        }

        this.shelf = {};

        this.constructor = Board;
    }

    // prototype

    Board.prototype = {

        constructor: Board,

        getId: function() {
            return this.id;
        },

        getName: function() {
            return this.name;
        },

        getTransform: function() {
            return this.transform;
        },

        getWall: function() {
            return this.wall;
        },

        getRegion: function( index ) {
            return this.regions[ index ];
        },

        addRegion: function( region ) {
            if ( ~this.regions.indexOf( region.id ) ) {
                return false;
            }

            this.regions.push( region.id );

            return true;
        },

        getCard: function( index ) {
            return this.cards[ index ];
        },

        addCard: function( card ) {
            if ( ~this.cards.indexOf( card.id ) ) {
                return false;
            }

            this.cards.push( card.id );

            return true;
        },

        getShelf: function() {
          return this.shelf;
        },

        addShelf: function( shelf ) {
            if ( this.shelf ) {
                return false;
            }

            this.shelf = shelf;

            return true;
        }

    };

    // export

    return BoardFactory;

});
