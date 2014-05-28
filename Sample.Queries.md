function Config( attr ) {
  this.attr = attr;
}

Config.prototype.from = function( attr, selector ) {
  this.from = {
    attr: attr,
    selector: selector
  };

  return this;
};

Config.prototype.when = function( relationship, filter ) {
  this.when = {
    relationship: relationship,
    filter: filter
  };

  return this;
};


function get( attr ) {
  var config = new Config( attr );

  return config;
}

function region( relationship, selector ) {
    return {
      relationship: relationship,
      selector: selector,
      node: region
    };
}

function board( selector ) {
    return {
      selector: selector,
      node: board
    };
}

function parse( phrase ) {
  var matches = phrase.match(/(get|from|when)/ig);
  if (!matches || matches.length < 2) {
    return {};
  }

  out = phrase.replace(/\sof\s/ig, ' ').replace(/board\s#([^\s]*)/ig, 'board(\'#$1\')').trim();
  out = out.replace(/(board[^\(])\s/ig, '\'$1\' ').trim();
  out = out.replace(/\sboard(?:\s|$)/ig, ' \'board\' ').trim();
  out = out.replace(/region\s([^\s]*)\s([^\s]*)/ig, 'region(\'$1\',$2)').trim();
  out = out.replace(/\sregion(?:\s|$)/ig, ' \'region\' ').trim();
  out = out.replace(/get\s([^\s]*)/ig, 'get(\'$1\')').trim();
  out = out.replace(/\sfrom\s([^\s]*)\s([^\s]*)/ig, '.from(\'$1\',$2)').trim();
  out = out.replace(/\swhen\s([^\s]*?)\s([^\s]*)/ig, '.when(\'$1\',$2)').trim();

  if (out === phrase) {
    return {};
  }

  return new Function( 'return ' + out )();
}


// get color from color of region on board #{{id}} when within region

window.configA =
  get( 'color' ).from( 'color', /* of */ region( 'on', board( '#{{id}}' ) ) ).when( 'within', 'region' );

// get tag from name of board when on board #{{id}}

window.configB =
  get( 'tag' ).from( 'name', /* of */ 'board' ).when( 'on', board( '#{{id}}' ) );

// get opacity from vertical of board #{{id}}

window.configC =
  get( 'opacity' ).from( 'vertical', /* of */ board( '#{{id}}' ) );

// when within region on board #{{id}} get color from color of region

console.log(
    "get color from color of region on board #{{id}} when within region",
    parse( "get color from color of region on board #{{id}} when within region" )
);

// when on board #{{id}} get tag from name of board

console.log(
    "get tag from name of board when on board #{{id}}",
    parse( "get tag from name of board when on board #{{id}}" )
);

// when moved on board #{{id}} get opacity from vertical rank

console.log(
    "get opacity from vertical of board #{{id}}",
    parse( "get opacity from vertical of board #{{id}}" )
);

console.log(
    "alert('got ya!!')",
    parse( "alert('got ya!!')" )
);
