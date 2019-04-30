document.getElementById("version").textContent = "v0.35";


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
var playerIdentity = null;
var opponentIdentity = null;
var ownerObject = {};
var guestObject = {}
var connected = false;
// var roomFull = false;

// Creating a room
document.querySelector("#create-room").addEventListener("click", function (e) {
    e.preventDefault();
    playerIdentity = "owner";
    opponentIdentity = "guest"
    var name = document.querySelector("#name-input").value.trim();
    if (name !== "") {
        var roomRef = db.ref("/gameRooms").push({
            full: false,
            connected: false,
            owner: {
                name: name,
                ready: false,
                wins: 0,
                losses: 0,
                ties: 0,
                matchCount: 0,
                choice: null
            }
        });
        roomKey = roomRef.key;
        loginModalInstance.close();

        // display owner name
        document.querySelectorAll(".owner-name").forEach(function (e) {
            e.textContent = name
        });
        // opening lobby modal
        lobbyModalInstance.open();

        db.ref("/gameRooms/" + roomKey + "/guest").on("value", function (s) {
            if (s.exists()) {
                document.querySelectorAll(".guest-name").forEach(function (e) {
                    e.textContent = s.val().name;
                });

                // if guest joined the game, set ready status
                console.log("a guest joined the room: " + s.val().name);
                document.querySelector("#ready-btn").classList.add("pulse");
                document.querySelector("#ready-btn").classList.remove("disabled");
                document.querySelector("#wait-spinner").classList.remove("active");

                db.ref("/gameRooms/" + roomKey + "/guest").off();
            }
        });
        // disconnection logic:
        db.ref("/gameRooms/" + roomKey).onDisconnect().remove();
    }
});

document.querySelector("#join-room").addEventListener("click", function (e) {
    e.preventDefault();
    playerIdentity = "guest";
    opponentIdentity = "owner";
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
                            losses: 0,
                            ties: 0,
                            matchCount: 0,
                            choice: null
                        },
                        full: true
                    })
                    return;
                }
            });
            if (roomKey) {

                db.ref("/gameRooms/" + roomKey + "/owner").once("value", function (s) {
                    if (s.exists()) {
                        document.querySelectorAll(".owner-name").forEach(function (e) {
                            e.textContent = s.val().name;
                        });

                        loginModalInstance.close();

                        // display guest name
                        document.querySelectorAll(".guest-name").forEach(function (e) {
                            e.textContent = name;
                        });

                        // opening lobby modal
                        lobbyModalInstance.open();
                        console.log("Joining the room with owner " + s.val().name);
                        document.querySelector("#ready-btn").classList.add("pulse");
                        document.querySelector("#ready-btn").classList.remove("disabled");
                        document.querySelector("#wait-spinner").classList.remove("active");

                    }

                });
                // on disconnect destroy room
                db.ref("/gameRooms/" + roomKey).onDisconnect().remove();
            }
        });

    }
});

document.querySelector("#ready-btn").addEventListener("click", function (e) {
    e.preventDefault();
    console.log("Starting game in room: " + roomKey);
    // display player ready
    document.querySelector("#ready-btn").classList.remove("pulse");
    document.querySelector("#ready-btn").classList.remove("red");
    document.querySelector("#ready-btn").classList.add("green");
    // push player ready status
    db.ref("/gameRooms/" + roomKey + "/" + playerIdentity).update({ "ready": true });
    if (playerIdentity === "owner") {
        db.ref("/gameRooms/" + roomKey + "/guest/ready").on("value", function (s) {
            if (s.val() === true) {
                db.ref("/gameRooms/" + roomKey).update({ "connected": true });
                db.ref("/gameRooms/" + roomKey + "/guest/ready").off();
            }
        });
    }


    // wait on connected bit
    db.ref("/gameRooms/" + roomKey + "/connected").on("value", function (s) {
        if (s.val() === true) {
            db.ref("/gameRooms/" + roomKey + "/connected").off()
            setupListeners();
            updateData();
            // Start the game
            lobbyModalInstance.close();
            setupGame();
        }
    });
});

function setupListeners() {
    db.ref("/gameRooms/" + roomKey + "/connected").on("value", function (s) {
        if (s.val() !== true) {
            db.ref("/gameRooms/" + roomKey + "/connected").off();
            console.log("Opponent has left the room");
            alert("Opponent has left the room");
            location.reload();
        }
    });
}

function updateData() {

    db.ref("/gameRooms/" + roomKey + "/owner").once("value", function (s) {
        ownerObject = s.val();
        document.querySelectorAll(".owner-name").forEach(function (e) {
            e.textContent = s.val().name;
        });
        document.querySelectorAll(".owner-wins").forEach(function (e) {
            e.textContent = s.val().wins;
        });
        document.querySelectorAll(".owner-losses").forEach(function (e) {
            e.textContent = s.val().losses;
        });
        document.querySelectorAll(".owner-match-count").forEach(function (e) {
            e.textContent = s.val().matchCount;
        });

        if (playerIdentity === "owner") {
            updateDataForPlayer(s);
        }
    });

    db.ref("/gameRooms/" + roomKey + "/guest").once("value", function (s) {
        guestObject = s.val();
        document.querySelectorAll(".guest-name").forEach(function (e) {
            e.textContent = s.val().name;
        });
        document.querySelectorAll(".guest-wins").forEach(function (e) {
            e.textContent = s.val().wins;
        });
        document.querySelectorAll(".guest-losses").forEach(function (e) {
            e.textContent = s.val().losses;
        });
        document.querySelectorAll(".guest-match-count").forEach(function (e) {
            e.textContent = s.val().wins + s.val().losses + s.val().ties;
        });

        if (playerIdentity === "guest") {
            updateDataForPlayer(s);
        }
    });
}

function updateDataForPlayer(s) {
    document.querySelectorAll(".name").forEach(function (e) {
        e.textContent = s.val().name;
    });
    document.querySelectorAll(".wins").forEach(function (e) {
        e.textContent = s.val().wins;
    });
    document.querySelectorAll(".losses").forEach(function (e) {
        e.textContent = s.val().losses;
    });
    document.querySelectorAll(".match-count").forEach(function (e) {
        e.textContent = s.val().wins + s.val().losses;
    });
}


function setupGame() {
    document.querySelector("#game-room").classList.remove("hidden");
    var playerRock;
    var playerPaper;
    var playerScissors;
    var opponentRock;
    var opponentPaper;
    var opponentScissors;

    var choices;
    var chosen;
    var message = document.querySelector("#game-message");
    var ownerChosen = document.querySelector("#owner-chosen");
    var guestChosen = document.querySelector("#guest-chosen");

    if (playerIdentity == "owner") {

        playerRock = document.querySelector(`#owner-rock`);
        playerPaper = document.querySelector(`#owner-paper`);
        playerScissors = document.querySelector(`#owner-scissors`);

        opponentRock = document.querySelector(`#guest-rock`);
        opponentPaper = document.querySelector(`#guest-paper`);
        opponentScissors = document.querySelector(`#guest-scissors`);

        opponentRock.classList.add("hidden");
        opponentPaper.classList.add("hidden");
        opponentScissors.classList.add("hidden");

    }
    if (playerIdentity == "guest") {

        playerRock = document.querySelector(`#guest-rock`);
        playerPaper = document.querySelector(`#guest-paper`);
        playerScissors = document.querySelector(`#guest-scissors`);

        opponentRock = document.querySelector(`#owner-rock`);
        opponentPaper = document.querySelector(`#owner-paper`);
        opponentScissors = document.querySelector(`#owner-scissors`);

        opponentRock.classList.add("hidden");
        opponentPaper.classList.add("hidden");
        opponentScissors.classList.add("hidden");
    }

    choices = document.querySelectorAll(`.${playerIdentity}-choices`);
    choices.forEach(function (choice) {
        choice.addEventListener("click", function () {
            choices.forEach(function (c) {
                c.classList.add("hidden");
            });
            choice.classList.remove("hidden");
            chosen = choice.getAttribute("value");
            console.log("chose " + chosen);

            dbRoomRef([playerIdentity]).update({ choice: chosen });
            dbRoomRef([opponentIdentity, "choice"]).on("value", function (s) {
                if (s.exists()) {
                    dbRoomRef([opponentIdentity, "choice"]).off();
                    // display animation
                    message.textContent = "Ready?"
                    setTimeout(() => {
                        var counter = 3;
                        choice.classList.add("hidden");
                        var timer = setInterval(() => {
                            message.textContent = counter--;
                            if (counter <= 0) {
                                clearInterval(timer);
                                message.classList.add("hidden");
                                switch (s.val()) {
                                    case "r": opponentRock.classList.remove("hidden");
                                        break;
                                    case "p": opponentPaper.classList.remove("hidden");
                                        break;
                                    case "s": opponentScissors.classList.remove("hidden");
                                        break;
                                }
                                choice.classList.remove("hidden");
                                calculateWin();
                                // listening to matchCount increases
                                dbRoomRef(["owner", "matchCount"]).on("value", function (s) {
                                    console.log("executed msg-102");
                                    console.log("matchCount on server: " + s.val());
                                    console.log("local match count = " + ownerObject.matchCount);
                                    if (s.val() === ownerObject.matchCount + 1) {
                                        // match result updated
                                        dbRoomRef(["owner", "matchCount"]).off();
                                        updateData();
                                        setTimeout(() => {
                                            resetGame();
                                        }, 2000);

                                    } else {
                                        console.log("Something is wrong: MSG - 900");
                                    }
                                });
                                // set up another round of game
                            }
                        }, 1000);
                    }, 600);

                } else {
                    message.textContent = "Waiting for opponent to choose";
                }
            });
        });
    });
}

function calculateWin() {
    if (playerIdentity === "owner") {
        dbRoomRef([]).once("value", function (s) {
            var ownerChoice = s.val().owner.choice;
            var guestChoice = s.val().guest.choice;
            var combination = ownerChoice + guestChoice;

            if (ownerChoice === guestChoice) {
                // tied
                dbRoomRef(["owner"]).update({ "ties": s.val().owner.ties + 1 });
                dbRoomRef(["guest"]).update({ "ties": s.val().guest.ties + 1 });
            } else if (combination === "pr" || combination === "sp" || combination === "rs") {
                // owner wins
                dbRoomRef(["owner"]).update({ "wins": s.val().owner.wins + 1 });
                dbRoomRef(["guest"]).update({ "losses": s.val().guest.losses + 1 });
            } else {
                //guest wins
                dbRoomRef(["owner"]).update({ "losses": s.val().owner.losses + 1 });
                dbRoomRef(["guest"]).update({ "wins": s.val().guest.wins + 1 });
            }

            dbRoomRef(["owner"]).update({ "matchCount": s.val().owner.matchCount + 1 });
            dbRoomRef(["guest"]).update({ "matchCount": s.val().guest.matchCount + 1 });

        });
    }
}


function resetGame() {
    console.log("Reseting Game...");
    var rock = document.querySelector(`#${playerIdentity}-rock`);
    var paper = document.querySelector(`#${playerIdentity}-paper`);
    var scissors = document.querySelector(`#${playerIdentity}-scissors`);
    rock.classList.remove("hidden");
    paper.classList.remove("hidden");
    scissors.classList.remove("hidden");


    rock.parentNode.replaceChild(rock.cloneNode(true), rock);
    paper.parentNode.replaceChild(paper.cloneNode(true), paper);
    scissors.parentNode.replaceChild(scissors.cloneNode(true), scissors);

    var message = document.querySelector("#game-message");
    message.textContent = "";
    message.classList.remove("hidden");

    setupGame();
}

// Helper functions

function dbRoomRef(pathArray) {
    var relativePath = "";
    pathArray.forEach(e => {
        relativePath += "/" + e;
    });
    return db.ref("/gameRooms/" + roomKey + relativePath);
}

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