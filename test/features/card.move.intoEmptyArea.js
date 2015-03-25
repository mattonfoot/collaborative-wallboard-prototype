var chai = require('chai')
  , should = chai.should();

var storedName = 'new card'
  , storedWall
  , storedBoard
  , storedPocket
  , storedLocation
  , resourceChecked = false
  , locationChecked = false
  , queueChecked = false
  , update;



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
                storedPocket = storage.pockets[0];
                storedLocation = storage.locations[0];

                update = {
                    id: storedLocation.getId(),
                    x: 600,
                    y: 600
                };

                queue.clearCalls();

                done();
            })
            .catch( done );
    });

    it('Emit a <cardlocation:move> event passing a data object with a valid location id and coordinates to trigger the process of moving a Card around a Board\n',
        function( done ) {
                var services = this.services;
                var belt = this.application.belt;
                var scenarios = this.scenarios;
                var queue = this.queue;

            queue.trigger( 'cardlocation:move', update );

            queue.once( 'cardlocation:updated', function( resource ) {
                should.exist( resource );

                resource.should.respondTo( 'getId' );
                resource.should.respondTo( 'getPocket' );
                resource.getPocket().should.equal( storedPocket.getId() );
                resource.should.respondTo( 'getBoard' );
                resource.getBoard().should.equal( storedBoard.getId() );
                resource.should.respondTo( 'getX' );
                resource.getX().should.equal( update.x );
                resource.should.respondTo( 'getY' );
                resource.getY().should.equal( update.y );

                locationChecked = true;
            });

            queue.once( 'cardlocation:updated', function() {
                queue.should.haveLogged([
                        'cardlocation:move'
                      , 'cardlocation:updated'
                    ]);

                queueChecked = true;
            });

            queue.once( 'cardlocation:updated', function() {
                locationChecked.should.equal( true );
                queueChecked.should.equal( true );

                done();
            });

        });

}

features.title = 'Moving a displayed card into an empty area on the displayed board';

module.exports = features;
