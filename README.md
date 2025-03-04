# Story Player Documentation

## Overview

The Story Player is a prototype for visualizing and navigating screenplay/story data in an interactive timeline format. It enables users to view, play, and examine narrative segments, events, and elements within a story project.

## UI Components

The Story Player interface consists of:

### 1. Top Header
- Project selector dropdown to load different story projects
- Theme selector (System/Light/Dark) for display preferences

### 2. Three-Panel Layout
- **Left Panel**: List of segments in the story/screenplay
- **Middle Panel**: 
  - Image preview area (currently using placeholder)
  - Active element card showing selected event details
  - Caption display showing context of selected event
- **Right Panel**: Raw event details in JSON format

### 3. Control Bar
- Playback controls (Previous, Play/Pause, Next)
- Zoom slider to adjust timeline scale
- Context display showing current position
- Timecode display (HH:MM:SS:MS format)

### 4. Timeline
- Visual representation of segments and events
- Color-coded event blocks based on element type
- Draggable playhead for navigation
- Interactive segments and events for selection

## Data Structure

The Story Player processes project data in a specific JSON format:

```
Project
└── Compositions
    └── Segments
        └── Events
            └── References to Elements
```

### Project Metadata
```json
"project": {
    "title": "Project Title",
    "createdBy": "Author",
    "projectId": "unique-id",
    "status": "Status",
    "owner": "Owner",
    "collaborators": []
}
```

### Compositions
A project contains one or more compositions, each with its own set of segments.

### Segments
Each composition contains segments which represent scenes or logical divisions within the narrative.

Segment properties include:
- `label`: Display name for the segment
- `sceneId`: Unique identifier for the scene
- `sceneNumber`: Scene number in the screenplay
- `locationId`: Reference to a location element
- `sceneHeading`: Full scene heading text
- `locationType`: INT./EXT.
- `timeOfDay`: Time setting (DAY, NIGHT, etc.)
- `mediaType`: Type of media (e.g., "scene")
- `format`: Format of the content (e.g., "screenplay")
- `events`: Array of events within this segment

### Events
Events represent individual narrative elements within a segment, such as dialogue, action, or transitions.

Event properties include:
- `elementType`: Type of element (dialogue, action, transition)
- `elementId`: Reference to the full element in the elements array
- `startTime`: Start time in the format "HH:MM:SS"
- `duration`: Duration in the format "HH:MM:SS"

The player computes additional properties for events:
- `computedStart`: Calculated start time in seconds within the segment
- `computedDuration`: Calculated duration in seconds

### Elements
Elements are the actual content pieces referenced by events, such as:
- Character definitions
- Location definitions
- Dialogue elements
- Action elements
- Transition elements

Element properties vary by type but generally include:
- `id`: Unique identifier
- `type`: Element type (character, location, dialogue, action, transition)
- `name`/`text`: The content of the element
- Additional type-specific properties (e.g., character ID for dialogue elements)

## Features & Functionality

### Timeline Navigation
- **Segment Selection**: Click on a segment in the left panel or timeline to navigate to it
- **Event Selection**: Click on an event within a segment to navigate to that specific moment
- **Playhead Control**: Drag the red playhead to scrub through the timeline
- **Playback Controls**: Use previous/next buttons to jump between events
- **Keyboard Controls**: 
  - Space: Play/Pause
  - Arrow Left/Right: Previous/Next event
  - Arrow Up/Down: Previous/Next segment

### Project Selection & Loading
- Select different projects from the dropdown menu
- Projects are loaded from JSON files via specified URLs
- Projects are parsed and processed to compute timeline data

### Visual Timeline
- **Segments**: Visually represented as blocks in the timeline
- **Events**: Displayed as colored blocks within segments
- **Event Types**: Color-coded by type (dialogue, action, transition)
- **Zoom Control**: Adjust the scale of the timeline for more detail or overview

### Theme Support
- System: Automatically follows system dark/light preference
- Light: Light background with dark text
- Dark: Dark background with light text

## Technical Implementation

### Initialization Process
1. Load project JSON data
2. Select the first composition
3. Compute timeline data (segment start times, event durations)
4. Build element dictionary for quick lookups
5. Populate segment list and timeline
6. Position playhead at the beginning

### Timeline Computation
- The player calculates absolute start times for each segment
- For each event, it computes the relative start time within its segment
- The total duration of each segment is calculated based on its events
- The total composition length is the sum of all segment durations

### Element Lookup
- Elements are indexed in a dictionary by ID for quick retrieval
- When an event is selected, its associated element is retrieved and displayed

### Playback Engine
- Playback uses requestAnimationFrame for smooth animation
- The playhead position is updated based on elapsed time
- Active elements are updated whenever the playhead position changes
- The timeline automatically scrolls to keep the playhead in view

### Timeline Positioning Logic
- For detailed explanation of the timeline positioning and sizing algorithms, see [Timeline Logic Documentation](timeline_logic.md)

## Additional Documentation

For more detailed technical information about specific components:

- [Timeline Logic Documentation](timeline_logic.md) - Detailed explanation of how segment and event positions/sizes are calculated and rendered
- [Documentation Roadmap](documentation_roadmap.md) - Outline of additional components that would benefit from detailed documentation for thorough knowledge transfer

## Getting Started

1. Open index.html in a web browser
2. Select a project from the dropdown menu
3. Navigate through the timeline using:
   - Click on segments in the left panel
   - Click directly on the timeline
   - Use playback controls
   - Drag the playhead

## Example Projects

The prototype includes several example projects:
- Big Fish
- Breaking Pulp Fiction
- God's Eye
- Broken in 4 Places
- Shawshank Redemption
- Heart of an Indie
- Breaking Even

Smaller projects like "Heart of an Indie" or "God's Eye" are recommended for initial exploration as they load faster and are easier to navigate.
