var elems = document.querySelectorAll('.modal');
var instances = M.Modal.init(elems, {});
var loginModal = document.getElementById("login-modal");
const loginModalInstance = M.Modal.getInstance(loginModal)
const db = firebase.database();

var playerUsername;

// Log in modal form functions
document.querySelector("#btn-login").addEventListener("click", function (e) {
    e.preventDefault();
    document.getElementById("name-input-line").classList.toggle("hidden");
});


document.querySelector("#btn-signup").addEventListener("click", function (e) {
    e.preventDefault();

    var name = document.querySelector("#name-input").value;
    var username = document.querySelector("#username-input").value.toLowerCase();
    var password = document.querySelector("#password-input").value;
    if (username !== "") {
        db.ref("/users/" + username).once("value").then(function (s) {
            if (s.val()) {
                if (password === s.val().password) {
                    // console.log(s.val().password);
                    login(username);
                } else {
                    loginMessage("Wrong Password (Username exists)");
                }
            } else if (name !== "") {
                db.ref("/users/" + username).set({
                    name: name,
                    password: password,
                    loggedIn: false,
                    inGame: false,
                    stats: {
                        losses: 0,
                        matchCount: 0,
                        wins: 0
                    }
                });
                login(username)
            }
        });
    }
});
function loginMessage(message) {
    var msg = document.getElementById("login-msg");
    msg.textContent = message;
    msg.classList.remove("hidden");
}

// Update Player Counter (Game Lobby)
document.querySelector("#refresh-players").addEventListener("click", function () {
    updatePlayerCount();
});

function updatePlayerCount() {
    var playerCount = 0;
    db.ref("/users").once("value", function (s) {
        var userList = s.val();
        // console.log(userList);
        for (const username in userList) {
            // console.log(userList[username].loggedIn);
            if (userList[username].loggedIn) playerCount++;
        }
        document.querySelectorAll(".player-count").forEach(e => {
            e.textContent = playerCount;
        });
    });
}

// Log in / out functions
function login(username) {
    console.log(`${username}, logging in`);
    playerUsername = username;
    var userOnline;
    db.ref("/users/" + username).once("value", function (s) {
        userOnline = s.child("loggedIn").val();
        // console.log(userOnline);
        // if user isn't online, then log user in
        if (userOnline === false) {
            db.ref("/users/" + username).update({ "loggedIn": true });

            db.ref("/users/" + username).on("value", function (snapshot) {
                document.querySelector("#username").textContent = username;
                document.querySelector("#name").textContent = snapshot.val().name;
                document.querySelectorAll("#match-count").textContent = snapshot.val().stats.matchCount;
            });
            loginModalInstance.close();
            sessionStorage.setItem("username", username);

            updatePlayerCount();
            db.ref("/users/" + username).onDisconnect().update({ "loggedIn": false, "inGame": false });
        } else {
            loginMessage("This user is already online");
        }
    });

}

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
                }
                db.ref("/users/" + username).update({ inGame: true });
                return gameRoom;
            });
        }
    });
}

function updateGameStats(player, opponent) {
    db.ref("/users/" + player).on("value", function (snapshot) {
        document.querySelectorAll(".name").forEach(e => {
            e.textContent = snapshot.val().name;
        });

        // console.log(snapshot.val().name);

        document.querySelectorAll(".match-count").forEach(e => {
            e.textContent = snapshot.val().stats.matchCount;
        });
        document.querySelectorAll(".wins").forEach(e => {
            e.textContent = snapshot.val().stats.wins;
        });
        document.querySelectorAll(".losses").forEach(e => {
            e.textContent = snapshot.val().stats.losses;
        });
    });
    db.ref("/users/" + opponent).on("value", function (snapshot) {
        document.querySelectorAll(".opponent-name").forEach(e => {
            e.textContent = snapshot.val().name;
        });

        // console.log(snapshot.val().name);

        document.querySelectorAll(".opponent-match-count").forEach(e => {
            e.textContent = snapshot.val().stats.matchCount;
        });
        document.querySelectorAll(".opponent-wins").forEach(e => {
            e.textContent = snapshot.val().stats.wins;
        });
        document.querySelectorAll(".opponent-losses").forEach(e => {
            e.textContent = snapshot.val().stats.losses;
        });
    });

}





// Helper functions
function messagePrompt(msg) {
    return confirm(msg);
}

// ----------------- Initialization --------------------
if (sessionStorage.getItem("username")) {
    login(sessionStorage.getItem("username"))
} else {
    loginModalInstance.open()
};