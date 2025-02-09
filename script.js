// Icon definitions
const playIcon = `<svg width="24" height="24" viewBox="0 0 24 24">
    <path fill="currentColor" d="M8 5v14l11-7z"/>
</svg>`;
const pauseIcon = `<svg width="24" height="24" viewBox="0 0 24 24">
    <path fill="currentColor" d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>
</svg>`;

// Initialize play button with play icon.
document.getElementById('playPauseBtn').innerHTML = playIcon;

// Mapping project keys to JSON URLs.
const projectUrls = {
    godseye: 'https://raw.githubusercontent.com/khaos-studio/story-player/refs/heads/main/godseye.project.json?token=GHSAT0AAAAAAC5Z6WD4YZHPLKSPWLI4FLTIZ5JCRWQ',
    b4p: 'https://raw.githubusercontent.com/khaos-studio/story-player/refs/heads/main/b4p.project.json?token=GHSAT0AAAAAAC5Z6WD5C4UHK5TI5H2FLCKMZ5JCQ3Q',
};

let projectData = null,
    currentComposition = null,
    elementDict = {};
let scale = 10; // pixels per second.
let currentTime = 0; // current playhead time in seconds

// DOM Elements
const projectSelect = document.getElementById('projectSelect');
const themeSelect = document.getElementById('themeSelect');
const unitListEl = document.getElementById('unitList');
const activeElementCard = document.getElementById('activeElementCard');
const activeCaption = document.getElementById('activeCaption');
const eventDetailsEl = document.getElementById('eventDetails');
const zoomSlider = document.getElementById('zoomSlider');
const prevBtn = document.getElementById('prevBtn');
const playPauseBtn = document.getElementById('playPauseBtn');
const nextBtn = document.getElementById('nextBtn');
const contextDisplay = document.getElementById('contextDisplay');
const timelineContainer = document.getElementById('timelineContainer');
const timelineTrack = document.getElementById('timelineTrack');
const timelinePlayhead = document.getElementById('timelinePlayhead');
const timecodeDisplay = document.getElementById('timecodeDisplay');

// Helper: Parse time strings ("MM:SS" or "HH:MM:SS") into seconds.
function parseTime(timeStr) {
    if (!timeStr) return 0;
    const parts = timeStr.split(':').map(Number);
    if (parts.length === 2) return parts[0] * 60 + parts[1];
    if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
    return Number(timeStr) || 0;
}

// Format time in HH:MM:SS:MS format.
function formatTimecode(time) {
    const totalMs = Math.floor(time * 1000);
    const hours = Math.floor(totalMs / 3600000);
    const minutes = Math.floor((totalMs % 3600000) / 60000);
    const seconds = Math.floor((totalMs % 60000) / 1000);
    const ms = totalMs % 1000;
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}:${String(ms).padStart(3, '0')}`;
}

// Build a dictionary for quick lookup of story elements by ID.
function buildElementDictionary() {
    elementDict = {};
    if (projectData.elements) {
        if (Array.isArray(projectData.elements)) {
            projectData.elements.forEach(el => elementDict[el.id] = el);
        } else {
            for (const key in projectData.elements) {
                const arr = projectData.elements[key];
                if (Array.isArray(arr)) {
                    arr.forEach(el => elementDict[el.id] = el);
                }
            }
        }
    }
}

// Load a project JSON.
async function loadProject(projectKey) {
    const url = projectUrls[projectKey];
    try {
        const res = await fetch(url);
        projectData = await res.json();
        initProject();
    } catch (err) {
        console.error('Error loading project:', err);
    }
}

// Initialize the project: select composition, compute timeline data, etc.
function initProject() {
    if (!projectData || !projectData.compositions?.length) return;
    currentComposition = projectData.compositions[0];
    computeTimelineData();
    buildElementDictionary();
    populateUnitList();
    renderTimeline();
    updatePlayhead(currentComposition.units[0]?.startTime || 0);
}

// Compute each unit’s start time and length; compute each event’s computed start and duration.
function computeTimelineData() {
    let totalTime = 0;
    currentComposition.units.forEach(unit => {
        unit.startTime = totalTime;
        let unitLength = 0;
        if (unit.events?.length) {
            unit.events.forEach(event => {
                const dur = parseTime(event.duration) || 10;
                event.computedStart = unitLength;
                event.computedDuration = dur;
                unitLength += dur;
            });
        }
        unit.length = unitLength;
        totalTime += unitLength;
    });
    currentComposition.totalLength = totalTime;
}

// Populate the left panel with a list of CompositionUnits.
function populateUnitList() {
    unitListEl.innerHTML = '';
    currentComposition.units.forEach((unit, index) => {
        const li = document.createElement('li');
        li.textContent = unit.label;
        li.addEventListener('click', () => {
            document.querySelectorAll('#unitList li').forEach((el, i) =>
                el.classList.toggle('selected', i === index)
            );
            if (unit.events?.length) {
                updatePlayhead(unit.startTime + unit.events[0].computedStart);
            } else {
                updatePlayhead(unit.startTime);
            }
        });
        unitListEl.appendChild(li);
    });
}

// Render the timeline: draw each unit and its events.
function renderTimeline() {
    timelineTrack.innerHTML = '';
    const totalWidth = currentComposition.totalLength * scale + 100;
    timelineTrack.style.width = totalWidth + 'px';
    currentComposition.units.forEach(unit => {
        const unitDiv = document.createElement('div');
        unitDiv.className = 'unit-block';
        unitDiv.style.left = (unit.startTime * scale) + 'px';
        unitDiv.style.width = (unit.length * scale) + 'px';
        unitDiv.title = unit.label;
        unitDiv.textContent = unit.label;
        unitDiv.addEventListener('click', (e) => {
            e.stopPropagation();
            if (unit.events?.length) {
                updatePlayhead(unit.startTime + unit.events[0].computedStart);
            } else {
                updatePlayhead(unit.startTime);
            }
            centerPlayhead();
        });
        timelineTrack.appendChild(unitDiv);
        unit.events?.forEach(event => {
            const eventDiv = document.createElement('div');
            eventDiv.className = 'event-block';
            if (event.elementType === 'dialogue') {
                eventDiv.classList.add('dialogue');
            } else if (event.elementType === 'action') {
                eventDiv.classList.add('action');
            } else if (event.elementType === 'transition') {
                eventDiv.classList.add('transition');
            }
            eventDiv.style.left = (event.computedStart * scale) + 'px';
            eventDiv.style.width = (event.computedDuration * scale) + 'px';
            eventDiv.textContent = event.elementType;
            eventDiv.title = `${event.elementType} (${event.computedDuration}s)`;
            eventDiv.addEventListener('click', (e) => {
                e.stopPropagation();
                updatePlayhead(unit.startTime + event.computedStart);
                centerPlayhead();
            });
            unitDiv.appendChild(eventDiv);
        });
    });
}

// Update the playhead’s position and refresh event details.
function updatePlayhead(timeInSeconds) {
    currentTime = timeInSeconds;
    timelinePlayhead.style.left = (timeInSeconds * scale) + 'px';
    updateDetails();
    centerPlayhead();
    timecodeDisplay.textContent = formatTimecode(currentTime);
}

// Center the playhead in view within the timeline container.
function centerPlayhead() {
    const containerRect = timelineContainer.getBoundingClientRect();
    const playheadRect = timelinePlayhead.getBoundingClientRect();
    if (playheadRect.left < containerRect.left || playheadRect.right > containerRect.right) {
        const offset = (playheadRect.left + playheadRect.right) / 2 - containerRect.left;
        const scrollLeft = timelineContainer.scrollLeft + offset - containerRect.width / 2;
        timelineContainer.scrollTo({ left: scrollLeft, behavior: 'smooth' });
    }
}

// Find the event corresponding to the given absolute time.
function findEventAtTime(time) {
    for (const unit of currentComposition.units) {
        if (time >= unit.startTime && time < unit.startTime + unit.length) {
            const offset = time - unit.startTime;
            for (const event of unit.events) {
                if (offset >= event.computedStart && offset < event.computedStart + event.computedDuration) {
                    return { unit, event };
                }
            }
            return { unit, event: unit.events[0] };
        }
    }
    return null;
}

// Update active element details (main panel) and raw event details (right panel).
function updateDetails() {
    const found = findEventAtTime(currentTime);
    if (found) {
        const { unit, event } = found;
        const caption = `Unit: ${unit.label}, Event: ${event.elementType} at ${currentTime.toFixed(2)}s`;
        activeCaption.textContent = caption;
        contextDisplay.textContent = caption;
        let activeElement = elementDict[event.elementId];
        let cardContent = '';
        if (activeElement) {
            if (activeElement.type === 'dialogue') {
                const charElement = activeElement.characterId ? elementDict[activeElement.characterId] : null;
                const characterName = charElement ? charElement.name : activeElement.characterId || 'Unknown';
                const dialogueText = activeElement.lines ? activeElement.lines.map(line => line.text).join('<br>') : '';
                cardContent = `<strong>Dialogue by ${characterName}</strong><br>${dialogueText}`;
            } else if (activeElement.type === 'action' || activeElement.type === 'transition') {
                cardContent = `<strong>${activeElement.type.charAt(0).toUpperCase() + activeElement.type.slice(1)}</strong><br>${activeElement.text}`;
            } else {
                cardContent = `<strong>${activeElement.type}</strong><br><pre>${JSON.stringify(activeElement, null, 2)}</pre>`;
            }
        } else {
            cardContent = `No element found for id ${event.elementId}`;
        }
        activeElementCard.innerHTML = cardContent;
        eventDetailsEl.textContent = JSON.stringify(event, null, 2);
        updateActiveUnitSelection();
    } else {
        activeElementCard.textContent = 'No event found.';
        activeCaption.textContent = '';
        eventDetailsEl.textContent = '';
    }
}

// Highlight the active unit in the left panel.
function updateActiveUnitSelection() {
    const found = findEventAtTime(currentTime);
    if (found) {
        const unitListItems = document.querySelectorAll('#unitList li');
        currentComposition.units.forEach((unit, index) => {
            if (unit === found.unit) {
                unitListItems[index].classList.add('selected');
            } else {
                unitListItems[index].classList.remove('selected');
            }
        });
    }
}

// Playback controls.
let isPlaying = false, lastFrameTime = null;
function playbackLoop(timestamp) {
    if (!lastFrameTime) lastFrameTime = timestamp;
    const delta = (timestamp - lastFrameTime) / 1000;
    lastFrameTime = timestamp;
    updatePlayhead(currentTime + delta);
    if (currentTime >= currentComposition.totalLength) {
        isPlaying = false;
        playPauseBtn.innerHTML = playIcon;
        return;
    }
    if (isPlaying) requestAnimationFrame(playbackLoop);
}

playPauseBtn.addEventListener('click', () => {
    isPlaying = !isPlaying;
    if (isPlaying) {
        playPauseBtn.innerHTML = pauseIcon;
        lastFrameTime = null;
        requestAnimationFrame(playbackLoop);
    } else {
        playPauseBtn.innerHTML = playIcon;
    }
});

nextBtn.addEventListener('click', () => {
    let nextTime = null;
    currentComposition.units.forEach(unit => {
        unit.events?.forEach(event => {
            const eventStart = unit.startTime + event.computedStart;
            if (eventStart > currentTime && (nextTime === null || eventStart < nextTime))
                nextTime = eventStart;
        });
    });
    if (nextTime !== null) updatePlayhead(nextTime);
});

prevBtn.addEventListener('click', () => {
    let prevTime = null;
    currentComposition.units.forEach(unit => {
        unit.events?.forEach(event => {
            const eventStart = unit.startTime + event.computedStart;
            if (eventStart < currentTime && (prevTime === null || eventStart > prevTime))
                prevTime = eventStart;
        });
    });
    if (prevTime !== null) updatePlayhead(prevTime);
});

// Draggable playhead.
let dragging = false;
timelinePlayhead.addEventListener('mousedown', (e) => { dragging = true; e.preventDefault(); });
document.addEventListener('mousemove', (e) => {
    if (dragging) {
        const rect = timelineContainer.getBoundingClientRect();
        let x = e.clientX - rect.left + timelineContainer.scrollLeft;
        if (x < 0) x = 0;
        updatePlayhead(x / scale);
    }
});
document.addEventListener('mouseup', () => { dragging = false; });

// Zoom slider.
zoomSlider.addEventListener('input', (e) => {
    scale = Number(e.target.value);
    renderTimeline();
    updatePlayhead(currentTime);
});

// Project selector.
projectSelect.addEventListener('change', (e) => loadProject(e.target.value));

// Theme selection logic.
function applyTheme(theme) {
    if (theme === "dark") {
        document.body.classList.add("dark-mode");
    } else if (theme === "light") {
        document.body.classList.remove("dark-mode");
    } else if (theme === "system") {
        if (window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches) {
            document.body.classList.add("dark-mode");
        } else {
            document.body.classList.remove("dark-mode");
        }
    }
}

themeSelect.addEventListener("change", () => {
    applyTheme(themeSelect.value);
});

if (window.matchMedia) {
    window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", e => {
        if (themeSelect.value === "system") {
            applyTheme("system");
        }
    });
}

applyTheme(themeSelect.value);
loadProject(projectSelect.value);
