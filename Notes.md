##Notes##

In version3 game.js file:
  * The follwoing code should only execute once, not on every value update:
      // if guest joined the game, set ready status
      console.log("a guest joined the room: " + s.val().guest.name);
      document.querySelector("#ready-btn").classList.add("pulse");
      document.querySelector("#ready-btn").classList.remove("disabled");
      document.querySelector("#wait-spinner").classList.remove("active");
  * Each player should track inGame status, players' ready status and rps choices locally in variables.
  * on disconnect, should prompt player that the opponent has left the game, and re execute the start up functions
  
Shouldn't be listening to all the value updates in the gameRoom. Should listen to updates of one value at the time, and run functions accordingly
