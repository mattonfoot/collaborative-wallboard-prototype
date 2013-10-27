
~~initialize app~~

~~get current state from server~~
  ~~wall~~
    ~~boards~~
      ~~cards~~
      ~~regions~~
    ~~pockets~~
    
--------
    
~~initialize UI remote façades~~
~~initialize UI~~

~~add a board to the wall~~
add a shelf to the board
  
add a card to the shelf
  move a card onto the board

~~add a region to the board~~
  resize a region
  ~~move a region - done~~ -- should this check all the cards to see if any cards are now within its bounds ??

~~move a card over a region~~
  ~~detect a collision between a region and card~~
  modify the card data - 
  
--------
  
  
~~server should return existing card from data store if one is already stored for a specific pocket and board combination~~
  
~~add two different regions to two different boards~~
  ~~color the background of a region if it is a valid color value~~
  regions display the value in a title position
  resize a region
  edit region value
  delete a region
  
predefined list of board name based on registered plugins
  edit board name
  
gender plugin
  predefined values if board is of a specific name
  region value validation based on board name
  color the background of a region based on its chosen predefined value
  
card tagging logic to allow plugins to create a tag shape 
  card to work out the best way to display a tag
  multiple predefined anchors to group tags around
  
~~cards are considered inside a region if they more than 50% of them is over it~~

~~card is over two or more regions on the same board~~

~~display pocket data when double clicking card~~
  edit pocket title
  increment pocket cardnumber so all unique

~~server needs to update hypermedia rather than just pass message on~~

db backup

infinite board scrolling
  
  
-----
  
ui triggers create event
  --> server creates model created event
    --> UI creates remote façade --- because cards trigger off pockets both clients create a card so we get duplicates - fixed
      --> UI creates element