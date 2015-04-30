var uuid = require('uuid');

function Card( data, queue ) {
  if ( !data.wall || data.wall === '' ) {
    throw new Error( 'Wall is required' );
  }

  if ( !data.title || data.title === '' ) {
    throw new Error( 'Title is required' );
  }

  this.id = data.card;
  this.wall = data.wall;
  this.title = data.title;

  this.locations = {};
  this.regions = [];

  this.constructor = Card;
  this.queue = queue;

//  this.queue.subscribe( 'card.transform', Card.prototype.transform.bind( this ) );
  this.queue.subscribe( 'card.regionentered', Card.prototype.regionEntered.bind( this ) );
  this.queue.subscribe( 'card.regionexited', Card.prototype.regionExited.bind( this ) );
}

Card.prototype.getId = function() {
    return this.id;
};

Card.prototype.getTitle = function() {
    return this.title;
};

Card.prototype.update = function( data ) {
  var update = {
    card: this.getId(),
    title: data.title
  }

  var errors = this.updated( update );

  if ( errors ) return errors;

  this.queue.publish( 'card.updated', update );
};

Card.prototype.updated = function( data ) {
  if ( data.card === this.getId() ) {
    this.title = data.title;
  }
};

Card.prototype.transform = function( data ) {
  var patch = {
    card: this.getId(),
    op: data.op,
    property: data.property,
    value: data.value
  }

  var errors = this.transformed( patch );

  if ( errors ) return errors;

  this.queue.publish( 'card.transformed', patch );
};

Card.prototype.transformed = function( patch ) {
  if ( patch.card === this.getId() ) {
    switch ( patch.op ) {
      case 'set':
        if ( this[ patch.property ] !== patch.value ) {
          this[ patch.property ] = patch.value;
        }
      break;

      case 'unset':
        if ( this[ patch.property ] === patch.value ) {
          delete this[ patch.property ];
        }
      break;
    }
  }
};

Card.prototype.getCardnumber = function() {
    return this.cardnumber;
};

Card.prototype.getContent = function() {
    return this.content;
};

Card.prototype.getTags = function() {
    return this.tags;
};

Card.prototype.getMentions = function() {
    return this.mentions;
};

Card.prototype.getColor = function() {
    return this.color;
};

Card.prototype.getWall = function() {
    return this.wall;
};

Card.prototype.getRegions = function() {
    return this.regions;
};

Card.prototype.regionEntered = function( data ) {
  if ( data.card === this.getId() && !~this.regions.indexOf( data.region ) ) {
    this.regions.push( data.region );

    return true;
  }
};

Card.prototype.regionExited = function( data ) {
  var loc = this.regions.indexOf( data.region );

  if ( data.card === this.getId() && ~loc ) {
    this.regions.splice( loc, 1 );

    return true;
  }
};

Card.prototype.getPosition = function( view ) {
  var pos = this.locations[ view ];

  return {
    view: view,
    x: pos && pos.x || 0,
    y: pos && pos.y || 0
  };
};

Card.prototype.move = function( data ) {
  var update = {
    card: this.getId(),
    view: data.view,
    x: data.x,
    y: data.y
  }

  var errors = this.moved( update );

  if ( errors ) return errors;

  this.queue.publish( 'card.moved', update );
};

Card.prototype.moved = function( data ) {
  var pos = this.getPosition( data.view );

  if ( data.card === this.getId() && ( !pos || ( pos.x !== data.x || pos.y !== data.y ) ) ) {
    this.locations[ data.view ] = { x: data.x, y: data.y };
  }
};

Card.constructor = function( data, queue ) {
  var create = {
    card: uuid.v4(),
    wall: data.wall,
    title: data.title
  }

  var card = new Card( create, queue );

  queue.publish( 'card.created', create );

  return card;
};

module.exports = Card;
