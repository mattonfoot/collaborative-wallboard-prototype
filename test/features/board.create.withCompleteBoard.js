var chai = require('chai')
  , should = chai.should();

var storedWall
  , storedBoard
  , storedName = 'board with cards added automatically'
  , resourceChecked = false
  , queueChecked = false;



function features() {
    var services = this.application.services
      , belt = this.application.belt
      , queue = this.queue
      , scenarios = this.scenarios;

    beforeEach(function(done) {

        scenarios.TwoBoardsOneWithRegions()
            .then(function( storage ) {
                storedWall = storage.wall;
                storedBoard = storage.boards[1];

                queue.clearCalls();

                done();
            });
    });

    it('Any cards that are already available to the Boards associated Wall will be automatically created and placed on the new Board\n',
        function( done ) {

            queue.trigger( 'board:create', { wall: storedWall.getId(), name: storedName } );

            queue.once( 'board:added', function( resource ) {
                should.exist( resource );

                resource.should.be.a.specificBoardResource( storedName, storedWall.getId() );

                resourceChecked = true;
            });

            queue.once( 'cardlocation:created', function() {
                // check on the second event

                queue.once( 'cardlocation:created', function() {
                    queue.should.haveLogged([
                            'board:create'
                          , 'board:created'
                          , 'board:added'
                          , 'cardlocation:created'
                          , 'cardlocation:created'
                        ]);

                    queueChecked = true;
                });

                queue.once( 'cardlocation:created', function() {
                    resourceChecked.should.equal( true );
                    queueChecked.should.equal( true );

                    done();
                });
            });

        });

}

features.title = 'Creating a board';

module.exports = features;
