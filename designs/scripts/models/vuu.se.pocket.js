define(function() {

    // factory

    function PocketFactory( data ) {
        if ( data instanceof Pocket ) {
            return data;
        }

        // instance

        return new Pocket( data );
    }

    // constructor

    function Pocket( data ) {
        for ( var prop in data ) {
            if ( prop === 'links' ) continue;

            this[prop] = data[prop];
        }

        this.cards = [];
        this.regions = [];

        for ( var link in data.links ) {
            this[link] = data.links[link];
        }

        this.constructor = Pocket;
    }

    // prototype

    Pocket.prototype = {

        constructor: Pocket,

        getId: function() {
            return this.id;
        },

        getTitle: function() {
            return this.title;
        },

        getCardNumber: function() {
            return this.cardnumber;
        },

        getContent: function() {
            return this.content;
        },

        getTags: function() {
            return this.tags;
        },

        getMentions: function() {
            return this.mentions;
        },

        getWall: function() {
            return this.wall;
        },

        getRegion: function( index ) {
            return this.regions[ index ];
        },

        addRegion: function( region ) {
            if ( this.getRegionById( region.id ) ) {
                return false; // we already have it
            }

            this.regions.push( region.id );

            return true;
        },

        getCard: function( index ) {
            return this.cards[ index ];
        },

        addCard: function( card ) {
            if ( this.getCardById( card.id ) ) {
                return false; // we already have it
            }

            this.cards.push( card );

            return true;
        }

    };

    // export

    return PocketFactory;

});
