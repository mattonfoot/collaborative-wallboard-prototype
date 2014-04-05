define(function() {

    // factory

    function WallFactory( data ) {
        if ( data instanceof Wall ) {
            return data;
        }

        // instance

        return new Wall( data );
    }

    // constructor

    function Wall( data ) {
        for ( var prop in data ) {
            if ( prop === 'links' ) continue;

            this[prop] = data[prop];
        }

        this.boards = [];
        this.pockets = [];

        for ( var link in data.links ) {
            this[link] = data.links[link];
        }

        this.shelf = {};

        this.constructor = Wall;
    }

    // prototype

    Wall.prototype = {

        constructor: Wall,

        getId: function() {
            return this.id;
        },

        getName: function() {
            return this.name;
        },

        getBoard: function( index ) {
            return this.boards[ index ];
        },

        getActiveBoard: function() {
            return this.activeboard;
        },

        addBoard: function( board ) {
            if ( ~this.boards.indexOf( board.id ) ) {
                return false;
            }

            this.boards.push( board.id );

            return true;
        },

        setActiveBoardById: function( id ) {
            if ( ~this.boards.indexOf( id ) && this.activeboard !== id ) {
                this.activeboard = id;

                return true;
            }

            return false;
        },

        getPocket: function( index ) {
            return this.pockets[ index ];
        },

        addPocket: function( pocket ) {
            if ( ~this.pockets.indexOf( pocket.id ) ) {
                return false;
            }

            this.pockets.push( pocket.id );

            return true;
        }
    };

    // exports

    return WallFactory;

});
