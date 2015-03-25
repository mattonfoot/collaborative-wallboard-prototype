var chai = require('chai')
  , should = chai.should();

var storedName = 'new card'
  , storedWall
  , storedBoard
  , storedPocket
  , resourceChecked = false
  , locationChecked = false
  , queueChecked = false;



function features() {

    beforeEach(function(done) {
            var services = this.services;
            var belt = this.application.belt;
            var scenarios = this.scenarios;
            var queue = this.queue;

        scenarios.TwoBoardsOneWithRegions.call( this )
            .then(function( storage ) {
                storedWall = storage.wall;
                storedBoard = storage.boards[0];

                return services.displayWall( storedWall.getId() );
            })
            .then(function() {
                return services.displayBoard( storedBoard.getId() );
            })
            .then(function() {
                queue.clearCalls();

                done();
            })
            .catch( done );
    });

    it('Emit a <pocket:create> event passing a data object with a valid wall id and a title attribute to trigger the process of creating a new Card\n',
        function( done ) {
                var services = this.services;
                var belt = this.application.belt;
                var scenarios = this.scenarios;
                var queue = this.queue;

            queue.trigger( 'pocket:create', { wall: storedWall.getId(), title: storedName } );

            queue.once( 'pocket:created', function( resource ) {
                storedPocket = resource;

                should.exist( resource );

                resource.should.be.a.specificCardResource( storedName, storedWall.getId() );

                resourceChecked = true;
            });

            queue.once( 'cardlocation:created', function( resource ) {
                should.exist( resource );

                resource.should.respondTo( 'getId' );
                resource.should.respondTo( 'getPocket' );
                resource.getPocket().should.equal( storedPocket.getId() );
                resource.should.respondTo( 'getBoard' );
                resource.getBoard().should.equal( storedBoard.getId() );

                queue.once( 'cardlocation:created', function( resource ) {
                    should.exist( resource );

                    resource.should.respondTo( 'getId' );
                    resource.should.respondTo( 'getPocket' );
                    resource.getPocket().should.equal( storedPocket.getId() );
                    resource.should.respondTo( 'getBoard' );
                    resource.getBoard().should.not.equal( storedBoard.getId() );

                    locationChecked = true;
                });

                queue.once( 'cardlocation:created', function() {
                    queue.should.haveLogged([
                            'pocket:create'
                          , 'cardlocation:displayed'  // muddy event from displayWall
                          , 'cardlocation:displayed'  // muddy event from displayWall
                          , 'pocket:created'
                          , 'cardlocation:created'
                          , 'cardlocation:displayed'
                          , 'cardlocation:created'
                        ]);

                    queueChecked = true;
                });

                queue.once( 'cardlocation:created', function() {
                    resourceChecked.should.equal( true );
                    locationChecked.should.equal( true );
                    queueChecked.should.equal( true );

                    done();
                });
            });

        });

}

features.title = 'Creating a Card for a displayed board when there are multiple other Boards';

module.exports = features;
