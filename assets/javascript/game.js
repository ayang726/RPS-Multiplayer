// Materialize Initialization
var elems = document.querySelectorAll('.modal');
var instances = M.Modal.init(elems, { "dismissible": false });

// var elems = document.querySelectorAll('.fixed-action-btn');
// var instances = M.FloatingActionButton.init(elems, {});
///////////////////////////////////////////////////
const loginModal = document.getElementById("login-modal");
const loginModalInstance = M.Modal.getInstance(loginModal);
const lobbyModal = document.getElementById("lobby-modal");
const lobbyModalInstance = M.Modal.getInstance(lobbyModal);

const db = firebase.database();
loginModalInstance.open();

var roomKey;

// Creating a room
document.querySelector("#create-room").addEventListener("click", function (e) {
    e.preventDefault();
    var name = document.querySelector("#name-input").value.trim();
    if (name !== "") {
        var roomRef = db.ref("/gameRooms").push({
            full: false,
            inGame: false,
            owner: {
                name: name,
                ready: false,
                wins: 0,
                losses: 0
            }
        });
        roomKey = roomRef.key;
        loginModalInstance.close();

        // opening lobby modal
        lobbyModalInstance.open();

        roomRef.on("value", function (s) {
            if (s.val().owner) {
                document.querySelectorAll(".owner-name").forEach(function (e) {
                    e.textContent = s.val().owner.name;
                });
                document.querySelectorAll(".owner-wins").forEach(function (e) {
                    e.textContent = s.val().owner.wins;
                });
                document.querySelectorAll(".owner-losses").forEach(function (e) {
                    e.textContent = s.val().owner.losses;
                });
            }

            if (s.val().guest) {
                document.querySelectorAll(".guest-name").forEach(function (e) {
                    e.textContent = s.val().guest.name;
                });
                document.querySelectorAll(".guest-wins").forEach(function (e) {
                    e.textContent = s.val().guest.wins;
                });
                document.querySelectorAll(".guest-losses").forEach(function (e) {
                    e.textContent = s.val().guest.losses;
                });

                // if guest joined the game, set ready status
                console.log("a guest joined the room: " + s.val().guest.name);
                document.querySelector("#ready-btn").classList.add("pulse");
                document.querySelector("#ready-btn").classList.remove("disabled");
                document.querySelector("#wait-spinner").classList.remove("active");
            }

        });

        // disconnection logic:
        db.ref("/gameRooms/" + roomKey + "/owner").onDisconnect().remove();
    }
});

document.querySelector("#join-room").addEventListener("click", function (e) {
    e.preventDefault();
    var name = document.querySelector("#name-input").value.trim();
    if (name !== "") {
        db.ref("/gameRooms").once("value", function (s) {
            s.forEach(function (room) {
                if (room.val().full === false) {
                    roomKey = room.key;
                    db.ref("/gameRooms/" + room.key).update({
                        guest: {
                            name: name,
                            ready: false,
                            wins: 0,
                            losses: 0
                        },
                        full: true
                    })
                    return;
                }
            });
            if (roomKey) {
                db.ref("/gameRooms/" + roomKey).on("value", function (s) {
                    if (s.val().owner) {
                        document.querySelectorAll(".owner-name").forEach(function (e) {
                            e.textContent = s.val().owner.name;
                        });
                        document.querySelectorAll(".owner-wins").forEach(function (e) {
                            e.textContent = s.val().owner.wins;
                        });
                        document.querySelectorAll(".owner-losses").forEach(function (e) {
                            e.textContent = s.val().owner.losses;
                        });

                        loginModalInstance.close();
                        // opening lobby modal
                        lobbyModalInstance.open();
                        console.log("Joining the room with owner " + s.val().owner.name);
                        document.querySelector("#ready-btn").classList.add("pulse");
                        document.querySelector("#ready-btn").classList.remove("disabled");
                        document.querySelector("#wait-spinner").classList.remove("active");
                    }

                    if (s.val().guest) {
                        document.querySelectorAll(".guest-name").forEach(function (e) {
                            e.textContent = s.val().guest.name;
                        });
                        document.querySelectorAll(".guest-wins").forEach(function (e) {
                            e.textContent = s.val().guest.wins;
                        });
                        document.querySelectorAll(".guest-losses").forEach(function (e) {
                            e.textContent = s.val().guest.losses;
                        });

                        // if guest joined the game, set ready status


                    }

                });
            }
        });

    }
});

document.querySelector("#ready-btn").addEventListener("click", function (e) {
    e.preventDefault();
    console.log("Starting game in room: " + roomKey);
});


// Log in modal form functions

/*
    Join or Create a Game Room

    Creating a game room:
    must enter a name
        create a room object in firebase
            room object contains owner of the room, guest of the room,
            each user has stats/ number of wins in this room

    Wait for the next player to join the room
    can leave the room by refreshing the page or by closing it
    an empty room will be destroyed
    once another player join the room start the game

    Joining a room
    start the game right away
    can leave the room
    an empty room will be destroyed

*/