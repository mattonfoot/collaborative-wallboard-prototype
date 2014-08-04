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
      , queue = this.queue;

    before(function(done) {

        services.createWall({ name: 'parent wall for board' })
            .then(function( wall ) {
                storedWall = wall;

                var promises = [];

                promises.push( services.createBoard({ wall: wall.getId(), name: 'other board' }) );
                promises.push( services.createBoard({ wall: wall.getId(), name: storedName }) );

                return RSVP.all( promises );
            })
            .then(function( boards ) {
                storedBoard = boards[1];

                queue.once( 'controls:enabled', function() {
                    queue.clearCalls();

                    done();
                });
            })
            .catch( done );
    });

    it('Emit a <board:display> event passing a valid board id to trigger the process of rendering an existing Board\n',
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

            done();
        });

    });
}

features.title = 'Selecting a Board for display';

module.exports = features;
