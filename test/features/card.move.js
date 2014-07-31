var storedId
  , storedWall
  , storedBoard
  , storedPocket
  , storedLocation
  , storedTitle = 'card for moving'
  , destination = { x: 200, y: 200 };

module.exports = function( should, RSVP, Promise, debug, queue, ui, application ) {
    var belt = application.belt
      , services = application.services;

    describe('Card:Move', function() {

        describe('Moving a card on an empty board', function() {

            before(function(done) {
                queue.clearCalls();

                queue.once('cardlocation:created', function() {
                    storedLocation = location;
                });

                queue.once('controls:enabled', function( location ) {
                    setTimeout(function() {
                        console.log( queue.getCalls() );
                    }, 2000);

                    done();
                });

                addWall( 'card movement wall' )
                    .then( addBoardToWall )
                    .then( addPocketToWall )
                    .then( displayNewWall )
                    .catch( done );

            });



            it('Updates the location', function(done) {
                queue.once( 'cardlocation:updated', complete);

                console.log( storedLocation );

                storedLocation.x = destination.x;
                storedLocation.y = destination.y;

                queue.trigger( 'cardlocation:move', storedLocation);



                function complete( location ) {
                    should.exist( location );

                    location.should.respondTo( 'getId' );
                    location.getId().should.be.equal( storedLocation.getId() );
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






    function addWall( name ) {
        return services
            .createWall( { name: name } )
            .then(function( wall ) {
                storedWall = wall;
            });
    }

    function addBoardToWall() {
        return services
            .createBoard( { wall: storedWall.getId(), name: 'card movement board' } )
            .then(function( board ) {
                storedBoard = board;
            });
    }

    function addPocketToWall() {
        return services
            .createBoard( { wall: storedWall.getId(), name: storedTitle } )
            .then(function( pocket ) {
                storedPocket = pocket;
            });
    }

    function displayNewWall( board ) {
        return services
            .displayWall( storedWall.getId() );
    }

};
