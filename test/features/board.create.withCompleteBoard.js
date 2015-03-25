var chai = require('chai')
  , should = chai.should();

var storedWall
  , storedBoard
  , storedName = 'board with cards added automatically'
  , resourceChecked = false
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
            storedBoard = storage.boards[1];

            queue.clearCalls();
        })
        .then( done, done );
    });

    it('Any cards that are already available to the Boards associated Wall will be automatically created and placed on the new Board\n',
        function( done ) {
                var services = this.services;
                var belt = this.application.belt;
                var scenarios = this.scenarios;
                var queue = this.queue;

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

features.title = 'Creating a board on a wall where cards already exist';

module.exports = features;
