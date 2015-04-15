var chai = require('chai')
  , should = chai.should();

var storedName = 'new wall'
  , resourceChecked = false
  , queueChecked = false;

function features() {

  it('Emit a <wall:create> event passing a data object with a name attribute to trigger the process of creating a new wall\n', function( done ) {
    var queue = this.queue;

    queue.subscribe( '#.fail', done );

    queue.when([
      'wall:created',
      'wall:displayed',
      'boardselector:displayed',
      'wall:firsttime',
      'boardcreator:displayed',
    ],
    function( wall ) {
      should.exist( wall );
      wall.getName().should.equal( storedName );

      done();
    },
    done,
    { once: true, timeout: 1000 });

    queue.trigger( 'wall:create', { name: storedName } );

  });

}

features.title = 'Creating a wall';

module.exports = features;
