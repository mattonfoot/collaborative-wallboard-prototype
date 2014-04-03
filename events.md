
// server

card:created
card:updated
card:moved

pocket:created
pocket:updated
pocket:regionenter
pocket:regionexit

board:created
board:updated

region:created
region:updated
region:moved
region:resized

wall:created
wall:updated



// client

app:init              --> app.js --> app:initend




// commands

board:created         --> board.created.js --> board:cloned ?? do we have this wall already ?? board:added, region:created, pocket:created

canvasboard:opened   --> canvasboard.opened.js

canvascard:opened     --> canvascard.opened.js !-- POST

canvasregion:opened   --> canvasregion.opened.js !-- POST

board:cloned          --> canvasboard.created.js --> canvasboard:created
card:added            --> canvasboard.created.js --> canvascard:created
region:added          --> canvasboard.created.js --> canvasregion:created

canvascard:moved      --> canvascard.moved.js --> POST
canvasregion:moved    --> canvasregion.moved.js --> POST
canvasregion:resized  --> canvasregion.resized.js --> POST

card:created          --> card.created.js --> card:cloned ?? do we have this card already ?? card:added, card:moved

pocket:added          --> pocket.added.js --> card:created

pocket:created        --> pocket.created.js ?? do we have this card already ?? pocket:cloned ?? do we have this card already ?? pocket:added

pocket:updated        --> pocket.updated.js

region:created        --> region.created.js --> region:cloned ?? do we have this region already ?? region:Added

region:updated        --> region.updated.js

wall:selected         --> wall.opened.js --> ?? does the wall have any boards ?? wall:opened || wall:firsttime

wall:opened           --> wall.opened.js --> board:opened, pocket:added




// controls

wall:firsttime,
.add-board:mouseup,
.add-board:touchend               --> controls.addboard.js !-- POST

add-pocket:mouseup,
add-pocket:touchend               --> controls.addpocket.js !-- POST

add-region:mouseup,
add-region:touchend               --> controls.addregion.js !-- POST

[data-toggle="tab"]:shown.bs.tab  --> controls.displayboard.js --> wall.setactiveboardbyid()

.list-group-item:mouseup,
.list-group-item:touchend         --> controls.displaywall.js --> wall:selected

board:added                       --> controls.enable.js --> controls:enabled

board:cloned                      --> controls.tab.create.js




// models

board.activate(),
board.deactivate()                --> board.js  --> board:activated, board:deactivated

canvascard:moved,
card:moved,
card:updated                      --> card.js
card.tag(),
card.untag()                      --> card.js --> card:tagged, card:untagged

canvasregion:moved,
canvasregion:resized,
region:updated                    --> region.js

wall.addboard(),
wall.setactiveboard(),
wall.setactiveboardbyid()          --> wall.js --> board.activate(), board.deactivate()




// shapes

shape:dblclick                     --> canvasboard.js --> canvasboard:opened
container:mousewheel               --> canvasboard.js --> canvasboard:scaled
shape.addRegion()                  --> canvasboard.js --> canvasregion:added
shape.addCard()                    --> canvasboard.js --> canvascard:added

card:moved
card:tagged
card:untagged
card:updated
pocket:updated                     --> canvascard.js
shape:mousedown,
shape:touchstart                   --> canvascard.js --> canvascard:activated
shape:mouseup,
shape:touchend                     --> canvascard.js --> canvascard:deactivated
shape:dragend                      --> canvascard.js --> canvascard:moved
shape:dblclick,
shape:dbltap                       --> canvascard.js --> canvascard:opened

region:moved
region:resized
region:updated                     --> canvasregion.js
shape:mousedown,
shape:touchstart                   --> canvasregion.js --> canvasregion:activated
shape:mouseup,
shape:touchend                     --> canvasregion.js --> canvasregion:deactivated
shape:dragend                      --> canvasregion.js --> canvasregion:moved
shape:dblclick,
shape:dbltap                       --> canvasregion.js --> canvasregion:opened
shape:dragend                      --> canvasregion.js --> canvasregion:resized
