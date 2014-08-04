var chai = require('chai')
  , should = chai.should();

var storedName = 'display wall'
  , storedWall
  , wallChecked = false
  , boardChecked = false
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

    it('If the Wall has any associated Boards then the first board will be selected and displayed\n',
            function(done) {

        queue.trigger( 'wall:display', storedWall.getId() );

        queue.once( 'wall:displayed', function( resource ) {
            should.exist( resource );

            resource.should.be.a.specificWallResource( storedWall.getName() );

            wallChecked = true;
        });

        queue.once( 'board:displayed', function( resource ) {
            should.exist( resource );

            resource.should.be.a.specificBoardResource( storedBoard.getName(), storedWall.getId() );

            boardChecked = true;
        });

        queue.once( 'controls:enabled', function() {
            queue.should.haveLogged([
                    'wall:display'
                  , 'wall:displayed'
                  , 'boardselector:displayed'
                  , 'board:displayed'
                  , 'controls:enabled'
                ]);

            queueChecked = true;
        });

        queue.once( 'controls:enabled', function() {
            wallChecked.should.equal( true );
            boardChecked.should.equal( true );
            queueChecked.should.equal( true );

            done();
        });
    });

}

features.title = 'Displaying a wall with multiple boards containing cards and regions';

module.exports = features;
