var chai = require('chai')
  , should = chai.should();

var storedName = 'new board'
  , storedWall
  , resourceChecked = false
  , queueChecked = false;



function features() {

    beforeEach(function(done) {
      var services = this.services;
      var scenarios = this.scenarios;
      var queue = this.queue;


        queue.once( 'boardcreator:displayed', function() {
            queue.clearCalls();

            done();
        });

        services.createWall({ name: 'wall for board' })
            .then(function( wall ) {
                storedWall = wall;
            })
            .catch( done );
    });

    it('Emit a <board:create> event passing a data object with a valid wall id and a name attribute to trigger the process of creating a new board\n',
        function( done ) {
          var services = this.services;
          var scenarios = this.scenarios;
          var queue = this.queue;


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
