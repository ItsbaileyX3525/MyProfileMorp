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
let hostname: string
let port: string
let pubserver = true
if (pubserver) {
    hostname = "https://server.baileygamesand.codes"
    port = "443"    
} else {
    hostname = "http://localhost"
    port = "3000"
}


const defaultSave: Record<string, number | Record<string, boolean>> = {
  "score" : 0,
  "purchasedItems" : {
    "hamburger" : false,
    "interactland" : false
  }
}

const purchasables: Record<string, number> = {
    "hamburger" : 85,
    "interactland" : 200
}

class gameData {
   data: Record<string, number | Record<string, boolean>> | null = null;
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
        let loadedData: Record<string, number | Record<string, boolean>>
        loadedData = structuredClone(defaultSave)
        this.data = loadedData
      } else if (data.message == "Data") {
        this.data = structuredClone(JSON.parse(data.data))
        console.log(this.data)
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
  }

  purchase(item: string) {
      let cost = purchasables[item]
      if (this.data === null || typeof this.data.score !== "number") {
        console.log("Data null or score not number")
        return
      }
      const purchasedItems = this.data.purchasedItems
      if (typeof purchasedItems !== "object" || purchasedItems === null) {
        console.log("purchased items not object or null")
        return
      }
      console.log(purchasedItems[item])
      if (purchasedItems[item] === true) return
      if (this.data.score >= cost) {
        console.log("purchased")
        this.data.score -= cost
        purchasedItems[item] = true
        purchaseSFX.play()
        this.save()
        scoreCounter.innerHTML = String(this.data.score)
      } else {
        buzzerSFX.play()
      }
  }
}

//Sounds
const purchaseSFX = new Audio("https://www.myinstants.com/media/sounds/ding-sound-effect_2.mp3")
const buzzerSFX = new Audio("https://www.myinstants.com/media/sounds/wrong-answer-sound-effect.mp3")

//Elements
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
let sidebar: HTMLElement
let interactlandButton: HTMLElement
let closeSidebar: HTMLElement
let scoreAdderTimeout: null | number
let tooltip: HTMLElement
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

  if (typeof gameState.data.score === "number") gameState.data.score += 1
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

function showTooltip(item: string, price: number) {
  tooltip.style.display = "block"
  tooltip.innerText = `Buy ${item} for ${price} clicks`
}

function hideTooltip() {
  tooltip.style.display = "none"
  tooltip.innerText = ``
}

function loadInteractLand() {
  console.log("loading interactland")
}

function loadEventListeners() {
  closeSidebar.addEventListener("click", () => {
    if (sidebar.style.display === "none") {
      sidebar.style.display = "block"
    } else {
      sidebar.style.display = "none"
    }
  })
  hamburgerIcon.addEventListener("click", () => {
    if (gameState.data === null) return
    const purchasedItems = gameState.data.purchasedItems
    if (typeof purchasedItems !== "object" || purchasedItems === null) {
      console.log("purchased items not object or null")
      return
    }
    if (purchasedItems["hamburger"] === true) {
      if (sidebar.style.display === "block") {
        sidebar.style.display = "none"
      } else {
        sidebar.style.display = "block"
      }
      return
    }
    gameState.purchase("hamburger")
  })
  hamburgerIcon.addEventListener("mouseover", () => {
    if (gameState.data === null) return
    const purchasedItems = gameState.data.purchasedItems
    if (typeof purchasedItems !== "object" || purchasedItems === null) {
      console.log("purchased items not object or null")
      return
    }
    if (purchasedItems["hamburger"] === true) return
    showTooltip("hamburger", purchasables["hamburger"])
  })
  hamburgerIcon.addEventListener("mouseout", () => {
    hideTooltip()
  })

  interactlandButton.addEventListener("click", () => {
    if (gameState.data === null) return
    const purchasedItems = gameState.data.purchasedItems
    if (typeof purchasedItems !== "object" || purchasedItems === null) {
      console.log("purchased items not object or null")
      return
    }
    if (purchasedItems["interactland"] === true) {
      loadInteractLand()
    }
    gameState.purchase("interactland")
  })
  interactlandButton.addEventListener("mouseover", () => {
    if (gameState.data === null) return
    const purchasedItems = gameState.data.purchasedItems
    if (typeof purchasedItems !== "object" || purchasedItems === null) {
      console.log("purchased items not object or null")
      return
    }
    if (purchasedItems["interactland"] === true) return
    showTooltip("interactland", purchasables["interactland"])
  })
  interactlandButton.addEventListener("mouseout", () => {
    hideTooltip()
  })

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
}

document.addEventListener("DOMContentLoaded", async () => {
  scoreAdder = document.getElementById("score-add") as HTMLParagraphElement
  scoreCounter = document.getElementById("score-counter") as HTMLParagraphElement
  closeSidebar = document.getElementById("close-sidebar") as HTMLParagraphElement
  interactlandButton = document.getElementById("interactland-btn") as HTMLParagraphElement
  hamburgerIcon = document.getElementById("hamburger") as HTMLDivElement
  loadDataBtn = document.getElementById("load-data-btn") as HTMLButtonElement
  saveIDInput = document.getElementById("save-hash-input") as HTMLInputElement
  hashBanner = document.getElementById("hash-banner") as HTMLDivElement
  hashBannerButton = document.getElementById("show-save") as HTMLButtonElement
  loadHashBanner = document.getElementById("load-banner") as HTMLDivElement
  loadHashBannerButton = document.getElementById("show-load") as HTMLButtonElement
  tooltip = document.getElementById("purchase-tooltip") as HTMLDivElement;
  sidebar = document.getElementById("sidebar") as HTMLDivElement

  document.body.onpointermove = event => {
      const { clientX, clientY } = event;

      tooltip.animate({
          left: `${clientX+5}px`,
          top: `${clientY-20}px`
      
      }, {duration: 700, fill: "forwards"})

  }

  gameState = new gameData()

  loadEventListeners()
})