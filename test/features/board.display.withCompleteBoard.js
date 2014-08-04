var chai = require('chai')
  , should = chai.should()
  , RSVP = require('rsvp')
  , Promise = RSVP.Promise;

var storedName = 'display board'
  , storedWall
  , storedBoard
  , resourceChecked = false
  , queueChecked = false;

function features() {
    var services = this.application.services
      , scenarios = this.scenarios
      , queue = this.queue;

    beforeEach(function(done) {
        queue.on('boardselector:displayed', function( board ) {
            queue.clearCalls();

            done();
        });

        scenarios.TwoBoardsOneWithRegions()
            .then(function( storage ) {
                storedWall = storage.wall;
                storedBoard = storage.boards[1];

                queue.trigger( 'wall:display', storedWall.getId() );
            });
    });

    it('Any card and regions already associated with a board will also be displayed\n',
            function(done) {

        queue.trigger( 'board:display', storedBoard.getId() );

        queue.once( 'board:displayed', function( resource ) {
            should.exist( resource );

            resource.should.be.a.specificBoardResource( storedName, storedWall.getId() );
            resource.getId().should.equal( storedBoard.getId() );

            resourceChecked = true;
        });

        queue.once( 'controls:enabled', function() {
            queue.should.haveLogged([
                    'board:display'
                  , 'board:displayed'
                  , 'controls:enabled'
                ]);

            queueChecked = true;
        });

        queue.once( 'controls:enabled', function() {
            resourceChecked.should.equal( true );
            queueChecked.should.equal( true );

            //done();
        });

    });
}

features.title = 'Selecting a Board for display';

module.exports = features;
