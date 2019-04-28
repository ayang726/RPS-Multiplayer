document.querySelector("#find-match").addEventListener("click", function () {
    var gameRoomRef = findGameRoom(playerUsername);
    //// create a gameroom
    // set both players in game status as true
    // display the other player's stats
});

function findGameRoom(username) {
    db.ref("/users/" + username).once("value", function (s) {
        // if the player is not currently in game
        if (s.child("inGame").val() === false) {
            var gameRoom;
            var gameRoomRef = db.ref("gameRooms");
            gameRoomRef.once("value", function (s) {
                // console.log(Object.keys(s.val()));
                // find a game room
                s.forEach(function (gameRoomSnapshot) {
                    if (gameRoomSnapshot.val().roomFull === false && gameRoomSnapshot.val().players.player1 !== username) {
                        gameRoom = gameRoomSnapshot;
                        // console.log(`Game Room Found. ID: ${gameRoom.key}`);
                    }
                });
                if (gameRoom === undefined) {
                    // create game room
                    gameRoom = gameRoomRef.push({
                        roomFull: false,
                        players: {
                            player1: username
                        }
                    });
                } else {
                    gameRoom.ref.update({ roomFull: true });
                    gameRoom.child("players").ref.update({ player2: username });

                }
                db.ref("/users/" + username).update({ inGame: true, gameRoom: gameRoom.key });
                return gameRoom;
            });
        }
    });
}
