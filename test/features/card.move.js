module.exports = function( should, RSVP, Promise, debug, queue, ui, application, belt, services ) {

    describe('Card:Move', function() {

        describe('Moving a card on an empty board', function() {
            var storedId, storedWallId, storedLocationId
              , storedTitle = 'card for moving'
              , destination = { x: 200, y: 200 };

            before(function(done) {
                queue
                    .once('board:created', function( wall ) {
                        done();
                    });

                services.createWall( { name: 'card movement wall' } )
                    .then( addBoardToNewWall );

                function addBoardToNewWall( wall ) {
                    storedWallId = wall.getId();

                    return services.createBoard( { wall: storedWallId, name: 'card movement board' } );
                }
            });

            it('Updates the location', function(done) {
                application.pauseListenting();

                services
                    .displayWall( storedWallId )
                    .catch( done );

                function addPocketToNewWall() {
                    application.startListening();

                    queue.on('cardlocation:created', startFixture );

                    return services
                        .createPocket( { wall: storedWallId, title: storedTitle } )
                        .then(function( pocket ) {
                            storedId = pocket.getId();
                        });
                }

                function startFixture( location ) {
                    should.exist( location );

                    location.should.respondTo( 'getId' );
                    location.should.respondTo( 'getPocket' );
                    location.getPocket().should.be.equal( storedId );

                    storedLocationId = location.getId();

                    queue.clearCalls();

                    queue.once( 'cardlocation:updated', endFixture);

                    location.x = destination.x;
                    location.y = destination.y;

                    queue.trigger( 'cardlocation:move', location);
                }

                function endFixture( location ) {
                    should.exist( location );

                    location.should.respondTo( 'getId' );
                    location.getId().should.be.equal( storedLocationId );
                    location.should.respondTo( 'getX' );
                    location.getX().should.be.equal( destination.x );
                    location.should.respondTo( 'getY' );
                    location.getY().should.be.equal( destination.y );

                    var calls = queue.getCalls();

                    calls.length.should.be.above( 1 );

                    calls[0].event.should.be.equal( 'cardlocation:move' );
                    calls[1].event.should.be.equal( 'cardlocation:updated' );

                    done();
                }
            });

        });
    });

};
