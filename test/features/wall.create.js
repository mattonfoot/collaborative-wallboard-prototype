var chai = require('chai')
  , should = chai.should();

var storedName = 'new wall'
  , resourceChecked = false
  , queueChecked = false;

function features() {

  it('Emit a <wall.create> event passing a data object with a name attribute to trigger the process of creating a new wall\n', function( done ) {
    var queue = this.queue;

    queue.subscribe( '#.fail', done ).once();

    queue.when([
      'wall.created',
      'wall.displayed',
      'wall.firsttime',
      'boardcreator.displayed',
    ],
    function( wall, displayed, firsttime ) {
      should.exist( wall );
      wall.getName().should.equal( storedName );

      should.exist( displayed );
      displayed.should.equal( wall.getId() );

      should.exist( firsttime );
      firsttime.should.equal( wall.getId() );

      done();
    },
    done,
    { once: true, timeout: 100 });

    queue.publish( 'wall.create', { name: storedName } );

  });

}

features.title = 'Creating a wall';

module.exports = features;
