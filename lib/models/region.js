

function Region( data ) {
    for ( var prop in data ) {
        if ( prop === 'links' ) continue;

        this[prop] = data[prop];
    }

    this.pockets = [];

    for ( var link in data.links ) {
        this[link] = data.links[link];
    }

    this.constructor = Region;

    this.queue.publish( 'region.created', this );

    this.queue.subscribe( 'region.updated', Region.prototype.updated.bind( this ) );
    this.queue.subscribe( 'region.moved', Region.prototype.moved.bind( this ) );
    this.queue.subscribe( 'region.resized', Region.prototype.resized.bind( this ) );
//  this.queue.subscribe( 'pocket.regionentered', Region.prototype.addPocket.bind( this ) );
//  this.queue.subscribe( 'pocket.regionexited', Region.prototype.removePocket.bind( this ) );
}

Region.prototype.getId = function() {
    return this.id;
};

Region.prototype.getLabel = function() {
    return this.label;
};

Region.prototype.getValue = function() {
    return this.value;
};

Region.prototype.getColor = function() {
    return this.color;
};

Region.prototype.update = function( data ) {
  var update = {
    id: this.id,
    label: data.label,
    value: data.value,
    color: data.color
  }

  var errors = this.updated( update );

  if ( errors ) return errors;

  this.queue.publish( 'region.updated', update );
};

Region.prototype.updated = function( data ) {
  if ( data.id === this.id ) {
    if ( data.label ) this.label = data.label;
    if ( data.value ) this.value = data.value;
    if ( data.color ) this.color = data.color;
  }
};

Region.prototype.getBoard = function() {
    return this.board;
};

Region.prototype.getPockets = function() {
    return this.pockets;
};

Region.prototype.addPocket = function( pocket ) {
    if ( !~this.pockets.indexOf( pocket.id ) ) {
        this.pockets.push( pocket.id );
    }

    return this;
};

Region.prototype.getPosition = function() {
  return {
    x: this.x,
    y: this.y
  };
};

Region.prototype.move = function( data ) {
  var update = {
    id: this.id,
    x: data.x,
    y: data.y
  }

  var errors = this.moved( update );

  if ( errors ) return errors;

  this.queue.publish( 'region.moved', update );
};

Region.prototype.moved = function( data ) {
  if ( data.id === this.id && ( this.x !== data.x || this.y !== data.y ) ) {
    this.x = data.x;
    this.y = data.y;
  }
};

Region.prototype.getSize = function() {
  return {
    width: this.width,
    height: this.height
  };
};

Region.prototype.resize = function( data ) {
  var update = {
    id: this.id,
    width: this.width,
    height: this.height
  }

  var errors = this.resized( update );

  if ( errors ) return errors;

  this.queue.publish( 'region.resized', update );
};

Region.prototype.resized = function( data ) {
  if ( data.id === this.id && ( this.width !== data.width || this.height !== data.height ) ) {
    this.width = data.width;
    this.height = data.height;
  }
};

Region.constructor = function( data, queue ) {
    if ( data instanceof Region ) {
        return data;
    }

    return new Region( data, queue );
};

Region.factory = function( queue ) {
  Region.prototype.queue = queue;

  return function( data ) {
    return Region.constructor( data );
  };
};

Region.schema = {
    label: String
  , value: String
  , color: String
  , x: Number
  , y: Number
  , width: Number
  , height: Number
  , board: 'board'
  , pockets: ['pocket']
  , createdBy: 'user'
  , createdOn: Date
  , lastModifiedBy: 'user'
  , lastModifiedOn: Date
};

Region.validator = function( data ) {
    var validator = {
        validForUpdate: true
      , validForCreate: true
      , issues: []
    };

    if ( !data.id ) {
        validator.validForUpdate = false;
        validator.issues.push( 'ID is required' );
    }

    if ( !data.label || data.label === '' ) {
        validator.validForUpdate = validator.validForCreate = false;
        validator.issues.push( 'Label is required' );
    }

    if ( !data.board || data.board === '' ) {
        validator.validForUpdate = validator.validForCreate = false;
        validator.issues.push( 'Board is required' );
    }

    return validator;
};

Region.onBeforeUpdate = function ( data ) {
    // data.lastModifiedBy = app.getCurrentUser()._id;
    data.lastModifiedOn = new Date();

    return data;
};

Region.onBeforeCreate = function( data ) {
    // data.createdBy = app.getCurrentUser()._id;
    data.createdOn = new Date();

    data.width = data.width || 100;
    data.height = data.height || 100;
    data.x = data.x || 10;
    data.y = data.y || 10;

    return data;
};

module.exports = Region;
