function init( app ) {
    var regionalcards = {};

    var cardHeight = 65;
    var cardWidth = 100;

    function cardIsInRegion( card, region ) {
        var cardX = (card.x + (cardHeight / 2))
          , cardY = (card.y + (cardWidth / 2))
          , inLeft = cardX > region.x
          , inRight = cardX < (region.x + region.width)
          , inTop = cardY > region.y
          , inBase = cardY < (region.y + region.height);

        return ( inLeft && inRight && inTop && inBase );
    };

    function markPocketAsInRegion( pocketid, region ) {
        app.hypermedia.pocket
            .get( pocketid )
            .then(function( pocket ) {
                pocket.links.regions = pocket.links.regions || [];

                var index = pocket.links.regions.indexOf( region.id );

                if ( index < 0 ) {
                    pocket.links.regions.push( region.id );

                    app.hypermedia.pocket
                        .update( pocket )
                        .then(function() {
                            pocket.id = pocketid;

                            app.queue.emit( 'pocket:regionenter', { pocket: pocket, region: region } );
                        });

                }
            });
    }

    function markPocketAsNotInRegion( pocketid, region ) {
        app.hypermedia.pocket
            .get( pocketid )
            .then(function( pocket ) {
                pocket.links.regions = pocket.links.regions || [];

                var index = pocket.links.regions.indexOf( region.id );

                if ( index >= 0 ) {
                    pocket.links.regions.splice( index, 1 );

                    app.hypermedia.pocket
                        .update( pocket )
                        .then(function() {
                            pocket.id = pocketid;

                            app.queue.emit( 'pocket:regionexit', { pocket: pocket, region: region } );
                        });
                }
            });
    }

    app.queue.on( 'card:moved', trackCardMovement);
    app.queue.on( 'card:updated', trackCardMovement);

    function trackCardMovement( card ) {
        app.hypermedia.board
            .get( card.links.board )
            .then(function( board ) {
                return app.hypermedia.region
                    .search( board.links.regions );
            })
            .then(function( regions ) {
                regions.forEach(function( region ) {
                    if ( !cardIsInRegion( card, region ) ) {
                        markPocketAsNotInRegion( card.links.pocket, region );
                    }
                });

                return regions;
            })
            .then(function( regions ) {
                regions.forEach(function( region ) {
                    if ( cardIsInRegion( card, region ) ) {
                        markPocketAsInRegion( card.links.pocket, region );
                    }
                });
            });
    }

    app.queue.on( 'region:moved', trackRegionMovement);
    app.queue.on( 'region:updated', trackRegionMovement);

    function trackRegionMovement( region ) {
        app.hypermedia.board
            .get( region.links.board )
            .then(function( board ) {
                return app.hypermedia.card
                    .search( board.links.cards );
            })
            .then(function( cards ) {
                cards.forEach(function( card ) {
                    if ( !cardIsInRegion( card, region ) ) {
                        markPocketAsNotInRegion( card.links.pocket, region );
                    }
                });

                return regions;
            })
            .then(function( cards ) {
                cards.forEach(function( card ) {
                    if ( cardIsInRegion( card, region ) ) {
                        markPocketAsInRegion( card.links.pocket, region );
                    }
                });
            });
    }
}

module.exports = {
    init: init
}
