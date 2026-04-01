let coordsText: HTMLParagraphElement
let viewport: HTMLDivElement
let viewportItems: HTMLDivElement 
let homeButton: HTMLParagraphElement
let interactlandButton: HTMLParagraphElement
let closeSidebar: HTMLParagraphElement
let sidebar: HTMLDivElement
let imgInput: HTMLInputElement
let imgSubmit: HTMLButtonElement
let interactlandEventController: AbortController | null = null

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

let x: number = 0
let y: number = 0
let isDragging: boolean = false
let startX: number, startY: number
let centerX: number = 0
let centerY: number = 0

export function disposeInteractlandView() {
    if (interactlandEventController) {
        interactlandEventController.abort()
        interactlandEventController = null
    }
}

function updateViewportCenter() {
    const rect = viewport.getBoundingClientRect()
    centerX = rect.width / 2
    centerY = rect.height / 2
}

function updatePostion() {
    const offsetX = centerX - x
    const offsetY = centerY - y

    viewport.style.backgroundPosition = `${offsetX}px ${offsetY}px`;
    viewportItems.style.transform = `translate3d(${offsetX}px, ${offsetY}px, 0)`;

    coordsText.innerText = `Position: ${Math.round(x)}X ${Math.round(y)}Y`;
}

function appendImage(imgLink: string, imgX: number, imgY: number): void {
    const img = document.createElement("img")
    img.src = imgLink
    img.style.position = "absolute"
    img.style.left = String(Math.round(imgX)) + "px"
    img.style.top = String(Math.round(imgY)) + "px"
    img.style.flexShrink = "0"
    img.id = "world-item"
    img.style.minWidth = "0px"
    img.style.maxWidth = "9999px"
    viewportItems.appendChild(img)
}

function requestHomeNavigation() {
    disposeInteractlandView()

    const navigateHomeEvent = new CustomEvent("navigate-home", { cancelable: true })
    window.dispatchEvent(navigateHomeEvent)

    if (!navigateHomeEvent.defaultPrevented) {
        window.location.href = new URL("./", window.location.href).toString()
    }
}

function setupEventListeners() {
    disposeInteractlandView()

    interactlandEventController = new AbortController()
    const { signal } = interactlandEventController

    viewport.addEventListener("mousedown", (e) => {
        isDragging = true
        viewport.style.cursor = "grabbing"
        startX = e.clientX + x
        startY = e.clientY + y
    }, { signal })

    window.addEventListener("mousemove", (e) => {
        if (!isDragging) return

        x = startX - e.clientX
        y = startY - e.clientY

        updatePostion()
    }, { signal })

    window.addEventListener("mouseup", () => {
        isDragging = false
        viewport.style.cursor = "grab"

        updatePostion()
    }, { signal })

    window.addEventListener("resize", () => {
        updateViewportCenter()
        updatePostion()
    }, { signal })

    homeButton.addEventListener("click", () => {
        requestHomeNavigation()
    }, { signal })

    interactlandButton.addEventListener("click", () => {
        console.log("??? Why click this?")
    }, { signal })

    closeSidebar.addEventListener("click", () => {
        if (sidebar.style.display === "none") {
            sidebar.style.display = "block"
        } else {
            sidebar.style.display = "none"
        }
    }, { signal })

    document.addEventListener("keydown", (e) => {
        if (e.key === "Tab") {
            e.preventDefault();

            if (sidebar.style.display === "none") {
                sidebar.style.display = "block";
            } else {
                sidebar.style.display = "none";
            }
        }
    }, { signal });

    imgSubmit.addEventListener("click", async () => {
        const imgLink = imgInput.value
        console.log(imgLink)
        const request = await fetch(hostname+":"+port + "/upload", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ imageLink: imgLink, imagePos: JSON.stringify({
                "x" : Math.round(x),
                "y" : Math.round(y)
            })
            })
    })

        if (!request.ok) {
        console.log("Save request failed")
        return
        }

        const data = await request.json()

        console.log(data)

        if (data.success === 'true') {
            appendImage(imgLink, x, y)
            console.log("Image uploaded and loaded")
        } else {
            console.log(data)
        }
    }, { signal })
}

async function loadImages() {
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

    console.log(data)
    for (const image of data.images) {
        console.log(JSON.parse(image.pos).x)
        const position = JSON.parse(image.pos) as { x: number; y: number }
        appendImage(image.imageLink, position.x, position.y)
    }
}

export function initialiseInteractlandView(): boolean {
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

    coordsText = nextCoords
    viewport = nextViewport
    viewportItems = nextViewportItems
    homeButton  = nextHomeButton
    interactlandButton = nextInteractlandButton
    closeSidebar = nextCloseSidebar
    sidebar = nextSidebar
    imgSubmit = nextImgSubmit
    imgInput = nextImgInput

    setupEventListeners()
    updateViewportCenter()
    updatePostion();
    loadImages()

    return true
}

function autoInitialiseInteractlandView() {
    const hasInteractlandRoot = document.getElementById("viewport") !== null
    if (!hasInteractlandRoot) {
        return
    }

    initialiseInteractlandView()
}

if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => {
        autoInitialiseInteractlandView()
    }, { once: true })
} else {
    autoInitialiseInteractlandView()
}

