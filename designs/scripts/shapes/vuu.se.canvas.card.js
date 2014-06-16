define(function() {

    var CanvasCard = (function() {

        // defaults

        var colors = {
          fill: '#f6f6f6',
          stroke: { active: '#aaa', inactive: '#e5e5e5' }
        };

        var shadow = {
          color: 'black',
          offset: { active: 2, inactive: 1 },
          blur: { active: 9, inactive: 5 }
        };

        var size = {    // issue is that the server needs to know this as well
          width: 100,
          height: 65
        };

        // constructor

        function CanvasCard( queue, card, pocket ) {
            var shape = new Kinetic.Group({
              id: card.id,
              x: card.x || 5,
              y: card.y || 5,
              draggable: true
            });

            var cardback = __createCardback( size.width, size.height, (pocket.color || colors.fill), shadow.color );
            var cardnumber = __createIdText( pocket.cardnumber );
            var cardtitle = __createTitleText( pocket.title );
            var tag = __createTag();

            shape.add( cardback );
            shape.add( cardnumber );
            shape.add( cardtitle );
            shape.add( tag );

            queue
              .on( shape, 'card:moved', function( data ) {
                if ( card.id === data.id &&
                    ( shape.getX() != data.x || shape.getY() != data.y ) ) {
                  __moveTo( data.x, data.y );
                }
              })
              .on( shape, 'card:tagged', function( data ) {
                if ( card.id === data.id ) {
                  __tag( data.tagged );
                }
              })
              .on( shape, 'card:untagged', function( data ) {
                if ( card.id === data.id ) {
                  __untag();
                }
              })
              .on( shape, 'card:updated', function( data ) {
                if ( card.id === data.id &&
                    ( shape.getX() != data.x || shape.getY() != data.y ) ) {
                  __moveTo( data.x, data.y );
                }
              })
              .on( shape, 'pocket:updated', function( data ) {
                if ( pocket.id === data.id ) {
                    __UpdateDisplay( data );
                }
              });

            shape
              .on('mousedown touchstart', function() {
                __displayActiveState();

                queue.trigger( shape, 'canvascard:activated', { card: card, pocket: pocket } );
              })
              .on('mouseup touchend', function() {
                __displayInactiveState();

                queue.trigger( shape, 'canvascard:deactivated', { card: card, pocket: pocket } );
              })
              .on('dragend', function() {
                queue.trigger( shape, 'canvascard:moved', { card: card, pocket: pocket, x: shape.getX(), y: shape.getY() } );
              })
              .on('dblclick dbltap', function( e ) {
                e.cancelBubble = true;
                shape.getStage().preventEvents = true;

                queue.trigger( shape, 'canvascard:opened', { card: card, pocket: pocket } );
              });

            // private methods

            function __redrawLayer() {
              try {
                var layer = shape.getLayer();

                if (layer) {
                  layer.batchDraw();
                }
              } catch(e) {
              }
            }

            function __UpdateDisplay( data ) {
              cardtitle.setText( data.title || "" );
              cardnumber.setText( '#' + data.cardnumber );
              cardback.setFill( data.color || colors.fill );

              __redrawLayer();
            }

            function __moveTo( x, y ) {
              shape.moveToTop();

              shape.setX( x );
              shape.setY( y );

              __redrawLayer();
            }

            function __displayActiveState() {
              cardback.setStroke( colors.stroke.active );
              cardback.setShadowBlur( shadow.blur.active );
              cardback.setShadowOffset( shadow.offset.active );

              shape.moveToTop();

              __redrawLayer();
            };

            function __displayInactiveState() {
              cardback.setStroke( colors.stroke.inactive );
              cardback.setShadowBlur( shadow.blur.inactive );
              cardback.setShadowOffset( shadow.offset.inactive );

              __redrawLayer();
            };

            function __tag( color ) {
              tag.setFill( color );
              tag.setOpacity( 1 );

              __redrawLayer();
            };

            function __untag() {
              tag.setOpacity( 0 );

              __redrawLayer();
            };

            // initialise

            __displayInactiveState();
            __untag();

            // instance

            return shape;
          }

          // private methods

          function __createCardback( w, h, fill, shadow ) {
            return new Kinetic.Rect({
              x: 0,
              y: 0,
              width: w,
              height: h,
              cornerRadius: 5,
              fill: fill,
              strokeWidth: 1,
              shadowOpacity: 0.5,
              shadowColor: shadow,
            });
          };

          function __createIdText( id ) {
            return new Kinetic.Text({
              x: 5,
              y: 2,
              text: '#' + id,
              fontSize: 15,
              fontFamily: 'Calibri',
              fill: '#666'
            });
          };

          function __createTitleText( title ) {
            return new Kinetic.Text({
              x: 5,
              y: 22,
              width: 85,
              height: 36,
              text: title,
              fontSize: 11,
              fontFamily: 'Calibri',
              fill: '#666'
            });
          };

          function __createTag() {
            return new Kinetic.Rect({
              x: 95,
              y: 5,
              width: 10,
              height: 10,
              fill: '#eee',
              stroke: '#666',
              strokeWidth: 1,
              cornerRadius: 2,
              opacity: 0
            });
          };

          // public methods

          return CanvasCard;

      })();

      // export

      return CanvasCard;

});
