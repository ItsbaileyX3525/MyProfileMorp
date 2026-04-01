let coordsText: HTMLParagraphElement
let viewport: HTMLDivElement
let viewportItems: HTMLDivElement 
let homeButton: HTMLParagraphElement
let interactlandButton: HTMLParagraphElement
let closeSidebar: HTMLParagraphElement
let sidebar: HTMLDivElement
let imgInput: HTMLInputElement
let imgSubmit: HTMLButtonElement

let hostname: string
let port: string
let pubserver = false
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

async function setupEventListeners() {
    viewport.addEventListener("mousedown", (e) => {
        isDragging = true
        viewport.style.cursor = "grabbing"
        startX = e.clientX + x
        startY = e.clientY + y
    })

    window.addEventListener("mousemove", (e) => {
        if (!isDragging) return

        x = startX - e.clientX
        y = startY - e.clientY

        updatePostion()
    })

    window.addEventListener("mouseup", () => {
        isDragging = false
        viewport.style.cursor = "grab"

        updatePostion()
    })

    window.addEventListener("resize", () => {
        updateViewportCenter()
        updatePostion()
    })

    homeButton.addEventListener("click", async () => {
        let htmlData: string

        const request = await fetch("https://itsbaileyx3525.github.io/MyProfileMorp/")
        
        if(!request.ok) {
            return
        }

        htmlData = await request.text()

        console.log("loading main")
        document.open()
        document.write(htmlData)
        document.close()
    })

    interactlandButton.addEventListener("click", () => {
        console.log("??? Why click this?")
    })

    closeSidebar.addEventListener("click", () => {
        if (sidebar.style.display === "none") {
            sidebar.style.display = "block"
        } else {
            sidebar.style.display = "none"
        }
    })

    document.addEventListener("keydown", (e) => {
        if (e.key === "Tab") {
            e.preventDefault();

            if (sidebar.style.display === "none") {
                sidebar.style.display = "block";
            } else {
                sidebar.style.display = "none";
            }
        }
    });

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
    })
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

document.addEventListener("DOMContentLoaded", async () => {
    coordsText = document.getElementById("coords") as HTMLParagraphElement
    viewport = document.getElementById("viewport") as HTMLDivElement
    viewportItems = document.getElementById("items") as HTMLDivElement
    homeButton  = document.getElementById("home-btn") as HTMLParagraphElement
    interactlandButton = document.getElementById("interactland-btn") as HTMLParagraphElement
    closeSidebar = document.getElementById("close-sidebar") as HTMLParagraphElement
    sidebar = document.getElementById("sidebar") as HTMLDivElement
    imgSubmit = document.getElementById("image-submit-btn") as HTMLButtonElement
    imgInput = document.getElementById("image-input") as HTMLInputElement

    setupEventListeners()
    updateViewportCenter()
    updatePostion();
    loadImages()    
})

