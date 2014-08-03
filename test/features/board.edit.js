var chai = require('chai')
  , should = chai.should();

var storedName = 'unedited board'
  , storedWall
  , storedBoard
  , resourceChecked = false
  , queueChecked = false;



function features() {
    var services = this.application.services
      , queue = this.queue;

    beforeEach(function(done) {

        queue.once( 'board:created', function( board ) {
            storedBoard = board;
        });

        queue.once( 'controls:enabled', function() {
            queue.clearCalls();

            done();
        });

        services.createWall({ name: 'parent wall for board' })
            .then(function( wall ) {
                storedWall = wall;

                services.createBoard({ wall: wall.getId(), name: storedName });
            });
    });

    it('Emit a <board:edit> event with a valid board id to access an input control allowing you to enter new details for a Board\n',
            function(done) {

        queue.trigger( 'board:edit', storedBoard.getId() );

        queue.once( 'boardeditor:displayed', function() {
            queue.should.haveLogged([
                    'board:edit'
                  , 'boardeditor:displayed'
                ]);

            queueChecked = true;
        });

        queue.once( 'boardeditor:displayed', function() {
            queueChecked.should.equal( true );

            done();
        });

    });

}

features.title = 'Accessing the board editor input control';

module.exports = features;
