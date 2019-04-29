// Materialize Initialization
var elems = document.querySelectorAll('.modal');
var instances = M.Modal.init(elems, {});

var elems = document.querySelectorAll('.fixed-action-btn');
var instances = M.FloatingActionButton.init(elems, {});
///////////////////////////////////////////////////
var loginModal = document.getElementById("login-modal");
const loginModalInstance = M.Modal.getInstance(loginModal)
const db = firebase.database();
const playerRefKey = "playerRef";
var playerRef;

loginModalInstance.open();

// Log in modal form functions

document.querySelector("#btn-login").addEventListener("click", function (e) {
    e.preventDefault();

    var name = document.querySelector("#name-input").value
    if (name != "") {
        playerRef = db.ref("/users/").push({
            name: name,
            inGame: false,
            stats: {
                losses: 0,
                matchCount: 0,
                wins: 0
            }
        });
        console.log(`${name} logging in with ID: ${playerRef.key}`);
        login(playerRef);
    }
});

// Log in / out functions
function login(playerRef) {
    playerRef.on("value", function (snapshot) {
        document.querySelectorAll(".name").forEach(function (e) {
            e.textContent = snapshot.val().name;
        });
        document.querySelectorAll(".match-count").forEach(function (e) {
            e.textContent = snapshot.val().stats.matchCount;
        });
        document.querySelectorAll(".wins").forEach(function (e) {
            e.textContent = snapshot.val().stats.wins;
        });
        document.querySelectorAll(".losses").forEach(function (e) {
            e.textContent = snapshot.val().stats.losses;
        });
        if (snapshot.val().invitationReceived !== undefined) {
            receivingInvitation(snapshot.val().invitationReceived);
        }
    });
    loginModalInstance.close();
    // sessionStorage.setItem(playerRefKey, playerRef.key);

    // Updating player list
    db.ref("/users").on("child_added", function (child) {
        populatePlayerList(child);
    });
    db.ref("/users").on("child_removed", function (child) {
        // console.log("A child has been removed");
        removeFromPlayerList(child);
    });

    playerRef.onDisconnect().remove();
}

function populatePlayerList(player) {
    var html =
        `
            <h5>${player.val().name}
                <span class="badge lighten-2 match-count" data-badge-caption="waiting"></span>
            </h5>
        `
    var li = document.createElement("li");
    li.classList.add("player", "collection-item")
    if (player.key === playerRef.key) {
        li.classList.add("self");

    } else {
        li.classList.add("opponent");
        li.addEventListener("click", function (e) {
            // create an invite
            sendInviteTo(player);
        });
    }
    li.setAttribute("playerID", player.key);
    li.innerHTML = html;

    document.getElementById("player-list").appendChild(li)
}

function removeFromPlayerList(player) {
    var elements = document.querySelectorAll(".player");
    elements.forEach(e => {
        if (e.getAttribute("playerID") === player.key) {
            document.querySelector("#player-list").removeChild(e);
        }
    });
}

function sendInviteTo(player) {
    console.log("sending invitation");
    db.ref("/users/" + player.key).once("value", function (s) {
        if (s.val().inGame === false) {
            playerRef.once("value", function (s) {
                var invitationRef = db.ref("/users/" + player.key + "/invitationReceived").push({ userId: playerRef.key, name: s.val().name });
                db.ref("/users/" + playerRef.key + "/invitationSent/" + invitationRef).set({ userId: player.key, name: player.key });
            });
        }
    });
}

function receivingInvitation(invitationObj) {
    for (const key in invitationObj) {
        if (invitationObj.hasOwnProperty(key)) {
            const e = invitationObj[key];

            var li = document.createElement("li");
            li.classList.add("btn-floating", "green");
            li.textContent = e.name;
            li.setAttribute("userId", e.userId);
            li.addEventListener("click", function () {
                console.log("joining game with " + e.name + ": " + e.userId);


                db.ref("/users/" + e.userId).once("value", function (s) {
                    if (s.val().inGame === false) {
                        // adding opponent if not in game add to game
                        db.ref("/users/" + e.userId).on("value", function (snapshot) {
                            document.querySelectorAll(".opponent-name").forEach(function (e) {
                                e.textContent = snapshot.val().name;
                            });
                            document.querySelectorAll(".opponent-match-count").forEach(function (e) {
                                e.textContent = snapshot.val().stats.matchCount;
                            });
                            document.querySelectorAll(".opponent-wins").forEach(function (e) {
                                e.textContent = snapshot.val().stats.wins;
                            });
                            document.querySelectorAll(".opponent-losses").forEach(function (e) {
                                e.textContent = snapshot.val().stats.losses;
                            });
                        });
                    }
                    
                    // Send invitation back
                    db.ref("/users/" + e.userId)
                    // clear all other invitations
                });
            });
        };

        document.getElementById("invitation-list").appendChild(li);
    }
}
