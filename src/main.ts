//helper functions 
const uuidv4Regex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const gameInitalised = new CustomEvent("gameLoaded")

function uuidV4() {
  const uuid = new Array(36);
  for (let i = 0; i < 36; i++) {
    uuid[i] = Math.floor(Math.random() * 16);
  }
  uuid[14] = 4;
  uuid[19] = uuid[19] &= ~(1 << 2);
  uuid[19] = uuid[19] |= (1 << 3);
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
      return
    }

    const data = await request.json()

    if (data.success === "true") {
      if (data.message === "NoData") {
        let loadedData: Record<string, number>
        loadedData = structuredClone(defaultSave)
        this.data = loadedData
      } else if (data.message == "Data") {
        this.data = structuredClone(JSON.parse(data.data))
        if (this.data === null) return
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
  clickSound.play().catch(() => {}) // Stops the error in console from happening
  clickSound.addEventListener("ended", () => {
    clickSound.pause()
    clickSound.remove()
  })
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
    if (!gameState.initialised) return
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