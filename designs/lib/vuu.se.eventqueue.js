
var EventQueue = (function() {

var actions, events = {};

function EventQueue( options ) {
  if (!actions) {
    var eq = function() {
      this.options = options || {};
    }
    
    eq.prototype = EventQueue.prototype;
  
    actions = new eq();
  }

  return actions;
}

function __setupGeneralEventHandler( reactive, action, reaction ) {
  if (!events[action]) {
    events[action] = [];
  }
  
  events[action].push({ reactive: reactive, reaction: reaction });

  return this;
};

function __setupSpecificEventHandler( reactive, source, action, reaction ) {
  if (!events[source]) {
    events[source] = {};
  }
  
  if (!events[source][action]) {
    events[source][action] = [];
  }
  
  events[source][action].push({ reactive: reactive, reaction: reaction });  

  return this;
};

EventQueue.prototype.on = function( reactive, source, action, reaction ) {
  if ( typeof(source) === 'string' && !reaction ) {
    reaction = action;
    action = source;
    
    return __setupGeneralEventHandler.call( this, reactive, action, reaction );
  }
  
  return __setupSpecificEventHandler.call( this, reactive, source, action, reaction );
};

EventQueue.prototype.trigger = function( source, action, data ) {
  if ( this.options.debug ) {
    console.log( action, data, source );
  }
  
  if (events[source] && events[source][action]) {
    events[source][action].forEach(function( react ) {
      react.reaction.call( react.reactive, data, source );
    });
    
    return this;
  }
  
  if (events[action]) {
    events[action].forEach(function( react ) {
      react.reaction.call( react.reactive, data, source );
    });
  }
  
  return this;
};

return EventQueue;

})();