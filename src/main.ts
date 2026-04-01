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

let gameRunning: boolean = true
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
    if (!gameRunning) return
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
    if (!gameRunning) return
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
    if (!gameRunning) return
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
let appRoot: HTMLDivElement
let mainViewHtml: string = ""
let mainAppClassName: string = ""
let interactlandCoordsText: HTMLParagraphElement
let interactlandViewport: HTMLDivElement
let interactlandViewportItems: HTMLDivElement
let interactlandHomeButton: HTMLParagraphElement
let interactlandButtonInSidebar: HTMLParagraphElement
let interactlandCloseSidebar: HTMLParagraphElement
let interactlandSidebar: HTMLDivElement
let interactlandImgInput: HTMLInputElement
let interactlandImgSubmit: HTMLButtonElement
let interactlandEventController: AbortController | null = null
let interactlandX: number = 0
let interactlandY: number = 0
let interactlandIsDragging: boolean = false
let interactlandStartX: number
let interactlandStartY: number
let interactlandCenterX: number = 0
let interactlandCenterY: number = 0

const interactlandAppClassName = "w-full h-full overflow-hidden m-0 p-0"
const interactlandAppInnerHtml = `
  <div class="cursor-grab w-screen h-screen bg-[linear-gradient(to_right,#333_1px,transparent_1px),linear-gradient(to_bottom,#333_1px,transparent_1px)] bg-size-[100px_100px]" id="viewport">
    <div id="items" class="z-10 absolute top-0 left-0 origin-top-left" style="position: absolute; top: 0; left: 0; transform-origin: top left; z-index: 10;">
    </div>
    <div id="center-crosshair" aria-hidden="true" style="position: fixed; left: 50%; top: 50%; width: 32px; height: 32px; transform: translate(-50%, -50%); pointer-events: none; z-index: 50;">
      <div style="position: absolute; left: 50%; top: 0; width: 2px; height: 100%; transform: translateX(-50%); background: #ff5a36;"></div>
      <div style="position: absolute; left: 0; top: 50%; width: 100%; height: 2px; transform: translateY(-50%); background: #ff5a36;"></div>
      <div style="position: absolute; left: 50%; top: 50%; width: 8px; height: 8px; transform: translate(-50%, -50%); border-radius: 9999px; background: #ff5a36;"></div>
    </div>
  </div>
  <div class="absolute bottom-4 right-1/2 translate-x-1/2 w-auto bg-gray-500 px-1 rounded-2xl z-50" id="coords">Position: 23x 43y</div>
  <div class="absolute bottom-12 right-1/2 translate-x-1/2 w-auto bg-gray-500 px-1 rounded-2xl z-50" id="image-submit">
    <input id="image-input" type="text" placeholder="img link"><button id="image-submit-btn" class="cursor-pointer bg-gray-600 rounded-xl px-0.5">Submit</button>
  </div>
  <div id="sidebar" class="bg-gray-700 z-40 absolute left-0 h-full w-auto top-0">
    <div id="sidebar-items" class="text-xl flex flex-col justify-around items-center h-full">
      <p class="cursor-pointer" id="home-btn">
        Home
      </p>
      <p class="cursor-pointer" id="interactland-btn">
        Interactland
      </p>
      <p class="cursor-pointer" id="close-sidebar">
        Close
      </p>
    </div>
  </div>
`

document.addEventListener("gameLoaded", () => {
  saveHashTxt = document.getElementById("save-hash") as HTMLSpanElement
  saveHashTxt.innerText = gameState.saveID
})

document.addEventListener("click", () => {
    if (!gameRunning) return
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
  if (!gameRunning) return
  tooltip.style.display = "block"
  tooltip.innerText = `Buy ${item} for ${price} clicks`
}

function hideTooltip() {
  if (!gameRunning) return
  tooltip.style.display = "none"
  tooltip.innerText = ``
}

function disposeEmbeddedInteractlandView() {
  if (interactlandEventController) {
    interactlandEventController.abort()
    interactlandEventController = null
  }
}

function updateEmbeddedInteractlandCenter() {
  const rect = interactlandViewport.getBoundingClientRect()
  interactlandCenterX = rect.width / 2
  interactlandCenterY = rect.height / 2
}

function updateEmbeddedInteractlandPosition() {
  const offsetX = interactlandCenterX - interactlandX
  const offsetY = interactlandCenterY - interactlandY

  interactlandViewport.style.backgroundPosition = `${offsetX}px ${offsetY}px`
  interactlandViewportItems.style.transform = `translate3d(${offsetX}px, ${offsetY}px, 0)`
  interactlandCoordsText.innerText = `Position: ${Math.round(interactlandX)}X ${Math.round(interactlandY)}Y`
}

function appendEmbeddedInteractlandImage(imgLink: string, imgX: number, imgY: number) {
  const img = document.createElement("img")
  img.src = imgLink
  img.style.position = "absolute"
  img.style.left = `${Math.round(imgX)}px`
  img.style.top = `${Math.round(imgY)}px`
  img.style.flexShrink = "0"
  img.id = "world-item"
  img.style.minWidth = "0px"
  img.style.maxWidth = "9999px"
  interactlandViewportItems.appendChild(img)
}

async function loadEmbeddedInteractlandImages() {
  const request = await fetch(hostname+":"+port + "/retrieveImages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    }
  })

  if (!request.ok) {
    console.log("fetch request failed")
    return
  }

  const data = await request.json()
  for (const image of data.images) {
    const position = JSON.parse(image.pos) as { x: number; y: number }
    appendEmbeddedInteractlandImage(image.imageLink, position.x, position.y)
  }
}

function setupEmbeddedInteractlandEventListeners() {
  disposeEmbeddedInteractlandView()

  interactlandEventController = new AbortController()
  const { signal } = interactlandEventController

  interactlandViewport.addEventListener("mousedown", (e) => {
    interactlandIsDragging = true
    interactlandViewport.style.cursor = "grabbing"
    interactlandStartX = e.clientX + interactlandX
    interactlandStartY = e.clientY + interactlandY
  }, { signal })

  window.addEventListener("mousemove", (e) => {
    if (!interactlandIsDragging) return

    interactlandX = interactlandStartX - e.clientX
    interactlandY = interactlandStartY - e.clientY
    updateEmbeddedInteractlandPosition()
  }, { signal })

  window.addEventListener("mouseup", () => {
    interactlandIsDragging = false
    interactlandViewport.style.cursor = "grab"
    updateEmbeddedInteractlandPosition()
  }, { signal })

  window.addEventListener("resize", () => {
    updateEmbeddedInteractlandCenter()
    updateEmbeddedInteractlandPosition()
  }, { signal })

  interactlandHomeButton.addEventListener("click", () => {
    restoreMainView()
  }, { signal })

  interactlandButtonInSidebar.addEventListener("click", () => {
    console.log("Already in Interactland")
  }, { signal })

  interactlandCloseSidebar.addEventListener("click", () => {
    if (interactlandSidebar.style.display === "none") {
      interactlandSidebar.style.display = "block"
    } else {
      interactlandSidebar.style.display = "none"
    }
  }, { signal })

  document.addEventListener("keydown", (e) => {
    if (e.key !== "Tab") {
      return
    }

    e.preventDefault()
    if (interactlandSidebar.style.display === "none") {
      interactlandSidebar.style.display = "block"
    } else {
      interactlandSidebar.style.display = "none"
    }
  }, { signal })

  interactlandImgSubmit.addEventListener("click", async () => {
    const imgLink = interactlandImgInput.value

    const request = await fetch(hostname+":"+port + "/upload", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        imageLink: imgLink,
        imagePos: JSON.stringify({
          x: Math.round(interactlandX),
          y: Math.round(interactlandY)
        })
      })
    })

    if (!request.ok) {
      console.log("Save request failed")
      return
    }

    const data = await request.json()
    if (data.success === "true") {
      appendEmbeddedInteractlandImage(imgLink, interactlandX, interactlandY)
      console.log("Image uploaded and loaded")
    } else {
      console.log(data)
    }
  }, { signal })
}

function initialiseEmbeddedInteractlandView(): boolean {
  const nextCoords = document.getElementById("coords") as HTMLParagraphElement | null
  const nextViewport = document.getElementById("viewport") as HTMLDivElement | null
  const nextViewportItems = document.getElementById("items") as HTMLDivElement | null
  const nextHomeButton = document.getElementById("home-btn") as HTMLParagraphElement | null
  const nextInteractlandButton = document.getElementById("interactland-btn") as HTMLParagraphElement | null
  const nextCloseSidebar = document.getElementById("close-sidebar") as HTMLParagraphElement | null
  const nextSidebar = document.getElementById("sidebar") as HTMLDivElement | null
  const nextImgSubmit = document.getElementById("image-submit-btn") as HTMLButtonElement | null
  const nextImgInput = document.getElementById("image-input") as HTMLInputElement | null

  if (!nextCoords || !nextViewport || !nextViewportItems || !nextHomeButton || !nextInteractlandButton || !nextCloseSidebar || !nextSidebar || !nextImgSubmit || !nextImgInput) {
    return false
  }

  interactlandCoordsText = nextCoords
  interactlandViewport = nextViewport
  interactlandViewportItems = nextViewportItems
  interactlandHomeButton = nextHomeButton
  interactlandButtonInSidebar = nextInteractlandButton
  interactlandCloseSidebar = nextCloseSidebar
  interactlandSidebar = nextSidebar
  interactlandImgSubmit = nextImgSubmit
  interactlandImgInput = nextImgInput

  setupEmbeddedInteractlandEventListeners()
  updateEmbeddedInteractlandCenter()
  updateEmbeddedInteractlandPosition()
  loadEmbeddedInteractlandImages()
  return true
}

function setInteractlandViewportMode(enabled: boolean) {
  document.documentElement.style.overflow = enabled ? "hidden" : ""
  document.body.style.overflow = enabled ? "hidden" : ""
}

function restoreMainView() {
  if (!mainViewHtml) {
    return
  }

  disposeEmbeddedInteractlandView()
  setInteractlandViewportMode(false)
  appRoot.className = mainAppClassName
  appRoot.innerHTML = mainViewHtml
  initialiseMainView()
}

async function loadInteractLand() {
  if (!gameRunning) return

  console.log("loading interactland")
  await gameState.save()
  gameRunning = false

  appRoot.className = interactlandAppClassName
  appRoot.innerHTML = interactlandAppInnerHtml
  setInteractlandViewportMode(true)

  const didInitialise = initialiseEmbeddedInteractlandView()
  if (!didInitialise) {
    restoreMainView()
    gameRunning = true
  }
}

window.addEventListener("navigate-home", (event) => {
  if (gameRunning) {
    return
  }

  event.preventDefault()
  restoreMainView()
})

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

function initialiseMainView() {
  appRoot = document.getElementById("app") as HTMLDivElement
  if (!appRoot) {
    return
  }

  if (!mainViewHtml) {
    mainViewHtml = appRoot.innerHTML
  }
  if (!mainAppClassName) {
    mainAppClassName = appRoot.className
  }

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

  gameRunning = true

  document.body.onpointermove = event => {
      if (!gameRunning) return
      const { clientX, clientY } = event;

      tooltip.animate({
          left: `${clientX+5}px`,
          top: `${clientY-20}px`
      
      }, {duration: 700, fill: "forwards"})

  }

  if (!gameState) {
    gameState = new gameData()
  } else if (gameState.data && typeof gameState.data.score === "number") {
    scoreCounter.innerHTML = String(gameState.data.score)
    if (saveHashTxt) {
      saveHashTxt.innerText = gameState.saveID
    }
  }

  loadEventListeners()
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => {
    initialiseMainView()
  }, { once: true })
} else {
  initialiseMainView()
}