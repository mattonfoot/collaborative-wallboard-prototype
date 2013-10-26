
vuu.se.app

!-- board:add --> { vuu.se.board.create }

!-- region:add --> { vuu.se.region.create }

!-- pocket:add -->  { vuu.se.pocket.create }
  
remote --> app:init --> app:initbegin --> wall:clone --> { vuu.se.wall.create }

remote --> board:cloned --> [{ vuu.se.board }board:activated] --> {}

[{ vuu.se.board.create }board:createend] --> [{ vuu.se.board }board:activated] --> {}

[{ vuu.se.wall.create }wall:cloned] --> app:initend --> {}

[{ vuu.se.wall }wall:boardadded] --!



  
vuu.se.wall.create
  
[{ vuu.se.app }wall:clone] --> board:clone + pocket:clone + wall:cloned --> { vuu.se.app }




vuu.se.wall

!-- wall:pocketadded -->

!-- wall:boardadded -->



  
vuu.se.card
  
remote --> card:moveend --> card:moveend??

remote --> card:tagged --> card:tagged??

remote --> card:untagged --> card:untagged??



  
vuu.se.pocket

remote --> pocket:update --> pocket:update??



  
vuu.se.plugins

[{ vuu.se.pocket }pocket:update] --!



  
vuu.se.board

board:regionadded -->

board:cardadded -->

board:activated -->

board:deactivated -->

board:shelfadded -->

  
  
  
vuu.se.region

region:setvalue?? -->
  
remote --> region:moveend --> region:movestart + region:moveend?? -->

remote --> region:resizeend --> region:resizestart + region:resizeend?? -->



  
vuu.se.board.create
  
[{ vuu.se.card.create }card:createend] --> [{ vuu.se.canvas.board }canvasboard:canvascardadded] --> {}

[{ vuu.se.card.create }card:cloned] --> [{ vuu.se.canvas.board }canvasboard:canvascardadded] --> {}

[{ vuu.se.region.create }region:createend] --> [{ vuu.se.canvas.board }canvasboard:canvasregionadded] --> {}

[{ vuu.se.region.create }region:cloned] --> [{ vuu.se.canvas.board }canvasboard:canvasregionadded] --> {}
  
[{ vuu.se.app }board:add] --> board:createbegin --> board:create --> remote --> board:created --> [{ vuu.se.wall }wall:boardadded] --> board:createend + region:clone + card:add --> { vuu.se.app + vuu.se.region.create }

[{ vuu.se.wall.create }]oard:clone] --> [{ vuu.se.wall }wall:boardadded] --> board:cloned --> remote



  
vuu.se.card.create
  
[{ vuu.se.pocket.create }pocket:createend] --> card:add + card:add --> card:createbegin --> card:create --> remote --> card:created --> card:createend + card:moveend --> { vuu.se.board.create + vuu.se.card.trackmovement, vuu.se.canvas.card }

[{ vuu.se.pocket.create }pocket:cloned] --> card:clone + card:clone --> card:cloned + card:moveend --> { vuu.se.board.create + vuu.se.card.trackmovement, vuu.se.canvas.card }



  
vuu.se.card.trackmovement
  
[{ vuu.se.card, vuu.se.card.create }card:moveend] --> (card:regionenter || card:regionexit) --> [{ vuu.se.pocket }pocket:update]

[{ vuu.se.region, vuu.se.region.create }region:moveend] --!



  
vuu.se.pocket.create
  
[{ vuu.se.app }pocket:add] --> pocket:createbegin --> pocket:create --> remote --> pocket:created --> [{ vuu.se.wall}wall:pocketadded] --> pocket:createend --> { vuu.se.card.create }

[{ vuu.se.wall.create }pocket:clone] --> [{ vuu.se.wall}wall:pocketadded] --> pocket:cloned --> { vuu.se.card.create }



  
vuu.se.region.create
  
[{ vuu.se.app }region:add] --> region:createbegin --> region:create --> remote -->  region:created --> region:createend --> { vuu.se.board.create }

[{ vuu.se.board.create }region:clone] --> region:cloned --> { vuu.se.board.create }




vuu.se.canvas.card

!-- canvascard:activated -->

!-- canvascard:deactivated -->
  
[{ vuu.se.card, vuu.se.card.create }card:moveend] --> canvascard:moved -->

[{ vuu.se.card }card:tagged] --!

[{ vuu.se.card }card:untagged] --!



  
vuu.se.canvas.board

canvasboard:canvasregionadded --> {}

canvasboard:canvascardadded --> {}



  
vuu.se.canvas.region
  
canvasregion:activated -->

canvasregion:deactivated -->
  
[{ vuu.se.region, vuu.se.region.create }region:moveend] --> [region:moveend] + canvasregion:moved -->

[{ vuu.se.region, vuu.se.region.create }region:resizeend] --> [region:resizeend] + canvasregion:resized -->
