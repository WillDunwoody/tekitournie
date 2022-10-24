import { Controller } from "@hotwired/stimulus"
import { end } from "@popperjs/core"
import { createConsumer } from "@rails/actioncable"
const codemirror = require("../codemirror/codemirror");


export default class extends Controller {
  static values = {
    gameId: Number,
    userId: Number,
    playerOneId: Number,
    playerTwoId: Number,
    loaded: Boolean,
    gameRoundMethod: String
  }

  static targets = [
    "editorone",
    "editortwo",
    "output",
    "solutions",
    "roundWinner",
    "roundWinnerModal"
  ]

  initialize() {
    // defining the theme of codemirror depending on user
    let playerOneTheme = ''
    let playerTwoTheme = ''
    this.editor_one_code = ''
    if(this.playerOneIdValue == this.userIdValue) {
      playerOneTheme = "dracula";
      playerTwoTheme = "dracula_blurred";
    } else if(this.playerTwoIdValue == this.userIdValue) {
      playerOneTheme = "dracula_blurred";
      playerTwoTheme = "dracula";
    }
    // Generating codemirror windows
    this.editor_one = codemirror.fromTextArea(
      this.editoroneTarget, {
        mode: "ruby",
        theme: playerOneTheme,
        lineNumbers: true
      }
    );
    this.editor_two = codemirror.fromTextArea(
      this.editortwoTarget, {
        mode: "ruby",
        theme: playerTwoTheme,
        lineNumbers: true
      }
    );
    // setting the challenge default method in codemirror windows
    this.editor_one.setValue(this.gameRoundMethodValue.replaceAll('\\n', '\n'));
    this.editor_two.setValue(this.gameRoundMethodValue.replaceAll('\\n', '\n'));

    setInterval(() => {
      const token = document.getElementsByName("csrf-token")[0].content
      fetch(`/games/${this.gameIdValue}/user_code`, {
        method: "POST",
        credentials: "same-origin",
        headers: {
          "X-CSRF-Token": token,
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
      })
      .then((response) => response.json())
      .then(data => this.updatePlayerOneEditor(data))
    }, 2000);
  }

  connect() {
    this.channel = createConsumer().subscriptions.create(
      { channel: "GameChannel", id: this.gameIdValue },
      { received: data => { if(data == "update page") { this.updatePlayerOnePage() } } }
    )
    console.log(`Subscribe to the chatroom with the id ${this.gameIdValue}.`);
    console.log(`The current user is ${this.userIdValue}`);
    console.log(`Player one's current Id is ${this.playerOneIdValue}`)
    console.log(`Player two's current Id is ${this.playerTwoIdValue}`)

    // modal stuff
    const modal = document.getElementById("roundWinnerModal");
    const span = document.getElementsByClassName("round-winner-modal-close")[0];
    span.onclick = function() {
      modal.style.display = "none";
    }
    window.onclick = function(event) {
      if (event.target == modal) {
        modal.style.display = "none";
      }
    }

    //Checks default value of the game then updates
    //the game with correct user id's for player one and player two.
    if (this.playerOneIdValue === 1) {
      this.updatePlayerOneId()
    } else if (this.playerOneIdValue !== this.userIdValue && this.playerTwoIdValue !== this.userIdValue ) {
      this.updatePlayerTwoId()
    }
    // this.editorOneRefresh()
  }

  currentUsersEditor() {
    if(this.userIdValue == this.playerOneIdValue) {
      return this.editor_one
    } else {
      return this.editor_two
    }
  }

  updatePlayerOneId() {
    let playerOnesForm = new FormData()
    playerOnesForm.append("game[player_one_id]", this.userIdValue)
    const token = document.getElementsByName("csrf-token")[0].content

    fetch(this.data.get("update-url"), {
      body: playerOnesForm,
      method: 'PATCH',
      credentials: "include",
      dataType: "script",
      headers: {
              "X-CSRF-Token": token
       },
    }).then(function(response) {
      if (response.status != 204) {
          console.log("This worked")
      }
    })

    // console.log(`Player one's new id is ${this.playerOneIdValue}`)
    this.updatePage()
  }

  //Creates a form and sends it to to the server to update the game,
  //changing player_two_id from the default 1 to the id of the second user
  updatePlayerTwoId() {
    let playerTwosForm = new FormData()
    playerTwosForm.append("game[player_two_id]", this.userIdValue)
    const token = document.getElementsByName("csrf-token")[0].content

    fetch(this.data.get("update-url"), {
      body: playerTwosForm,
      method: 'PATCH',
      credentials: "include",
      dataType: "script",
      headers: {
              "X-CSRF-Token": token
       },
    }).then(function(response) {
      if (response.status != 204) {
          console.log("This worked")
      }
    })

    this.updatePage()
    // console.log(`Player two's new id is ${this.playerTwoIdValue}`)
  }

  updatePage() {
    location.reload()
    // this.data.get("loaded") = true
  }

  updatePlayerOnePage() {
    // console.log(this.loadedValue)
    if(this.loadedValue === false) {
      location.reload()
      this.loadedValue = true
    }


    // console.log(this.loadedValue)
    // console.log(this.editor_one.getValue())
  }

  playerOneOrTwo() {
    return ((this.userIdValue === this.playerOneIdValue) ? "one" : "two")
  }

  editorOneOrTwo() {
    return ((this.userIdValue === this.playerOneIdValue) ? this.editor_one : this.editor_two)
  }

  //This may not be needed, we could maybe just use playerOneTyping.

  playerOneTyping() {
    let playerOneCodeForm = new FormData()
    playerOneCodeForm.append(`game[player_${this.playerOneOrTwo()}_code]`, this.editorOneOrTwo().getValue())
    const token = document.getElementsByName("csrf-token")[0].content

    fetch(this.data.get("update-url"), {
      body: playerOneCodeForm,
      method: 'PATCH',
      credentials: "include",
      dataType: "script",
      headers: {
              "X-CSRF-Token": token
       },
    }).then(function(response) {
      if (response.status != 204) {
        console.log("This worked")
      }
    })
  }

  // Code submissions and sendCode function
  clearPlayerOneSubmission(){
    this.editor_one.setValue(this.gameRoundMethodValue.replaceAll('\\n', '\n'));
  }
  clearPlayerTwoSubmission(){
    this.editor_two.setValue(this.gameRoundMethodValue.replaceAll('\\n', '\n'));
  }

  playerOneSubmission() {
    this.sendCode(this.editor_one.getValue(), this.userIdValue);
  }
  playerTwoSubmission() {
    this.sendCode(this.editor_two.getValue(), this.userIdValue);
  }

  sendCode(code, user_id) {
    const token = document.getElementsByName("csrf-token")[0].content
    fetch(`/games/${this.gameIdValue}/game_test`, {
      method: "POST",
      credentials: "same-origin",
      headers: {
        "X-CSRF-Token": token,
        "Content-Type": "application/json",
        "Accept": "application/json"
      },
      body: JSON.stringify({ player_two_code: code, user_id: user_id }),
    })
    .then((response) => response.json())
    .then(data => {
      this.outputTarget.innerText = data.results;
      this.roundWinnerTarget.innerText = data.round_winner;
      if(data.round_winner.includes('wins')){
        this.roundWinnerModalTarget.style.display = "block";
      }
    })
  }

  updatePlayerOneEditor(data) {
    if(this.userIdValue === this.playerTwoIdValue) {
      this.editor_one.setValue(data)
    }
  }

  nextRound() {
    this.updatePage();
  }
}
