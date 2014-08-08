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
    var services = this.application.services
      , scenarios = this.scenarios
      , queue = this.queue;

    before(function(done) {

        scenarios.TwoBoardsOneWithRegions()
            .then(function( storage ) {
                storedWall = storage.wall;
                storedBoard = storage.boards[0];

                queue.clearCalls();

                done();
            });
    });

    it('Emit a <pocket:create> event passing a data object with a valid wall id and a title attribute to trigger the process of creating a new Card\n',
        function( done ) {


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
                resource.should.respondTo( 'getBoard' );
                resource.getPocket().should.equal( storedPocket.getId() );

                locationChecked = true;
            });

            queue.once( 'cardlocation:created', function() {
                queue.once( 'cardlocation:created', function() {
                    queue.should.haveLogged([
                            'pocket:create'
                          , 'pocket:created'
                          , 'cardlocation:created'
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

features.title = 'Creating a Card on a wall with multiple Boards';

module.exports = features;
