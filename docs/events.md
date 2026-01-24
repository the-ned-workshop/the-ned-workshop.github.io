# Events

Events are stored as Markdown files in `src/data/events/`.

## File Naming

Name event files using the format: `YYYY-MM-DD-event-slug.md`

Example: `2025-02-07-earring-making.md`

## Frontmatter Fields

Each event file must include YAML frontmatter with the following fields:

| Field | Required | Description |
|-------|----------|-------------|
| `title` | Yes | The name of the event |
| `date` | Yes | Event date in `YYYY-MM-DD` format |
| `startTime` | Yes | Start time (e.g., `"1:00 PM"`) |
| `endTime` | Yes | End time (e.g., `"3:00 PM"`) |
| `location` | Yes | Venue name |
| `locationUrl` | No | Google Maps or other link to the venue |
| `cost` | Yes | Cost (e.g., `"FREE"` or `"$20"`) |
| `costNote` | No | Additional cost info (e.g., `"all supplies provided"`) |

## Body Content

The content after the frontmatter is the event description. It will be displayed as plain text.

## Example

```markdown
---
title: Earring Making Event
date: 2025-02-07
startTime: "1:00 PM"
endTime: "3:00 PM"
location: Ned General
locationUrl: https://www.google.com/maps/place/Ned+General/@39.9616,-105.5108,17z
cost: FREE
costNote: all supplies provided
---

Come join our first event celebrating girl power by making sewn earrings. You'll learn some basic hand sewing skills and will get time to chat and drink with friends.

Food and drinks available for purchase at Ned General.
```

## Adding a New Event

1. Create a new `.md` file in `src/data/events/`
2. Add the required frontmatter fields
3. Write the event description
4. Commit and push - the site will automatically rebuild
