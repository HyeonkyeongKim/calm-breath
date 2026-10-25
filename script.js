
/* ==========================================
   BREATHING MEDITATION - STEP 7 FIX
   Continuous wave without disappearing
   ========================================== */

// HTML elements
const timerDisplay = document.getElementById("timer");
const breathingText = document.getElementById("breathing-text");
const breathingCircle = document.getElementById("breathing-circle");
const breathingPath = document.getElementById("breathing-path");
const waveGroup = document.getElementById("wave-group");

const relaxButton = document.getElementById("relax-mode");
const holdButton = document.getElementById("hold-mode");
const modeDescription = document.getElementById("mode-description");

const startButton = document.getElementById("start-btn");
const pauseButton = document.getElementById("pause-btn");
const resetButton = document.getElementById("reset-btn");
const toggleTimerButton = document.getElementById("toggle-timer-btn");

// Session duration
const SESSION_DURATION = 300000;       // 5 minutes
const PREPARATION_DURATION = 30000;    // 30 seconds
const CLOSING_DURATION = 30000;        // 30 seconds

// SVG settings
const WAVE_WIDTH = 200;
const TOP_Y = 30;
const BOTTOM_Y = 170;

// Keep the circle near the center
const CIRCLE_SCREEN_X = 200;

// Breathing patterns
const patterns = {
    relax: [
        { name: "Breathe In", duration: 4000 },
        { name: "Breathe Out", duration: 6000 }
    ],

    hold: [
        { name: "Breathe In", duration: 4000 },
        { name: "Hold Gently", duration: 2000 },
        { name: "Breathe Out", duration: 6000 },
        { name: "Rest", duration: 2000 }
    ]
};

// App state
let selectedMode = "relax";
let elapsedTime = 0;
let startTimestamp = null;
let animationId = null;
let isRunning = false;
let isTimerVisible = true;

// One breathing cycle made of separate sections
function getCycleSections(mode) {
    if (mode === "relax") {
        return [
            `M 0 ${BOTTOM_Y}
             C 45 ${BOTTOM_Y}, 55 ${TOP_Y}, 100 ${TOP_Y}`,

            `M 100 ${TOP_Y}
             C 145 ${TOP_Y}, 155 ${BOTTOM_Y}, 200 ${BOTTOM_Y}`
        ];
    }

    return [
        `M 0 ${BOTTOM_Y}
         C 25 ${BOTTOM_Y}, 35 ${TOP_Y}, 70 ${TOP_Y}`,

        `M 70 ${TOP_Y} L 100 ${TOP_Y}`,

        `M 100 ${TOP_Y}
         C 125 ${TOP_Y}, 135 ${BOTTOM_Y}, 170 ${BOTTOM_Y}`,

        `M 170 ${BOTTOM_Y} L 200 ${BOTTOM_Y}`
    ];
}

// Create temporary paths for accurate positions
let phasePaths = [];

function createPhasePaths() {
    const sections = getCycleSections(selectedMode);

    phasePaths = sections.map(section => {
        const path = document.createElementNS(
            "http://www.w3.org/2000/svg",
            "path"
        );

        path.setAttribute("d", section);

        return path;
    });
}

// Create three connected breathing waves
function updatePath() {
    createPhasePaths();

    const sections = getCycleSections(selectedMode);

    let pathData = "";

    // Three cycles are enough because
    // they are reused continuously
    for (let cycle = 0; cycle < 3; cycle++) {
        const offset = cycle * WAVE_WIDTH;

        sections.forEach(section => {
            pathData += `
                ${translatePathSection(section, offset)}
            `;
        });
    }

    breathingPath.setAttribute("d", pathData);

    waveGroup.setAttribute(
        "transform",
        "translate(0, 0)"
    );

    breathingCircle.setAttribute("cx", 0);
    breathingCircle.setAttribute("cy", BOTTOM_Y);
}

// Shift a path section horizontally
function translatePathSection(section, offset) {
    // Each section is wrapped in a temporary
    // SVG group using coordinate translation.
    // For a path string, apply the offset
    // to its coordinates with a DOMMatrix-free
    // approach using a nested SVG path transform.

    // Instead of changing every coordinate,
    // we generate a complete cycle below.
    return "";
}

// Generate one complete cycle at a position
function createFullCycle(x, mode) {
    if (mode === "relax") {
        return `
            M ${x} ${BOTTOM_Y}
            C ${x + 45} ${BOTTOM_Y},
              ${x + 55} ${TOP_Y},
              ${x + 100} ${TOP_Y}
            C ${x + 145} ${TOP_Y},
              ${x + 155} ${BOTTOM_Y},
              ${x + 200} ${BOTTOM_Y}
        `;
    }

    return `
        M ${x} ${BOTTOM_Y}
        C ${x + 25} ${BOTTOM_Y},
          ${x + 35} ${TOP_Y},
          ${x + 70} ${TOP_Y}
        L ${x + 100} ${TOP_Y}
        C ${x + 125} ${TOP_Y},
          ${x + 135} ${BOTTOM_Y},
          ${x + 170} ${BOTTOM_Y}
        L ${x + 200} ${BOTTOM_Y}
    `;
}

// Replace path with three real cycles
function buildWave() {
    let pathData = "";

    for (let i = 0; i < 3; i++) {
        pathData += createFullCycle(
            i * WAVE_WIDTH,
            selectedMode
        );
    }

    breathingPath.setAttribute("d", pathData);
}

// Get point for the current breathing phase
function getPhasePoint(phaseIndex, progress) {
    const path = phasePaths[phaseIndex];

    const length = path.getTotalLength();

    return path.getPointAtLength(
        length * Math.max(0, Math.min(1, progress))
    );
}

// Update timer
function updateTimer() {
    const remaining = Math.max(
        0,
        Math.ceil((SESSION_DURATION - elapsedTime) / 1000)
    );

    const minutes = Math.floor(remaining / 60);
    const seconds = remaining % 60;

    timerDisplay.textContent =
        String(minutes).padStart(2, "0") + ":" +
        String(seconds).padStart(2, "0");
}

// Position wave and yellow circle
function updateWavePosition(breathingTime) {
    const pattern = patterns[selectedMode];

    const cycleDuration = pattern.reduce(
        (sum, phase) => sum + phase.duration,
        0
    );

    const cycleTime = breathingTime % cycleDuration;

    let remaining = cycleTime;
    let phaseIndex = 0;
    let phaseProgress = 0;

    for (let i = 0; i < pattern.length; i++) {
        if (remaining < pattern[i].duration) {
            phaseIndex = i;
            phaseProgress =
                remaining / pattern[i].duration;
            break;
        }

        remaining -= pattern[i].duration;
    }

    const point = getPhasePoint(
        phaseIndex,
        phaseProgress
    );

    // Move the wave underneath the circle
    const offsetX = CIRCLE_SCREEN_X - point.x;

    waveGroup.setAttribute(
        "transform",
        `translate(${offsetX}, 0)`
    );

    breathingCircle.setAttribute(
        "cx",
        CIRCLE_SCREEN_X
    );

    breathingCircle.setAttribute(
        "cy",
        point.y
    );

    breathingText.textContent =
        pattern[phaseIndex].name;
}

// Update breathing
function updateBreathing() {
    if (elapsedTime < PREPARATION_DURATION) {
        breathingText.textContent =
            "Breathe naturally. Get comfortable.";
        return;
    }

    if (
        elapsedTime >=
        SESSION_DURATION - CLOSING_DURATION
    ) {
        breathingText.textContent =
            "Relax. Return to your natural breath.";
        return;
    }

    const breathingTime =
        elapsedTime - PREPARATION_DURATION;

    updateWavePosition(breathingTime);
}

// Animation
function animate(timestamp) {
    if (!isRunning) return;

    if (startTimestamp === null) {
        startTimestamp = timestamp - elapsedTime;
    }

    elapsedTime = Math.min(
        timestamp - startTimestamp,
        SESSION_DURATION
    );

    updateTimer();

    if (elapsedTime >= SESSION_DURATION) {
        finishSession();
        return;
    }

    updateBreathing();

    animationId = requestAnimationFrame(animate);
}

// Start
function startSession() {
    if (isRunning) return;

    if (elapsedTime >= SESSION_DURATION) {
        elapsedTime = 0;
        resetWave();
    }

    isRunning = true;
    startTimestamp = null;

    startButton.textContent = "Running";
    startButton.disabled = true;
    pauseButton.textContent = "Pause";

    animationId = requestAnimationFrame(animate);
}

// Pause / Resume
function pauseSession() {
    if (!isRunning) {
        if (
            elapsedTime > 0 &&
            elapsedTime < SESSION_DURATION
        ) {
            startSession();
        }
        return;
    }

    isRunning = false;
    cancelAnimationFrame(animationId);

    startButton.textContent = "Start";
    startButton.disabled = false;
    pauseButton.textContent = "Resume";
    breathingText.textContent = "Paused";
}

// Reset wave
function resetWave() {
    waveGroup.setAttribute(
        "transform",
        "translate(0, 0)"
    );

    breathingCircle.setAttribute("cx", 0);
    breathingCircle.setAttribute("cy", BOTTOM_Y);
}

// Reset session
function resetSession() {
    isRunning = false;
    cancelAnimationFrame(animationId);

    elapsedTime = 0;
    startTimestamp = null;

    startButton.textContent = "Start";
    startButton.disabled = false;
    pauseButton.textContent = "Pause";
    breathingText.textContent = "Ready to breathe?";

    resetWave();
    updateTimer();
}

// Finish
function finishSession() {
    isRunning = false;
    cancelAnimationFrame(animationId);

    elapsedTime = SESSION_DURATION;
    updateTimer();

    breathingText.textContent =
        "Well done. Take a moment to relax.";

    startButton.textContent = "Start Again";
    startButton.disabled = false;
    pauseButton.textContent = "Pause";
}

// Change mode
function selectMode(mode) {
    selectedMode = mode;

    relaxButton.classList.toggle(
        "active",
        mode === "relax"
    );

    holdButton.classList.toggle(
        "active",
        mode === "hold"
    );

    modeDescription.textContent =
        mode === "relax"
            ? "Inhale 4s · Exhale 6s"
            : "Inhale 4s · Hold 2s · Exhale 6s · Rest 2s";

    createPhasePaths();
    buildWave();
    resetSession();
}

// Timer visibility
toggleTimerButton.addEventListener("click", () => {
    isTimerVisible = !isTimerVisible;

    timerDisplay.classList.toggle(
        "hidden",
        !isTimerVisible
    );

    toggleTimerButton.textContent =
        isTimerVisible ? "Hide Timer" : "Show Timer";

    toggleTimerButton.setAttribute(
        "aria-pressed",
        String(!isTimerVisible)
    );
});

// Button events
relaxButton.addEventListener("click", () => {
    selectMode("relax");
});

holdButton.addEventListener("click", () => {
    selectMode("hold");
});

startButton.addEventListener("click", startSession);
pauseButton.addEventListener("click", pauseSession);
resetButton.addEventListener("click", resetSession);

// Initialize
createPhasePaths();
buildWave();
resetSession();
