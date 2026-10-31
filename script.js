/* ==========================================
   Pixel Date Invitation - Modular SPA Logic
   ========================================== */

// Element References
const yesBtn = document.getElementById("yesBtn");
const noBtn = document.getElementById("noBtn");
const message = document.getElementById("message");
const continueBtn = document.getElementById("continueBtn");
const particleContainer = document.getElementById("particle-container");

// State
let yesScale = 1;
const MAX_YES_SCALE = 6;
let tries = 0;
let currentNoX = 0;
let currentNoY = 0;
let touchHandled = false;

const texts = [
    "😏 Nice try.",
    "🥺 Please...",
    "😭 Are you sure?",
    "💔 Don't break my heart.",
    "🌹 I even brought flowers!",
    "🥹 Just press YES.",
    "😂 You can't escape forever."
];

/* ==========================================
   Dodge Logic (NO Button - Desktop & Mobile)
   ========================================== */
let isShaking = false;

if (noBtn) {
    // Desktop mouse hover
    noBtn.addEventListener("mouseenter", () => moveButton(false));

    // Mobile touch interaction - use pointerdown only (covers touch + mouse)
    noBtn.addEventListener("pointerdown", handleTouchDodge, { passive: false });

    // Keyboard accessibility
    noBtn.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            moveButton(true);
        }
    });
}

function handleTouchDodge(e) {
    // Prevent double-trigger: pointerdown fires for both touch and mouse
    if (e.pointerType === "touch") {
        e.preventDefault();
        if (touchHandled) return;
        touchHandled = true;
        setTimeout(() => { touchHandled = false; }, 100);
    }
    moveButton(true);
}

function moveButton(isTouch = false) {
    if (isShaking) return;

    tries++;

    if (message) {
        message.textContent = texts[
            Math.min(tries - 1, texts.length - 1)
        ];
    }

    // Scale up YES button (with max limit)
    yesScale = Math.min(yesScale + 0.15, MAX_YES_SCALE);
    if (yesBtn) {
        yesBtn.style.setProperty("--yes-scale", yesScale);
    }

    if (isTouch) {
        // Mobile: move immediately, no shake
        applyRandomPosition();
    } else {
        // Desktop: Instant smooth dodge
        applyRandomPosition();
    }
}

function applyRandomPosition() {
    const card = document.querySelector("#page-home .card");
    if (!card || !noBtn || !yesBtn) return;

    const cardRect = card.getBoundingClientRect();
    const noRect = noBtn.getBoundingClientRect();
    const yesRect = yesBtn.getBoundingClientRect();

    // Calculate un-transformed initial position of noBtn inside card
    const unTransformedNoLeft = noRect.left - currentNoX - cardRect.left;
    const unTransformedNoTop = noRect.top - currentNoY - cardRect.top;

    // Calculate YES button's visual bounds (accounting for scale)
    const yesScale = parseFloat(yesBtn.style.getPropertyValue("--yes-scale")) || 1;
    const yesVisualWidth = yesRect.width * yesScale;
    const yesVisualHeight = yesRect.height * yesScale;
    const yesCenterX = yesRect.left - cardRect.left + yesRect.width / 2;
    const yesCenterY = yesRect.top - cardRect.top + yesRect.height / 2;

    const padding = 16;
    const minX = padding - unTransformedNoLeft;
    const maxX = (cardRect.width - noRect.width - padding) - unTransformedNoLeft;

    const minY = padding - unTransformedNoTop;
    const maxY = (cardRect.height - noRect.height - padding) - unTransformedNoTop;

    // Pick new target (x, y) ensuring minimum jump distance inside card
    // AND avoiding YES button's visual area
    let newX, newY;
    let attempts = 0;
    let overlapsYes = false;

    do {
        newX = Math.random() * (maxX - minX) + minX;
        newY = Math.random() * (maxY - minY) + minY;
        attempts++;

        // Check if NO button would overlap with YES button's visual area
        const noCenterX = unTransformedNoLeft + newX + noRect.width / 2;
        const noCenterY = unTransformedNoTop + newY + noRect.height / 2;

        const dx = Math.abs(noCenterX - yesCenterX);
        const dy = Math.abs(noCenterY - yesCenterY);
        const minDistX = (yesVisualWidth + noRect.width) / 2 + 20; // 20px buffer
        const minDistY = (yesVisualHeight + noRect.height) / 2 + 20;

        overlapsYes = dx < minDistX && dy < minDistY;

    } while (
        (Math.hypot(newX - currentNoX, newY - currentNoY) < 65 || overlapsYes) &&
        attempts < 30
    );

    currentNoX = newX;
    currentNoY = newY;

    noBtn.style.setProperty("--no-x", `${currentNoX}px`);
    noBtn.style.setProperty("--no-y", `${currentNoY}px`);
    noBtn.style.transform = `translate(${currentNoX}px, ${currentNoY}px)`;
}

/* ==========================================
   Animation Helpers
   ========================================== */

/**
 * Plays a click press-down animation on a button element.
 * @param {HTMLElement} element 
 */
function playButtonAnimation(element) {
    if (!element) return;
    element.classList.remove("btn-click-anim");
    // Trigger reflow
    void element.offsetWidth;
    element.classList.add("btn-click-anim");

    setTimeout(() => {
        element.classList.remove("btn-click-anim");
    }, 250);
}

/**
 * Creates 15-25 small heart particles originating around the given element.
 * @param {HTMLElement} sourceElement 
 */
function createHeartParticles(sourceElement) {
    const container = particleContainer || document.body;
    const heartTypes = ["❤️", "💖", "💕", "💗", "✨"];
    const particleCount = Math.floor(Math.random() * 11) + 15; // 15 to 25 hearts

    const sourceRect = sourceElement 
        ? sourceElement.getBoundingClientRect() 
        : { left: window.innerWidth / 2, top: window.innerHeight / 2, width: 0, height: 0 };

    const originX = sourceRect.left + sourceRect.width / 2;
    const originY = sourceRect.top + sourceRect.height / 2;

    for (let i = 0; i < particleCount; i++) {
        const heart = document.createElement("div");
        heart.className = "heart-particle";
        heart.textContent = heartTypes[Math.floor(Math.random() * heartTypes.length)];

        // Random position spread around the button center
        const offsetX = (Math.random() - 0.5) * 60;
        const offsetY = (Math.random() - 0.5) * 30;
        const sway = (Math.random() - 0.5) * 50;

        heart.style.left = `${originX + offsetX}px`;
        heart.style.top = `${originY + offsetY}px`;
        heart.style.setProperty("--sway", `${sway}px`);

        // Randomize size & duration slightly
        const scale = Math.random() * 0.5 + 0.8;
        heart.style.fontSize = `${16 * scale}px`;
        const duration = Math.random() * 0.4 + 0.9; // ~0.9s - 1.3s
        heart.style.animationDuration = `${duration}s`;

        container.appendChild(heart);

        // Self-delete from DOM after animation completes
        setTimeout(() => {
            heart.remove();
        }, duration * 1000);
    }
}

/* ==========================================
   SPA Page Section Controllers
   ========================================== */

function hideHomePage() {
    const homePage = document.getElementById("page-home");
    if (homePage) {
        homePage.classList.remove("active", "fade-out-anim");
        homePage.style.display = "none";
    }
}

function showSuccessPage() {
    const successPage = document.getElementById("page-success");
    if (successPage) {
        successPage.style.display = "flex";
        successPage.classList.add("active", "fade-in-anim");

        // Remove animation helper class after fade in finishes
        setTimeout(() => {
            successPage.classList.remove("fade-in-anim");
        }, 500);
    }
}

/**
 * General SPA router function to switch sections smoothly.
 * @param {string} targetPageId 
 */
function navigateToPage(targetPageId) {
    if (targetPageId === "page-success") {
        hideHomePage();
        showSuccessPage();
    }
}

/* ==========================================
   Event Handlers
   ========================================== */

if (yesBtn) {
    yesBtn.addEventListener("click", () => {
        const homePage = document.getElementById("page-home");
        const homeCard = homePage ? homePage.querySelector(".card") : null;

        // 1. Play YES button click animation
        playButtonAnimation(yesBtn);

        // 2. Create heart particle burst from YES button (~1s duration)
        createHeartParticles(yesBtn);

        // 3. Card zoom animation
        if (homeCard) {
            homeCard.classList.add("card-zoom-anim");
        }

        // 4. Entire page fade out
        if (homePage) {
            homePage.classList.add("fade-out-anim");
        }

        // 5, 6, 7. Hide Home, Show Success Page, and Fade In after animation finishes
        setTimeout(() => {
            if (homeCard) {
                homeCard.classList.remove("card-zoom-anim");
            }
            navigateToPage("page-success");
        }, 500);
    });

    yesBtn.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            yesBtn.click();
        }
    });
}

if (continueBtn) {
    continueBtn.addEventListener("click", () => {
        playButtonAnimation(continueBtn);
        // Restart the game
        setTimeout(() => {
            resetGame();
        }, 250);
    });

    continueBtn.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            continueBtn.click();
        }
    });
}

function resetGame() {
    // Reset state
    yesScale = 1;
    tries = 0;
    currentNoX = 0;
    currentNoY = 0;
    
    // Reset YES button
    if (yesBtn) {
        yesBtn.style.setProperty("--yes-scale", "1");
    }
    
    // Reset NO button position
    if (noBtn) {
        noBtn.style.setProperty("--no-x", "0px");
        noBtn.style.setProperty("--no-y", "0px");
        noBtn.style.transform = "translate(0px, 0px)";
    }
    
    // Reset message
    if (message) {
        message.textContent = "Try clicking NO 😏";
    }
    
    // Navigate back to home page
    const successPage = document.getElementById("page-success");
    const homePage = document.getElementById("page-home");
    const homeCard = homePage ? homePage.querySelector(".card") : null;
    
    if (successPage) {
        successPage.classList.add("fade-out-anim");
        setTimeout(() => {
            successPage.classList.remove("active", "fade-out-anim");
            successPage.style.display = "none";
            
            if (homePage) {
                homePage.style.display = "flex";
                homePage.classList.add("active", "fade-in-anim");
                if (homeCard) {
                    homeCard.classList.add("pop-anim");
                    setTimeout(() => homeCard.classList.remove("pop-anim"), 600);
                }
                setTimeout(() => homePage.classList.remove("fade-in-anim"), 500);
            }
        }, 500);
    }
}