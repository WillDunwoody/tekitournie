import { Controller } from "@hotwired/stimulus"
import { end } from "@popperjs/core"
import { createConsumer } from "@rails/actioncable"
import { codeEditorOne } from "solution_controller"


export default class extends Controller {
  static values = { gameId: Number, userId: Number, playerOneId: Number, playerTwoId: Number, loaded: Boolean }
  static targets = ["solutions"]

  connect() {
    this.channel = createConsumer().subscriptions.create(
      { channel: "GameChannel", id: this.gameIdValue },
      { received: data => { if(data == "update page") { this.updatePlayerOnePage() } } }
    )
    console.log(`Subscribe to the chatroom with the id ${this.gameIdValue}.`);
    console.log(`The current user is ${this.userIdValue}`);
    console.log(`Player one's current Id is ${this.playerOneIdValue}`)
    console.log(`Player two's current Id is ${this.playerTwoIdValue}`)
    //Checks default value of the game then updates
    //the game with correct user id's for player one and player two.

    if (this.playerOneIdValue === 1) {
      this.updatePlayerOneId()
    } else if (this.playerOneIdValue !== this.userIdValue && this.playerTwoIdValue !== this.userIdValue ) {
      this.updatePlayerTwoId()
    }

    codeEditorOne();

    this.updatePlaterOneEditor()
  }

  updatePlayerOneId() {
    //Creates a form and sends it to to the server to update the game,
    //changing player_one_id from the default 1 to the id of the first user

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

  updatePlayerTwoId() {
    //Creates a form and sends it to to the server to update the game,
    //changing player_two_id from the default 1 to the id of the second user

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
    console.log(this.loadedValue)
    if(this.loadedValue === false) {
      location.reload()
      this.loadedValue = true
    }
    console.log(this.loadedValue)
  }

  updatePlaterOneEditor() {
    window.onload = (event) => {
      // let editor_one = document.getElementsByClassName('cm-s-codeMirrorEditorOne').item(0).innerText;
      // console.log(window.CodeMirror)
      // console.log(editor_one)
      console.log(document.getElementsByClassName('cm-s-codeMirrorEditorOne'))

    };
  }

}
