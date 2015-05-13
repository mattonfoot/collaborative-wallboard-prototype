
function TransformManager( queue, repository ) {
  var manager = this;
  this.queue = queue;
  this.repository = repository;

  queue.subscribe( 'card.regionentered', function( data ) {
    manager.applyTransforms( data );
  });

  queue.subscribe( 'card.regionexited', function( data ) {
    manager.undoTransforms( data );
  });
}

TransformManager.prototype.applyTransforms = function( data ) {
  var queue = this.queue;
  var repository = this.repository;

  var region;
  return repository.getRegion( data.region )
    .then(function( resource ) {
      region = resource;

      return repository.getCard( data.card )
    })
    .then(function( card ) {
      card.transform({ op: 'set', property: 'color', value: region.getColor() });
    });
};

TransformManager.prototype.undoTransforms = function( data ) {
  var queue = this.queue;
  var repository = this.repository;

  var region;
  return repository.getRegion( data.region )
    .then(function( resource ) {
      region = resource;

      return repository.getCard( data.card )
    })
    .then(function( card ) {
      card.transform({ op: 'unset', property: 'color', value: region.getColor() });
    });
};
/*
TransformManager.prototype.checkTransforms = function( data ) {
  var queue = this.queue;
  var repository = this.repository;

  return repository.getAllTransforms()
      .then(function( resources ) {
          resources.forEach(function( transform ) {
              processTransform.call( _this, transform, card, region );
          });
      });
};

function processTransform( transform, card, region ) {
    var rules = transform.rules
      , attr = rules.attr
      , when = rules.when
      , from = rules.from
      , canApply = checkCanApplyTransform( region, when, from.selector )
      , _this = this;

    if ( canApply ) {
        card[attr] = region[from.attr];

        _this.queue.emit( 'card.transformed', card );
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
