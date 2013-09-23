
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

EventQueue.prototype.on = function( action, reaction ) {
  if (!events[action]) {
    events[action] = [];
  }
  
  events[action].push( reaction );
};

EventQueue.prototype.trigger = function( source, action, data ) {
  if ( this.options.debug ) {
    console.log( action, data, source );
  }
  
  if (events[action]) {
    events[action].forEach(function( reaction ) {
      reaction.call( source, data, source );
    });
  }
};

return EventQueue;

})();