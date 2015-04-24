

function CardLocation( data ) {
  for ( var prop in data ) {
      if ( prop === 'links' ) continue;

      this[prop] = data[prop];
  }


  for ( var link in data.links ) {
      this[link] = data.links[link];
  }

  this.constructor = CardLocation;

  this.queue.publish( 'cardlocation.created', this );

  this.queue.subscribe( 'card.moved', CardLocation.prototype.moved.bind( this ) );
}

CardLocation.prototype.getId = function() {
    return this.id;
};

CardLocation.prototype.getPocket = function() {
    return this.pocket;
};

CardLocation.prototype.getBoard = function() {
    return this.board;
};

CardLocation.prototype.getPosition = function() {
  return {
    x: this.x,
    y: this.y
  };
};

CardLocation.prototype.move = function( data ) {
  var update = {
    id: this.id,
    card: this.pocket,
    board: this.board,
    x: data.x,
    y: data.y
  }

  var errors = this.moved( update );

  if ( errors ) return errors;

  this.queue.publish( 'card.moved', update );
};

CardLocation.prototype.moved = function( data ) {
  if ( data.card === this.pocket && data.board === this.board && ( this.x !== data.x || this.y !== data.y ) ) {
    this.x = data.x;
    this.y = data.y;
  }
};

CardLocation.constructor = function( data, queue ) {
  if ( data instanceof CardLocation ) {
      return data;
  }

  return new CardLocation( data, queue );
};

CardLocation.factory = function( queue ) {
  CardLocation.prototype.queue = queue;

  return function( data ) {
    return CardLocation.constructor( data );
  };
};

CardLocation.schema = {
    x: Number,
    y: Number,
    board: 'board',
    pocket: 'pocket'
  , createdBy: 'user'
  , createdOn: Date
  , lastModifiedBy: 'user'
  , lastModifiedOn: Date
};

CardLocation.validator = function( data ) {
    var validator = {
        validForUpdate: true
      , validForCreate: true
      , issues: []
    };

    if ( !data.id ) {
        validator.validForUpdate = false;
        validator.issues.push( 'ID is required' );
    }

    if ( !data.pocket || data.pocket === '' ) {
        validator.validForUpdate = validator.validForCreate = false;
        validator.issues.push( 'Pocket is required' );
    }

    if ( !data.board || data.board === '' ) {
        validator.validForUpdate = validator.validForCreate = false;
        validator.issues.push( 'Board is required' );
    }

    return validator;
};

CardLocation.onBeforeUpdate = function ( data ) {
    // data.lastModifiedBy = app.getCurrentUser()._id;
    data.lastModifiedOn = new Date();

    return data;
};

CardLocation.onBeforeCreate = function( data ) {
    // data.createdBy = app.getCurrentUser()._id;
    data.createdOn = new Date();

    data.x = data.x || 20;
    data.y = data.y || 20;

    return data;
};

module.exports = CardLocation;
