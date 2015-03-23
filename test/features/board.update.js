var chai = require('chai')
  , should = chai.should();

var storedName = 'unedited board'
  , editedName = 'edited board'
  , storedWall
  , storedBoard
  , resourceChecked = false
  , queueChecked = false;

function features() {
    var services = this.application.services
      , queue = this.queue;

    before(function(done) {

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

    it('Emit a <board:update> event passing an updated data object with a valid board id trigger the process of updating the stored data for an existing Board\n',
            function(done) {

        storedBoard.name = editedName;

        queue.trigger( 'board:update', storedBoard );

        queue.once( 'board:updated', function( resource ) {
            should.exist( resource );

            resource.should.be.a.specificBoardResource( editedName, storedWall.getId() );
            resource.getId().should.equal( storedBoard.getId() );

            resourceChecked = true;
        });

        queue.once( 'board:updated', function() {
            queue.should.haveLogged([
                    'board:update'
                  , 'board:updated'
                ]);

            queueChecked = true;
        });

        queue.once( 'board:updated', function() {
            resourceChecked.should.equal( true );
            queueChecked.should.equal( true );

            done();
        });

    });

}

features.title = 'Updating a Board';

module.exports = features;
