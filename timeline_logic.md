# Story Player Timeline Logic

This document explains the algorithms and calculations used by the Story Player to determine the positions and sizes of elements in the timeline visualization.

## Core Concepts

The Story Player timeline visualizes a hierarchical structure:
- **Compositions** contain **Segments*
- **Segments** contain **Events**

To visually represent these elements with proper timing, the player uses several key calculations.

## Timeline Calculation Process

The core timeline calculations happen in the `computeTimelineData()` function. Here's the step-by-step logic:

### 1. Calculating Segment Positions and Durations

```javascript
let totalTime = 0;
currentComposition.segments.forEach(segment => {
    segment.startTime = totalTime;
    let segmentLength = 0;
    // Calculate segment length based on events...
    segment.length = segmentLength;
    totalTime += segmentLength;
});
currentComposition.totalLength = totalTime;
```

Each segment is positioned sequentially on the timeline:
- The first segment starts at 0 seconds
- Each subsequent segment starts immediately after the previous segment ends
- The segment's duration (length) is the sum of all its events' durations
- The composition's total duration is the sum of all segment durations

**Formula for Segment Start Time:**
```
segment[i].startTime = sum(segment[0...i-1].length)
```

### 2. Calculating Event Positions and Durations

```javascript
if (segment.events?.length) {
    segment.events.forEach(event => {
        const dur = parseTime(event.duration) || 10;
        event.computedStart = segmentLength;
        event.computedDuration = dur;
        segmentLength += dur;
    });
}
```

For each event within a segment:
- The event's duration is parsed from its `duration` property (default: 10 seconds)
- The event's start time relative to the segment (`computedStart`) is the sum of all previous events' durations
- Each event is placed sequentially, one after another

**Formula for Event Position within Segment:**
```
event[j].computedStart = sum(event[0...j-1].computedDuration)
```

**Formula for Absolute Event Position:**
```
absoluteEventStart = segment.startTime + event.computedStart
```

## Rendering the Timeline

The visual representation is created in the `renderTimeline()` function, which translates the computed time values to pixel positions.

### 1. Converting Time to Pixels

The conversion from time (seconds) to pixels uses a scaling factor:

```javascript
let scale = 10; // Default: 10 pixels per second
```

This scale can be adjusted by the user via the zoom slider (`zoomSlider`).

### 2. Segment Positioning

```javascript
segmentDiv.style.left = (segment.startTime * scale) + 'px';
segmentDiv.style.width = (segment.length * scale) + 'px';
```

- **Position (left)**: `segment.startTime × scale` pixels
- **Width**: `segment.length × scale` pixels

### 3. Event Positioning within Segments

```javascript
eventDiv.style.left = (event.computedStart * scale) + 'px';
eventDiv.style.width = (event.computedDuration * scale) + 'px';
```

- **Position (left)**: `event.computedStart × scale` pixels from the left edge of its parent segment
- **Width**: `event.computedDuration × scale` pixels

### 4. Playhead Positioning

```javascript
timelinePlayhead.style.left = (timeInSeconds * scale) + 'px';
```

- **Position (left)**: `currentTime × scale` pixels

## Zooming Logic

The scale factor (pixels per second) can be adjusted through the zoom slider:

```javascript
zoomSlider.addEventListener('input', (e) => {
    scale = Number(e.target.value);
    renderTimeline();
    updatePlayhead(currentTime);
});
```

When the scale changes:
1. The entire timeline is re-rendered with the new scale
2. The playhead is repositioned based on the current time
3. All segment and event positions and sizes are recalculated

The zoom slider has a range from 5 to 50, meaning:
- Minimum zoom: 5 pixels per second
- Maximum zoom: 50 pixels per second

## Navigation Logic

### 1. Finding Events at a Specific Time

The player uses the `findEventAtTime()` function to determine which event is active at a given time:

```javascript
function findEventAtTime(time) {
    for (const segment of currentComposition.segments) {
        if (time >= segment.startTime && time < segment.startTime + segment.length) {
            const offset = time - segment.startTime;
            for (const event of segment.events) {
                if (offset >= event.computedStart && 
                    offset < event.computedStart + event.computedDuration) {
                    return { segment, event };
                }
            }
            return { segment, event: segment.events[0] };
        }
    }
    return null;
}
```

This function:
1. Finds the segment containing the given time
2. Calculates the offset from the segment's start
3. Finds the event within that segment that contains the offset
4. Returns the matching segment and event

### 2. Centering the Playhead

When navigating to a specific time, the timeline view is automatically scrolled to keep the playhead visible:

```javascript
function centerPlayhead() {
    const containerRect = timelineContainer.getBoundingClientRect();
    const playheadRect = timelinePlayhead.getBoundingClientRect();
    if (playheadRect.left < containerRect.left || 
        playheadRect.right > containerRect.right) {
        const offset = (playheadRect.left + playheadRect.right) / 2 - containerRect.left;
        const scrollLeft = timelineContainer.scrollLeft + offset - containerRect.width / 2;
        timelineContainer.scrollTo({ left: scrollLeft, behavior: 'smooth' });
    }
}
```

This ensures that the playhead remains visible as it moves along the timeline.

## Visual Example

Consider a simple composition with two segments:

```
Segment A: 30 seconds total
  ├── Event A1: 10 seconds
  ├── Event A2: 15 seconds
  └── Event A3: 5 seconds

Segment B: 20 seconds total
  ├── Event B1: 8 seconds
  └── Event B2: 12 seconds
```

The timeline would be calculated as:

1. **Segment A**
   - Start time: 0 seconds
   - Length: 30 seconds
   - **Event A1**
     - Computed start: 0 seconds (relative to segment)
     - Computed duration: 10 seconds
   - **Event A2**
     - Computed start: 10 seconds (relative to segment)
     - Computed duration: 15 seconds
   - **Event A3**
     - Computed start: 25 seconds (relative to segment)
     - Computed duration: 5 seconds

2. **Segment B**
   - Start time: 30 seconds (immediately after Segment A)
   - Length: 20 seconds
   - **Event B1**
     - Computed start: 0 seconds (relative to segment)
     - Computed duration: 8 seconds
   - **Event B2**
     - Computed start: 8 seconds (relative to segment)
     - Computed duration: 12 seconds

With a scale of 10 pixels per second, the visual representation would be:

- **Segment A**: Position: 0px, Width: 300px
  - **Event A1**: Position: 0px, Width: 100px
  - **Event A2**: Position: 100px, Width: 150px
  - **Event A3**: Position: 250px, Width: 50px

- **Segment B**: Position: 300px, Width: 200px
  - **Event B1**: Position: 0px, Width: 80px
  - **Event B2**: Position: 80px, Width: 120px

## Conclusion

The Story Player uses a straightforward but effective approach to translate time-based story data into a visual timeline:

1. Times are computed sequentially, starting from 0
2. Each segment follows the previous one with no gaps
3. Within segments, events are arranged sequentially with no gaps
4. A scaling factor converts seconds to pixels for display
5. Navigation utilities keep the relevant parts of the timeline visible

This logic ensures that segments and events are accurately positioned and sized according to their timing information, providing a reliable visual representation of the story's structure and flow.
