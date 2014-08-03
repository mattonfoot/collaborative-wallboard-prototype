var chai = require('chai')
  , should = chai.should();

var storedName = 'new board'
  , resourceChecked = false
  , queueChecked = false;



function features() {
    var services = this.application.services
      , belt = this.application.belt
      , queue = this.queue;

    beforeEach(function(done) {

        queue.once( 'boardcreator:displayed', function() {
            queue.clearCalls();

            done();
        });

        services.createWall({ name: 'wall for board' })
            .then(function( wall ) {
                storedWall = wall;
            });
    });

    it('Emit a <board:create> event passing a data object with a valid wall id and a name attribute to trigger the process of creating a new board\n',
        function( done ) {

            queue.trigger( 'board:create', { wall: storedWall.getId(), name: storedName } );

            queue.once( 'board:added', function( resource ) {
                should.exist( resource );

                resource.should.be.a.specificBoardResource( storedName, storedWall.getId() );

                resourceChecked = true;
            });

            queue.once( 'controls:enabled', function() {
                queue.should.haveLogged([
                        'board:create'
                      , 'board:created'
                      , 'board:added'
                      , 'board:displayed'
                      , 'controls:enabled'
                    ]);

                queueChecked = true;
            });

            queue.once( 'controls:enabled', function() {
                resourceChecked.should.equal( true );
                queueChecked.should.equal( true );

                done();
            });

        });

}

features.title = 'Creating a board';

module.exports = features;












/*

            it('When the wall has two cards already', function( done ) {
                var storedId, storedName = 'Two card board';

                application.pauseListenting();

                services
                    .createWall( { name: 'wall for new board' } )
                    .then( onWallCreated )
                    .then( onWallDisplay )
                    .then( onPocketCreated )
                    .then(function() {
                        queue.clearCalls();
                        application.startListening();

                        queue.once( 'board:displayed', onBoardDisplayed);

                        queue.once( 'cardlocation:created', onCardCreated);

                        queue.trigger( 'board:create', { wall: storedId, name: storedName } );
                    })
                    .catch( done );

                function onWallCreated( wall ) {
                    storedId = wall.getId();

                    return services.displayWall( storedId )
                        .then(function() {
                            return wall;
                        });
                }

                function onWallDisplay( wall ) {
                    return services.createPocket( { wall: storedId, title: 'First card' } )
                        .then(function() {
                            return wall;
                        });
                }

                function onPocketCreated( wall ) {
                    return services.createPocket( { wall: storedId, title: 'Second card' } )
                        .then(function() {
                            return wall;
                        });
                }

                function onBoardDisplayed( board ) {
                    should.exist( board );

                    board.should.respondTo( 'getId' );
                    board.should.respondTo( 'getName' );
                    board.getName().should.be.equal( storedName );
                    board.should.respondTo( 'getWall' );
                    board.getWall().should.be.equal( storedId );
                }

                function onCardCreated( card ) {
                    var calls = queue.getCalls();

                    calls.length.should.be.above( 7 );

                    calls[0].event.should.be.equal( 'board:create' );
                    calls[1].event.should.be.equal( 'board:created' );
                    calls[2].event.should.be.equal( 'board:displayed' );
                    calls[3].event.should.be.equal( 'controls:enabled' );
                    calls[4].event.should.be.equal( 'board:added' );
                    calls[5].event.should.be.equal( 'board:displayed' );
                    calls[6].event.should.be.equal( 'controls:enabled' );
                    calls[7].event.should.be.equal( 'cardlocation:created' );

                    done();
                }
            });
*/
