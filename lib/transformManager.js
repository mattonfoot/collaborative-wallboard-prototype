
function TransformManager( queue, queries ) {
  var manager = this;
  this._queue = queue;
  this._queries = queries;

  queue.subscribe( 'pocket.regionenter', function( data ) {
      manager.applyTransforms( data );
  });

  queue.subscribe( 'pocket.regionexit', function( data ) {
      manager.undoTransforms( data );
  });
}

TransformManager.prototype.applyTransforms = function( data ) {
  var queue = this._queue;
  var queries = this._queries;

  var region;
  return queries.getRegion( data.region )
    .then(function( resource ) {
      region = resource;

      return queries.getPocket( data.card )
    })
    .then(function( card ) {
      card.transform({ op: 'set', property: 'color', value: region.getColor() });
    });
};

TransformManager.prototype.undoTransforms = function( data ) {
  var queue = this._queue;
  var queries = this._queries;

  var region;
  return queries.getRegion( data.region )
    .then(function( resource ) {
      region = resource;

      return queries.getPocket( data.card )
    })
    .then(function( card ) {
      card.transform({ op: 'unset', property: 'color', value: region.getColor() });
    });
};
/*
TransformManager.prototype.checkTransforms = function( data ) {
  var queue = this.queue;
  var queries = this.queries;

  return queries.getAllTransforms()
      .then(function( resources ) {
          resources.forEach(function( transform ) {
              processTransform.call( _this, transform, pocket, region );
          });
      });
};

function processTransform( transform, pocket, region ) {
    var rules = transform.rules
      , attr = rules.attr
      , when = rules.when
      , from = rules.from
      , canApply = checkCanApplyTransform( region, when, from.selector )
      , _this = this;

    if ( canApply ) {
        pocket[attr] = region[from.attr];

        _this._queue.emit( 'pocket.transformed', pocket );
    }
}

function checkCanApplyTransform( region, when, filter ) {
    if ( when.relationship === 'within' && when.filter === 'region' && filter.node === 'region' ) {
        return filterMethods[typeof filter.selector]( region, filter );
    }

    return false;
}

var filterMethods = {
    'string': function( region, filter ) {
        var f = filter.selector;

        return region.getId() === filter.selector.replace('#', '');
    }
  , 'object': function( region, filter ) {
        var f = filter.selector;

        return region[f.node] === f.selector.replace('#', '');
    }
};
*/
module.exports = TransformManager;
