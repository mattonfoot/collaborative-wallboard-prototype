/*

set card color equal to board gender region color
set card color equal to region color on board gender

card( 'color' ).equal().to().region().color().on().board( 'gender' );
card( 'color' ).equalTo().region().color().on().board( 'gender' );

// code to run

var intersections = intersect( card.regions, boards['gender'].regions );
if ( intersections.length > 0 ) {
    card.setColor( intersections );
}

--------

set card opacity equal to board story map vertical position

card( 'opacity' ).equal().to().board( 'story map' ).vertical();
card( 'opacity' ).equal().board( 'story map' ).vertical();

// code to run

var cards = boards['story map'].cards
  , opacity = (cards.indexOf( card.id ) / cards.length) * 100
card.setOpacity( opacity );

--------

add card tag equal to red when card is in board current sprint region blocked

card( 'tag' ).equal().to().color( 'red' ).when().card().is().in().board( 'current sprint' ).region( 'blocked' );
card( 'tag' ).equal().color( 'red' ).when().card().in().board( 'current sprint' ).region( 'blocked' );

// code to run

var intersections = intersect( card.regions, boards['current sprint'].regions['blocked'] );
if ( intersections.length > 0 ) {
    card.addTag( 1, 'red' );
}

--------

// has internal flags object
//   - each function switches a flag
//   - action method then uses the flag object to run the macro

*/
