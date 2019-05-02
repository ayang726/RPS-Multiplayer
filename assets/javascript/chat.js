// TESTCODE
// var playerIdentity = "owner";
// const db = firebase.database();

var chatForm = document.querySelector("#chat-form");
var chatBtn = document.querySelector('#chat-btn');
var chatFormOpen = false;
var chatMessages = document.getElementById("chat-messages");

// listening to chats
function listenToChats() {
    db.ref("/gameRooms/" + roomKey + "/chats").on("child_added", function (s) {
        var colorClass;
        console.log("listening to messages, msg - 106");
        if (s.val().identity === "owner") {
            colorClass = "red";
        } else {
            colorClass = "green";
        }

        var span = document.createElement("span");
        span.classList.add("white-text");
        span.textContent = s.val().message;
        var div = document.createElement("div");
        div.classList.add("card-panel", "lighten-2", colorClass);
        div.appendChild(span);
        chatMessages.appendChild(div);
    });
}

chatBtn.addEventListener("click", function (e) {
    if (chatFormOpen) {
        chatForm.getElementsByTagName("input")[0].blur();
        chatForm.style.opacity = 0;
        chatFormOpen = false;
    } else {
        chatForm.style.opacity = 1;
        chatForm.getElementsByTagName("input")[0].focus();
        resetChatFormFadingTimer()
        chatFormOpen = true;
    }
});

chatForm.addEventListener("input", function (e) {
    // console.log("called");
    resetChatFormFadingTimer();
});

chatForm.addEventListener("submit", function (e) {
    e.preventDefault();
    createChat();
});

function createChat() {
    // console.log("called: msg - 104");

    var inputValue = chatForm.getElementsByTagName("input")[0].value;
    if (inputValue !== "") {
        chatForm.getElementsByTagName("input")[0].value = "";

        //pushing chat to db
        db.ref("/gameRooms/" + roomKey + "/chats").push({ "message": inputValue, "identity": playerIdentity });
    }
}





function resetChatFormFadingTimer() {
    var timer;
    var input = chatForm.getElementsByTagName("input")[0];


    if (input.value === "" && document.activeElement !== input) {
        timer = setInterval(() => {
            chatForm.style.opacity -= .01;
            // console.log("called -msg 101");
            if (chatForm.style.opacity <= 0.2) {
                chatForm.style.opacity = 0;
                chatFormOpen = false;
                clearInterval(timer);
            }
        }, 30);
    } else {
        // console.log("called msg-100");
        clearInterval(timer);
    }


}