const defaultSave: Record<string, number> = {
  "score" : 0,

}

class gameData {
   data: Record<string, number> | null;
   initialised: boolean = false

   constructor() {
    const parseData = (): Record<string, number> | null => {
      let loadedData: Record<string, number> | string | null = localStorage.getItem("saveData")
      if (loadedData === null){ //Assumably first time data load
        loadedData = structuredClone(defaultSave)
        this.save(loadedData)
        return loadedData
      }

      if (typeof loadedData === "string") {
        const parsedData: Record<string, number> = JSON.parse(loadedData)
        return parsedData
      } else {
        return null
      }
    }
    console.log("Initalised class and loading data...")
    let data: Record<string, number> | null = parseData()
    this.data = data
    console.log(data)

    if (this.data === null) {return}

    this.initialised = true
    scoreCounter.innerHTML = String(this.data.score)
   }

   save(data: Record<string, number> | boolean) {
    console.log("Saving game state")
    if (data) { //For first time save
      localStorage.setItem("saveData", JSON.stringify(data))
    } else {
      localStorage.setItem("saveData", JSON.stringify(this.data))
    }
   }

   reloadData() {
    console.log("Preforming data reload")
   }
}

const hamburgerIcon: HTMLElement = document.getElementById("hamburger") as HTMLDivElement
let gameState: gameData
const scoreCounter: HTMLElement = document.getElementById("score-counter") as HTMLParagraphElement
const scoreAdder: HTMLElement = document.getElementById("score-add") as HTMLParagraphElement
let scoreAdderTimeout: null | number

hamburgerIcon.addEventListener("click", () => {
    console.log("Clicked hamburger")
})

document.addEventListener("click", () => {
  if (!gameState.initialised) {
    return
  }
  if (gameState.data === null) {return}

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
  gameState.save(false)

  scoreAdder.style.display = "block"
  if (scoreAdderTimeout !== null){
    clearTimeout(scoreAdderTimeout)
  }
  
  scoreAdderTimeout = setTimeout(() => {
    scoreAdder.style.display = "none"
  }, 200);
})


document.addEventListener("DOMContentLoaded", () => {
    gameState = new gameData()
})