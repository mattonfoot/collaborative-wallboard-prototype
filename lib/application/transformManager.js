
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

  var region, card;
  return repository.getRegion( data.region )
    .then(function( resource ) {
      region = resource;

      return repository.getCard( data.card );
    })
    .then(function( resource ) {
      card = resource;

      return repository.getView( region.getView() );
    })
    .then(function( view ) {
      return repository.getTransforms( view.getTransforms() );
    })
    .then(function( transforms ) {
      transforms.forEach(function( transform ) {
          processTransform( queue, 'set', transform, card, region );
      });
    });
};

TransformManager.prototype.undoTransforms = function( data ) {
  var queue = this.queue;
  var repository = this.repository;

  var region, card;
  return repository.getRegion( data.region )
    .then(function( resource ) {
      region = resource;

      return repository.getCard( data.card );
    })
    .then(function( resource ) {
      card = resource;

      return repository.getView( region.getView() );
    })
    .then(function( view ) {
      return repository.getTransforms( view.getTransforms() );
    })
    .then(function( transforms ) {
      transforms.forEach(function( transform ) {
          processTransform( queue, 'unset', transform, card, region );
      });
    });
};

function processTransform( queue, op, transform, card, region ) {
  var rules = transform.getRules()
    , attr = rules.attr
    , when = rules.when
    , from = rules.from
    , canApply = checkCanApplyTransform( region, when, from.selector );

  if ( canApply ) {
    card.transform({ view: region.getView(), op: op, property: attr, value: region.getProperty( from.attr ) });
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

        return region.getProperty( f.node ) === f.selector.replace('#', '');
    }
};

module.exports = TransformManager;
