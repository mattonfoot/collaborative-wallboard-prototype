function Wall( data ) {
    for ( var prop in data ) {
        if ( prop === 'links' ) continue;

        this[prop] = data[prop];
    }

    this.boards = [];
    this.pockets = [];

    for ( var link in data.links ) {
        this[link] = data.links[link];
    }

    this.constructor = Wall;

    this.queue.publish( 'wall.created', this );

    this.queue.subscribe( 'wall.updated', Wall.prototype.updated.bind( this ) );
//  this.queue.subscribe( 'board.created', Wall.prototype.addBoard.bind( this ) );
//  this.queue.subscribe( 'pocket.created', Wall.prototype.addPocket.bind( this ) );
}

Wall.prototype.getId = function() {
    return this.id;
};

Wall.prototype.getName = function() {
    return this.name;
};

Wall.prototype.update = function( data ) {
  var update = {
    id: this.id,
    name: data.name
  }

  var errors = this.updated( update );

  if ( errors ) return errors;

  this.queue.publish( 'wall.updated', update );
};

Wall.prototype.updated = function( data ) {
  if ( data.id === this.id ) {
    this.name = data.name;
  }
};

Wall.prototype.getBoards = function() {
    return this.boards;
};

Wall.prototype.addBoard = function( board ) {
    if ( !~this.boards.indexOf( board.id ) ) {
        this.boards.push( board.id );
    }

    return this;
};

Wall.prototype.getPockets = function() {
    return this.pockets;
};

Wall.prototype.addPocket = function( pocket ) {
    if ( !~this.pockets.indexOf( pocket.id ) ) {
        this.pockets.push( pocket.id );
    }

    return this;
};

Wall.constructor = function( data, queue ) {
    if ( data instanceof Wall ) {
        return data;
    }

    return new Wall( data, queue );
};

Wall.factory = function( queue ) {
  Wall.prototype.queue = queue;

  return function( data ) {
    return Wall.constructor( data );
  };
};

Wall.schema = {
    name: String
  , boards: ['board']
  , pockets: ['pocket']
  , createdBy: 'user'
  , createdOn: Date
  , lastModifiedBy: 'user'
  , lastModifiedOn: Date
  // , access: [ 'right' ] --> 'user', 'group'
};

Wall.validator = function( data ) {
    var validator = {
        validForUpdate: true
      , validForCreate: true
      , issues: []
    };

    if ( !data.id ) {
        validator.validForUpdate = false;
        validator.issues.push( 'ID is required' );
    }

    if ( !data.name || data.name === '' ) {
        validator.validForUpdate = validator.validForCreate = false;
        validator.issues.push( 'Name is required' );
    }

    return validator;
};

Wall.onBeforeUpdate = function ( data ) {
    // data.lastModifiedBy = app.getCurrentUser()._id;
    data.lastModifiedOn = new Date();

    return data;
};

Wall.onBeforeCreate = function( data ) {
    // data.createdBy = app.getCurrentUser()._id;
    data.createdOn = new Date();

    return data;
};

module.exports = Wall;
