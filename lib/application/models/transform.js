var uuid = require('uuid');
var queryPhraseParser = require('../queryPhraseParser');

function Transform( data, queue ) {
  if ( !data.view || data.view === '' ) {
    throw new Error( 'View is required' );
  }

  if ( !data.phrase || data.phrase === '' ) {
    throw new Error( 'Phrase is required' );
  }

  this.id = data.transform;
  this.view = data.view;
  this.phrase = data.phrase;
  this.rules = data.rules;

  this.constructor = Transform;
  this.queue = queue;

  this.queue.subscribe( 'transform.updated', Transform.prototype.updated.bind( this ) );
}

Transform.constructor = function( data, queue ) {
  var create = {
    transform: uuid.v4(),
    view: data.view,
    phrase: data.phrase,
    rules: queryPhraseParser( data.phrase )
  }

  var transform = new Transform( create, queue );

  queue.publish( 'transform.created', create );

  return transform;
};

Transform.eventsource = function( queue, events ) {
  var transform;

  events.forEach(function( event ) {
    if ( !transform ) {
      if ( event.topic === 'transform.created' ) {
        transform = new Transform( event.data, queue );

        return;
      }

      throw new Error( 'No created event found for resource' );
    }

    if ( event.topic !== 'transform.created' ) {
      switch( event.topic ) {
        case 'transform.updated':
          transform.updated( event.data );
          break;
      }

      return;
    }

    throw new Error( 'Created event encountered for resource that was already created' );
  });

  return transform;
};

Transform.prototype.getId = function() {
    return this.id;
};

Transform.prototype.getPhrase = function() {
    return this.phrase;
};

Transform.prototype.getRules = function() {
    // clone rules and return;

    return this.rules;
};

Transform.prototype.update = function( data ) {
  if ( data.transform && data.transform !== this.getId() ) return;

  var update = {
    transform: this.getId(),
    phrase: data.phrase,
    rules: queryPhraseParser( data.phrase )
  }

  var errors = this.updated( update );

  if ( errors ) return errors;

  this.queue.publish( 'transform.updated', update );
};

Transform.prototype.updated = function( data ) {
  if ( data.transform === this.getId() ) {
    if ( data.phrase ) this.phrase = data.phrase;
    if ( data.rules ) this.rules = data.rules;
  }
};

Transform.prototype.getView = function() {
    return this.view;
};

module.exports = Transform;










/*





function Transform( data ) {
    for ( var prop in data ) {
        if ( prop === 'links' ) continue;

        this[prop] = data[prop];
    }

    for ( var link in data.links ) {
        this[link] = data.links[link];
    }

    this.constructor = Transform;

    this.queue.publish( 'transform.created', this );
}

Transform.prototype.getId = function() {
    return this.id;
};

Transform.prototype.getPhrase = function() {
    return this.phrase;
};

Transform.prototype.getRules = function() {
    return this.rules;
};

Transform.prototype.getBoard = function() {
    return this.board;
};

Transform.constructor = function( data, queue ) {
    if ( data instanceof Transform ) {
        return data;
    }

    return new Transform( data, queue );
};

Transform.factory = function( queue ) {
  Transform.prototype.queue = queue;

  return function( data ) {
    return Transform.constructor( data );
  };
};

Transform.schema = {
    phrase: String
  , rules: Object
  , board: 'board'
  , createdBy: 'user'
  , createdOn: Date
  , lastModifiedBy: 'user'
  , lastModifiedOn: Date
};

Transform.validator = function( data ) {
    var validator = {
        validForUpdate: true
      , validForCreate: true
      , issues: []
    };

    if ( !data.id ) {
        validator.validForUpdate = false;
        validator.issues.push( 'ID is required' );
    }

    if ( !data.phrase || data.phrase === '' ) {
        validator.validForUpdate = validator.validForCreate = false;
        validator.issues.push( 'Phrase is required' );
    }

    if ( !data.board ) {
        validator.validForUpdate = false;
        validator.issues.push( 'Board is required' );
    }

    return validator;
};

Transform.onBeforeUpdate = function ( data ) {
    // data.lastModifiedBy = app.getCurrentUser()._id;
    data.lastModifiedOn = new Date();

    data.rules = queryPhraseParser( data.phrase );

    return data;
};

Transform.onBeforeCreate = function( data ) {
    // data.createdBy = app.getCurrentUser()._id;
    data.createdOn = new Date();

    data.rules = queryPhraseParser( data.phrase );

    return data;
};

module.exports = Transform;

*/
