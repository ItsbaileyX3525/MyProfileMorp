//helper functions 
const uuidv4Regex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const gameInitalised = new CustomEvent("gameLoaded")

function uuidV4() {
  const uuid = new Array(36);
  for (let i = 0; i < 36; i++) {
    uuid[i] = Math.floor(Math.random() * 16);
  }
  uuid[14] = 4; // set bits 12-15 of time-high-and-version to 0100
  uuid[19] = uuid[19] &= ~(1 << 2); // set bit 6 of clock-seq-and-reserved to zero
  uuid[19] = uuid[19] |= (1 << 3); // set bit 7 of clock-seq-and-reserved to one
  uuid[8] = uuid[13] = uuid[18] = uuid[23] = '-';
  return uuid.map((x) => x.toString(16)).join('');
}

// TODO: Fix storage perms, check ideas.txt
const hostname = "http://127.0.0.1"
const port = "3000"

const defaultSave: Record<string, number> = {
  "score" : 0,

}

class gameData {
   data: Record<string, number> | null = null;
   initialised: boolean = false;
   saveID: string;

   constructor() {
    this.saveID = uuidV4()
    this.loadDataFromUUID()
   }

   async loadDataFromUUID(): Promise<void> {
    console.log(this.saveID)
    if (this.saveID === undefined || this.saveID === null) {return}
    
    const request = await fetch(hostname+":"+port + "/retrieve", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ saveID: this.saveID })
    })

    if (!request.ok) {
      console.log("Request failed womp")
      return
    }

    const data = await request.json()

    if (data.success === "true") {
      console.log("Data retrieved")
      if (data.message === "NoData") {
        let loadedData: Record<string, number>
        loadedData = structuredClone(defaultSave)
        this.data = loadedData
      } else if (data.message == "Data") {
        //let loadedData: Record<string, number>
        this.data = structuredClone(JSON.parse(data.data))
        console.log("new saved data: " + this.data)
        if (this.data === null) return
        console.log("score: " + this.data.score)
      }
    } else {
      console.log("Error retrieving data")
    }

    if (!this.data) return
    if (!this.initialised) {
      this.initialised = true
      document.dispatchEvent(gameInitalised)
    }

    scoreCounter.innerHTML = String(this.data.score)
    if (saveHashTxt) saveHashTxt.innerText = this.saveID
   }

   async save() {
    console.log("Saving game state")
    if (!this.initialised || !this.data) return

    const request = await fetch(hostname+":"+port + "/save", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ saveID: this.saveID, saveData: JSON.stringify(this.data) })
    })

    if (!request.ok) {
      console.log("Save request failed")
      return
    }

    const data = await request.json()

    console.log(data)
}}

let hamburgerIcon: HTMLElement
let gameState: gameData
let saveHashTxt: HTMLSpanElement
let scoreCounter: HTMLElement
let loadDataBtn: HTMLElement
let scoreAdder: HTMLElement
let saveIDInput: HTMLInputElement
let scoreAdderTimeout: null | number

let updateCounter: number = 0

document.addEventListener("gameLoaded", () => {
  saveHashTxt = document.getElementById("save-hash") as HTMLSpanElement
  saveHashTxt.innerText = gameState.saveID
})

document.addEventListener("click", () => {
  if(!gameState) {
    console.log("Still waiting for game to load")
    return
  }

  if (!gameState.initialised || gameState.data === null) {
    return
  }

  gameState.data.score += 1
  const clickSound: HTMLAudioElement = new Audio("https://www.myinstants.com/media/sounds/pisseim-mund-online-audio-converter.mp3")
  clickSound.play()
  clickSound.addEventListener("ended", () => {
    //Causes an error in the console but fuck if I care
    clickSound.pause()
    clickSound.remove()
  })
  console.log("clicked, +1 score, new score: " + gameState.data.score)
  scoreCounter.innerHTML = String(gameState.data.score)
  updateCounter++
  if (updateCounter >= 5) {
    gameState.save()
    updateCounter = 0
  }
  

  scoreAdder.style.display = "block"
  if (scoreAdderTimeout !== null){
    clearTimeout(scoreAdderTimeout)
  }
  
  scoreAdderTimeout = setTimeout(() => {
    scoreAdder.style.display = "none"
  }, 200);
})


document.addEventListener("DOMContentLoaded", async () => {
  scoreAdder = document.getElementById("score-add") as HTMLParagraphElement
  scoreCounter = document.getElementById("score-counter") as HTMLParagraphElement
  hamburgerIcon = document.getElementById("hamburger") as HTMLDivElement
  hamburgerIcon.addEventListener("click", () => {
      console.log("Clicked hamburger")
  })
  loadDataBtn = document.getElementById("load-data-btn") as HTMLButtonElement
  saveIDInput = document.getElementById("save-hash-input") as HTMLInputElement

  gameState = new gameData()

  loadDataBtn.addEventListener("click", () => {
    if (!gameState.initialised) {
      console.log("Please wait for game to load")
      return
    }
    if (!saveIDInput.value) return

    //Attempt to update saveid
    const valid = uuidv4Regex.test(saveIDInput.value)
    if (!valid) {
      console.log("Please enter a valid uuidv4")
      return
    }
    gameState.saveID = saveIDInput.value
    gameState.loadDataFromUUID()
  })
})