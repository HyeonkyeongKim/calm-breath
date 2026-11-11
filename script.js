
/* Calm Breath — continuous five-minute breathing animation.
   Replace the contents of script.js with this file. */

const timerDisplay = document.getElementById('timer');
const breathingText = document.getElementById('breathing-text');
const breathingCircle = document.getElementById('breathing-circle');
const breathingPath = document.getElementById('breathing-path');
const waveGroup = document.getElementById('wave-group');
const relaxButton = document.getElementById('relax-mode');
const holdButton = document.getElementById('hold-mode');
const modeDescription = document.getElementById('mode-description');
const startButton = document.getElementById('start-btn');
const pauseButton = document.getElementById('pause-btn');
const resetButton = document.getElementById('reset-btn');
const toggleTimerButton = document.getElementById('toggle-timer-btn');

const SESSION_DURATION = 300000;
const PREPARATION_DURATION = 30000;
const CLOSING_DURATION = 30000;
const GUIDED_END = SESSION_DURATION - CLOSING_DURATION;
const CIRCLE_X = 200;
const CENTER_Y = 100;
const TOP_Y = 30;
const BOTTOM_Y = 170;
const NATURAL_AMPLITUDE = 12;
const NATURAL_CYCLE = 6000;
const TRANSITION_DURATION = 4000;

const patterns = {
  relax: [
    { name: 'Breathe In', duration: 4000 },
    { name: 'Breathe Out', duration: 6000 }
  ],
  hold: [
    { name: 'Breathe In', duration: 4000 },
    { name: 'Hold Gently', duration: 2000 },
    { name: 'Breathe Out', duration: 6000 },
    { name: 'Rest', duration: 2000 }
  ]
};

let selectedMode = 'relax';
let elapsedTime = 0;
let startTimestamp = null;
let animationId = null;
let isRunning = false;
let isTimerVisible = true;

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

// Smoothly fade between small natural waves and guided breathing waves.
function smoothstep(value) {
  const t = clamp(value, 0, 1);
  return t * t * (3 - 2 * t);
}

function guidedBlend(time) {
  const fadeIn = smoothstep(
    (time - PREPARATION_DURATION) / TRANSITION_DURATION
  );
  const fadeOut = smoothstep(
    (GUIDED_END - time) / TRANSITION_DURATION
  );
  return Math.min(fadeIn, fadeOut);
}

function cycleDuration() {
  return patterns[selectedMode].reduce(
    (total, phase) => total + phase.duration, 0
  );
}

// Return the phase and smooth vertical position for any point in a cycle.
function guidedPosition(time) {
  const pattern = patterns[selectedMode];
  const total = cycleDuration();
  let position = ((time % total) + total) % total;

  for (const phase of pattern) {
    if (position < phase.duration) {
      const progress = position / phase.duration;

      if (phase.name === 'Breathe In') {
        return BOTTOM_Y + (TOP_Y - BOTTOM_Y) *
          (1 - Math.cos(Math.PI * progress)) / 2;
      }

      if (phase.name === 'Breathe Out') {
        return TOP_Y + (BOTTOM_Y - TOP_Y) *
          (1 - Math.cos(Math.PI * progress)) / 2;
      }

      return phase.name === 'Hold Gently' ? TOP_Y : BOTTOM_Y;
    }

    position -= phase.duration;
  }

  return BOTTOM_Y;
}

function phaseName(time) {
  const pattern = patterns[selectedMode];
  const total = cycleDuration();
  let position = ((time % total) + total) % total;

  for (const phase of pattern) {
    if (position < phase.duration) return phase.name;
    position -= phase.duration;
  }

  return pattern[0].name;
}

function waveY(x, time) {
  // Gentle, continuously moving wave during opening and closing.
  const natural = CENTER_Y + NATURAL_AMPLITUDE *
    Math.sin(
      2 * Math.PI *
      (time / NATURAL_CYCLE + (x - CIRCLE_X) / 200)
    );

  // A guided cycle spans 200 SVG units.
  const guidedTime = time - PREPARATION_DURATION -
    ((x - CIRCLE_X) / 200) * cycleDuration();

  const guided = guidedPosition(guidedTime);
  const blend = guidedBlend(time);

  return natural * (1 - blend) + guided * blend;
}

function drawWave(time) {
  const points = [];

  for (let x = 0; x <= 400; x += 4) {
    points.push(
      `${x === 0 ? 'M' : 'L'} ${x} ${waveY(x, time).toFixed(2)}`
    );
  }

  breathingPath.setAttribute('d', points.join(' '));

  // The yellow circle stays horizontally centered.
  breathingCircle.setAttribute('cx', CIRCLE_X);
  breathingCircle.setAttribute(
    'cy',
    waveY(CIRCLE_X, time).toFixed(2)
  );

  if (waveGroup) {
    waveGroup.setAttribute('transform', 'translate(0, 0)');
  }
}

function updateTimer() {
  const remaining = Math.max(
    0,
    Math.ceil((SESSION_DURATION - elapsedTime) / 1000)
  );

  timerDisplay.textContent =
    `${String(Math.floor(remaining / 60)).padStart(2, '0')}:` +
    `${String(remaining % 60).padStart(2, '0')}`;
}

function updateBreathing() {
  drawWave(elapsedTime);

  if (elapsedTime < PREPARATION_DURATION) {
    breathingText.textContent =
      'Breathe naturally. Get comfortable.';
  } else if (elapsedTime >= GUIDED_END) {
    breathingText.textContent =
      'Relax. Return to your natural breath.';
  } else {
    breathingText.textContent =
      phaseName(elapsedTime - PREPARATION_DURATION);
  }
}

function animate(timestamp) {
  if (!isRunning) return;

  if (startTimestamp === null) {
    startTimestamp = timestamp - elapsedTime;
  }

  elapsedTime = clamp(
    timestamp - startTimestamp,
    0,
    SESSION_DURATION
  );

  updateTimer();
  updateBreathing();

  if (elapsedTime >= SESSION_DURATION) {
    finishSession();
    return;
  }

  animationId = requestAnimationFrame(animate);
}

function startSession() {
  if (isRunning) return;

  if (elapsedTime >= SESSION_DURATION) {
    elapsedTime = 0;
    updateTimer();
    updateBreathing();
  }

  isRunning = true;
  startTimestamp = null;

  startButton.textContent = 'Running';
  startButton.disabled = true;
  pauseButton.textContent = 'Pause';

  animationId = requestAnimationFrame(animate);
}

function pauseSession() {
  if (!isRunning) {
    if (elapsedTime > 0 && elapsedTime < SESSION_DURATION) {
      startSession();
    }
    return;
  }

  isRunning = false;
  cancelAnimationFrame(animationId);

  startButton.textContent = 'Start';
  startButton.disabled = false;
  pauseButton.textContent = 'Resume';
  breathingText.textContent = 'Paused';
}

function resetSession() {
  isRunning = false;
  cancelAnimationFrame(animationId);

  elapsedTime = 0;
  startTimestamp = null;

  startButton.textContent = 'Start';
  startButton.disabled = false;
  pauseButton.textContent = 'Pause';
  breathingText.textContent = 'Ready to breathe?';

  drawWave(0);
  updateTimer();
}

function finishSession() {
  isRunning = false;
  cancelAnimationFrame(animationId);

  elapsedTime = SESSION_DURATION;

  drawWave(elapsedTime);
  updateTimer();

  breathingText.textContent =
    'Well done. Take a moment to relax.';

  startButton.textContent = 'Start Again';
  startButton.disabled = false;
  pauseButton.textContent = 'Pause';
}

function selectMode(mode) {
  selectedMode = mode;

  relaxButton.classList.toggle(
    'active',
    mode === 'relax'
  );

  holdButton.classList.toggle(
    'active',
    mode === 'hold'
  );

  modeDescription.textContent =
    mode === 'relax'
      ? 'Inhale 4s · Exhale 6s'
      : 'Inhale 4s · Hold 2s · Exhale 6s · Rest 2s';

  resetSession();
}

toggleTimerButton.addEventListener('click', () => {
  isTimerVisible = !isTimerVisible;

  timerDisplay.classList.toggle(
    'hidden',
    !isTimerVisible
  );

  toggleTimerButton.textContent =
    isTimerVisible ? 'Hide Timer' : 'Show Timer';

  toggleTimerButton.setAttribute(
    'aria-pressed',
    String(!isTimerVisible)
  );
});

relaxButton.addEventListener('click', () => {
  selectMode('relax');
});

holdButton.addEventListener('click', () => {
  selectMode('hold');
});

startButton.addEventListener('click', startSession);
pauseButton.addEventListener('click', pauseSession);
resetButton.addEventListener('click', resetSession);

// Initialize
selectMode('relax');
