//helper functions 
const uuidv4Regex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const gameInitalised = new CustomEvent("gameLoaded")

function getRandomInt(max: number): number {
  return Math.floor(Math.random() * max) + 1;
}

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

const hostname = "https://server.baileygamesand.codes"
const port = "443"

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
let hashBanner: HTMLElement
let hashBannerButton: HTMLButtonElement
let loadHashBanner: HTMLElement
let loadHashBannerButton: HTMLButtonElement
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
  let rng = getRandomInt(1000)
  let clickLink = "https://www.myinstants.com/media/sounds/pisseim-mund-online-audio-converter.mp3"
  if (rng >= 990) {
    clickLink = "https://www.myinstants.com/media/sounds/city-boy-loud.mp3"
  }
  const clickSound: HTMLAudioElement = new Audio(clickLink)
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
  hashBanner = document.getElementById("hash-banner") as HTMLDivElement
  hashBannerButton = document.getElementById("show-save") as HTMLButtonElement
  loadHashBanner = document.getElementById("load-banner") as HTMLDivElement
  loadHashBannerButton = document.getElementById("show-load") as HTMLButtonElement

  gameState = new gameData()

  hashBannerButton.addEventListener("click", () => {
    if (hashBanner.style.display === "block") {
        hashBanner.style.display = "none"
        hashBannerButton.innerText = "Show save"
    } else {
        hashBanner.style.display = "block"
        hashBannerButton.innerText = "Hide save"
    }
  })

  loadHashBannerButton.addEventListener("click", () => {
    if (loadHashBanner.style.display === "block") {
        loadHashBanner.style.display = "none"
        loadHashBannerButton.innerText = "Input save"
    } else {
        loadHashBanner.style.display = "block"
        loadHashBannerButton.innerText = "Hide input"
    }
  })
  
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