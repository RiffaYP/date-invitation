// DOM Elements
const giftContainer = document.getElementById('giftContainer');
const giftBox = document.getElementById('giftBox');
const flowerContainer = document.getElementById('flowerContainer');
const cardContainer = document.getElementById('cardContainer');
const promptText = document.getElementById('promptText');
const resetBtn = document.getElementById('resetBtn');
const particlesContainer = document.getElementById('particlesContainer');
const polaroidsContainer = document.getElementById('polaroidsContainer');
const appContainer = document.querySelector('.app-container');
const bubuDuduContainer = document.getElementById('bubuDuduContainer');
const polaroidStack = document.getElementById('polaroidStack');
const bgMusic = document.getElementById('bgMusic');
const musicControl = document.getElementById('musicControl');
const fallingPetalsContainer = document.getElementById('fallingPetalsContainer');
const envelopeWrapper = document.getElementById('envelopeWrapper');
const envelopeBtn = document.getElementById('envelopeBtn');

let isOpened = false;
let audioCtx = null;
let musicStarted = false;
let petalsInterval = null;

// ==========================================
// AUDIO SYNTHESIS (Web Audio API)
// ==========================================
function playMagicalChime() {
    try {
        // Initialize AudioContext lazily on user interaction
        if (!audioCtx) {
            audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        }

        if (audioCtx.state === 'suspended') {
            audioCtx.resume();
        }

        // Magical Arpeggio notes (Frequencies for C-Major 9 / Lydian feel)
        const notes = [523.25, 659.25, 783.99, 987.77, 1046.50, 1174.66, 1318.51, 1567.98, 2093.00];
        const now = audioCtx.currentTime;

        notes.forEach((freq, idx) => {
            const osc = audioCtx.createOscillator();
            const gainNode = audioCtx.createGain();

            // Use 'triangle' wave for a warm, bell-like / music box tone
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(freq, now + idx * 0.07);

            const noteStartTime = now + idx * 0.07;
            const duration = 0.9;

            // Envelope: instant attack, exponential decay for sweet chime sound
            gainNode.gain.setValueAtTime(0, noteStartTime);
            gainNode.gain.linearRampToValueAtTime(0.12, noteStartTime + 0.02);
            gainNode.gain.exponentialRampToValueAtTime(0.0001, noteStartTime + duration);

            osc.connect(gainNode);
            gainNode.connect(audioCtx.destination);

            osc.start(noteStartTime);
            osc.stop(noteStartTime + duration);
        });
    } catch (e) {
        console.warn("Web Audio API not fully supported or blocked:", e);
    }
}

// ==========================================
// PARTICLE SYSTEM (Sparkles & Petals)
// ==========================================
function createExplosion(x, y) {
    const particleCount = 45;

    for (let i = 0; i < particleCount; i++) {
        const isPetal = Math.random() > 0.65;
        const particle = document.createElement('div');

        particle.className = isPetal ? 'petal-particle' : 'sparkle';

        // Random dimensions
        const size = isPetal
            ? Math.random() * 14 + 10  // Petals: 10px to 24px
            : Math.random() * 8 + 4;   // Sparkles: 4px to 12px

        particle.style.width = `${size}px`;
        particle.style.height = `${size}px`;

        // Place at center of explosion
        particle.style.left = `${x - size / 2}px`;
        particle.style.top = `${y - size / 2}px`;

        // Physics randomization using CSS Custom Properties (slower, more natural drift)
        const angle = Math.random() * Math.PI * 2;
        const velocity = Math.random() * 110 + 40; // Gentler explosion force
        const tx = Math.cos(angle) * velocity;
        const ty = Math.sin(angle) * velocity - (Math.random() * 40); // Soft drift upwards

        const rot = `${Math.random() * 360 + 180}deg`;
        const dur = `${Math.random() * 0.8 + 0.9}s`; // Duration 0.9s to 1.7s
        const endScale = Math.random() * 0.5 + 0.1;

        particle.style.setProperty('--tx', `${tx}px`);
        particle.style.setProperty('--ty', `${ty}px`);
        particle.style.setProperty('--rot', rot);
        particle.style.setProperty('--dur', dur);
        particle.style.setProperty('--end-scale', endScale);

        particlesContainer.appendChild(particle);

        // Clean up DOM after animation ends
        setTimeout(() => {
            particle.remove();
        }, 1800);
    }
}

// ==========================================
// POLAROID DECK / STACK SCATTER LOGIC
// ==========================================
function initPolaroidStack() {
    const cards = Array.from(polaroidStack.querySelectorAll('.polaroid-card'));
    let totalCards = cards.length;

    cards.forEach((card, idx) => {
        // Set initial z-index
        card.style.setProperty('--z', totalCards - idx);

        // Randomize slight rotation and translation offset for stacked look
        const rot = (Math.random() * 8 - 4) + 'deg';
        const tx = (Math.random() * 6 - 3) + 'px';
        const ty = (Math.random() * 6 - 3) + 'px';
        card.style.setProperty('--rot', rot);
        card.style.setProperty('--tx', tx);
        card.style.setProperty('--ty', ty);

        // Click handler for Zoom in / Zoom out when scattered
        card.addEventListener('click', (e) => {
            // Only allow zoom if photos are scattered
            if (!polaroidStack.classList.contains('scattered')) return;

            e.stopPropagation();

            const isZoomed = card.classList.contains('zoomed');

            // Remove zoomed class from all cards
            cards.forEach(c => c.classList.remove('zoomed'));

            // Toggle zoomed class on the clicked card
            if (!isZoomed) {
                card.classList.add('zoomed');
            }
        });
    });

    // Click on the stack to scatter them to the sides
    polaroidStack.addEventListener('click', (e) => {
        e.stopPropagation();

        // Only trigger scatter once
        if (polaroidStack.classList.contains('scattered')) return;

        // Play chime sound and burst particles from the stack center
        playMagicalChime();
        const rect = polaroidStack.getBoundingClientRect();
        createExplosion(rect.left + rect.width / 2, rect.top + rect.height / 2);

        // Scatter photos
        polaroidStack.classList.add('scattered');

        // Trigger envelope appearance and slide polaroids
        appContainer.classList.add('card-active');
        setTimeout(() => {
            envelopeWrapper.classList.add('show');
        }, 1000);

        // Fade out hint text
        promptText.classList.add('fade-out');
    });
}

function resetPolaroidStack() {
    polaroidStack.classList.remove('scattered');
    const cards = Array.from(polaroidStack.querySelectorAll('.polaroid-card'));
    let totalCards = cards.length;
    cards.forEach((card, idx) => {
        card.style.setProperty('--z', totalCards - idx);
    });
}

// Initialize on page load
initPolaroidStack();

// ==========================================
// EVENT LISTENERS & STATE TRANSITIONS
// ==========================================

// Click Gift Box to Open
giftContainer.addEventListener('click', (e) => {
    if (isOpened) return;
    isOpened = true;

    // Get click coordinates relative to the viewport
    const rect = giftBox.getBoundingClientRect();
    const clickX = e.clientX || (rect.left + rect.width / 2);
    const clickY = e.clientY || (rect.top + rect.height / 2);

    // Trigger sound and sparkles
    playMagicalChime();
    createExplosion(clickX, clickY);

    // Auto-play music on first open
    if (!musicStarted) {
        bgMusic.play().then(() => {
            musicControl.classList.add('playing');
            musicStarted = true;
        }).catch(err => {
            console.warn("Autoplay blocked by browser. User needs to tap the music icon or interact first:", err);
        });
    }

    // Animate Box opening
    giftContainer.classList.add('open');
    promptText.classList.add('fade-out');

    // Grow Tulip SVG, Polaroids & Bubu Dudu after a short delay
    setTimeout(() => {
        flowerContainer.classList.add('grow');
        polaroidsContainer.classList.add('grow-polaroids');
        bubuDuduContainer.classList.add('grow-bubu');
        startFallingPetals();

        // Change prompt text and slide it back in
        promptText.innerText = "Ketuk foto... 📸";
        promptText.classList.remove('fade-out');

        // Auto-fadeout after 2.5 seconds so it doesn't stay on screen and clutter the view
        setTimeout(() => {
            if (!polaroidStack.classList.contains('scattered')) {
                promptText.classList.add('fade-out');
            }
        }, 2500);
    }, 600);
});

// Reset Animation to Replay
resetBtn.addEventListener('click', (e) => {
    e.stopPropagation();

    // Stop falling petals and clear them
    stopFallingPetals();
    fallingPetalsContainer.innerHTML = '';

    // Hide envelope and reset classes
    envelopeWrapper.classList.remove('show', 'open', 'fade-away');

    // Clear any zoomed polaroids
    const cards = polaroidStack.querySelectorAll('.polaroid-card');
    cards.forEach(c => c.classList.remove('zoomed'));

    // Hide Greeting Card, Flower, Polaroids, Bubu & reset positions
    cardContainer.classList.remove('show');
    appContainer.classList.remove('card-active');
    flowerContainer.classList.remove('grow');
    polaroidsContainer.classList.remove('grow-polaroids');
    bubuDuduContainer.classList.remove('grow-bubu');

    // Reset polaroid stack order
    resetPolaroidStack();

    // Smooth reset of the gift box after elements disappear
    setTimeout(() => {
        giftContainer.classList.remove('open');
        promptText.innerText = "Ada sesuatu untukmu sayangku... 🎁";
        promptText.classList.remove('fade-out');
        isOpened = false;
    }, 850);
});

// ==========================================
// BACKGROUND MUSIC CONTROLLER
// ==========================================
function toggleMusic() {
    if (bgMusic.paused) {
        bgMusic.play().then(() => {
            musicControl.classList.add('playing');
            musicStarted = true;
        }).catch(err => {
            console.warn("Music play failed:", err);
        });
    } else {
        bgMusic.pause();
        musicControl.classList.remove('playing');
    }
}

// Event listener for play/pause toggle click
musicControl.addEventListener('click', (e) => {
    e.stopPropagation();
    toggleMusic();
});

// ==========================================
// FALLING TULIP PETALS BACKGROUND EFFECT
// ==========================================
function startFallingPetals() {
    // Spawn a petal every 2 seconds for a gentle, non-crowded effect
    if (petalsInterval) return;
    petalsInterval = setInterval(createFallingPetal, 2000);
}

function stopFallingPetals() {
    if (petalsInterval) {
        clearInterval(petalsInterval);
        petalsInterval = null;
    }
}

function createFallingPetal() {
    // Limit maximum active petals on screen to 12
    if (fallingPetalsContainer.childElementCount >= 12) return;

    const petal = document.createElement('div');
    petal.className = 'falling-petal';

    // Randomize width and height between 10px and 20px (keep them small and subtle)
    const size = Math.random() * 10 + 10;
    petal.style.width = `${size}px`;
    petal.style.height = `${size}px`;

    // Randomize initial horizontal position (0vw to 100vw)
    petal.style.left = `${Math.random() * 100}vw`;

    // Randomize rotation end angle (-180deg to 180deg)
    const rotEnd = `${Math.random() * 360 - 180}deg`;

    // Randomize drift sway distance (-100px to 100px)
    const swayDistance = `${Math.random() * 160 - 80}px`;

    // Randomize animation duration (8s to 15s) for a very slow, calm drift
    const duration = `${Math.random() * 7 + 8}s`;

    // Randomize opacity max (0.45 to 0.75) for subtle visibility
    const maxOpacity = Math.random() * 0.3 + 0.45;

    // Pass custom properties to CSS keyframe animation
    petal.style.setProperty('--fall-duration', duration);
    petal.style.setProperty('--rot-end', rotEnd);
    petal.style.setProperty('--sway-distance', swayDistance);
    petal.style.setProperty('--max-opacity', maxOpacity);

    fallingPetalsContainer.appendChild(petal);

    // Clean up petal element after its animation finishes
    // Duration is in seconds, so convert to ms (maximum is 15s)
    setTimeout(() => {
        petal.remove();
    }, 16000);
}

// ==========================================
// INTERACTIVE ENVELOPE EVENT LISTENER
// ==========================================
envelopeBtn.addEventListener('click', (e) => {
    e.stopPropagation();

    // Prevent double clicking
    if (envelopeWrapper.classList.contains('open')) return;

    // Play chime sound and spawn sparkles around the envelope
    playMagicalChime();
    const rect = envelopeBtn.getBoundingClientRect();
    createExplosion(rect.left + rect.width / 2, rect.top + rect.height / 2);

    // Open envelope
    envelopeWrapper.classList.add('open');

    // Clear any zoomed polaroids
    const cards = polaroidStack.querySelectorAll('.polaroid-card');
    cards.forEach(c => c.classList.remove('zoomed'));

    // Slide up greeting card after flap animation completes
    setTimeout(() => {
        cardContainer.classList.add('show');
        envelopeWrapper.classList.add('fade-away');
    }, 600);
});

// Dismiss zoom when clicking outside on the background container
appContainer.addEventListener('click', () => {
    const cards = polaroidStack.querySelectorAll('.polaroid-card');
    cards.forEach(c => c.classList.remove('zoomed'));
});