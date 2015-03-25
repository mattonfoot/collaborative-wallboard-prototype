var chai = require('chai')
  , should = chai.should()
  , RSVP = require('rsvp')
  , Promise = RSVP.Promise;

var storedName = 'Board with regions'
  , storedWall
  , storedBoard
  , resourceChecked = false
  , controlsChecked = false
  , queueChecked = false
  , regionCount = 0
  , cardCount = 0;

function features() {

    beforeEach(function(done) {
            var services = this.services;
            var belt = this.application.belt;
            var scenarios = this.scenarios;
            var queue = this.queue;

        queue.once('boardselector:displayed', function( board ) {
            queue.clearCalls();

            done();
        });

        scenarios.TwoBoardsOneWithRegions.call( this )
            .then(function( storage ) {
                storedWall = storage.wall;
                storedBoard = storage.boards[1];

                queue.trigger( 'wall:display', storedWall.getId() );
            })
            .catch( done );
    });

    it('Any card and regions already associated with a board will also be displayed\n',
            function(done) {
                    var services = this.services;
                    var belt = this.application.belt;
                    var scenarios = this.scenarios;
                    var queue = this.queue;

        countCards();
        countRegions();

        queue.trigger( 'board:display', storedBoard.getId() );

        queue.once( 'board:displayed', function( resource ) {
            should.exist( resource );

            resource.should.be.a.specificBoardResource( storedName, storedWall.getId() );
            resource.getId().should.equal( storedBoard.getId() );

            resourceChecked = true;
        });

        queue.once( 'controls:enabled', function() {
            controlsChecked = true;
        });

        function checkQueue() {
            queue.should.haveLogged([
                    'board:display'
                  , 'board:displayed'
                  , 'controls:enabled'
                  , 'region:displayed'
                  , 'region:displayed'
                  , 'cardlocation:displayed'
                  , 'cardlocation:displayed'
                ]);

            queueChecked = true;

            resourceChecked.should.equal( true );
            controlsChecked.should.equal( true );

            done();
        }

        function countCards() {
          queue.once( 'cardlocation:displayed', function() {
            cardCount++;

            if ( cardCount >= 2 && regionCount >= 1 ) {
              checkQueue();

              return;
            }

            countCards();
          });
        }

        function countRegions() {
          queue.once( 'region:displayed', function() {
            regionCount++;

            if ( cardCount >= 2 && regionCount >= 1 ) {
              checkQueue();

              return;
            }

            countRegions();
          });
        }

    });
}

features.title = 'Selecting a pre populated Board for display';

module.exports = features;
