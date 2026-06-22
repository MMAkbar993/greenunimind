# LMS Lecture Content Types (Video, Audio, Articles)

The frontend supports **video**, **audio**, **article (text)**, and **PDF** per lecture. Teachers can create a lesson with **at least one** of: video, audio, or article (PDF remains optional).

## Backend requirements

For create/update lecture APIs and the lecture model, support these fields:

| Field           | Type   | Description                                      |
|----------------|--------|--------------------------------------------------|
| `videoUrl`     | string | Optional. Existing.                              |
| `videoResolutions` | array | Optional. Adaptive streaming.                 |
| `hlsUrl`       | string | Optional. HLS stream URL.                        |
| **`audioUrl`** | string | **New.** URL for audio-only lessons (e.g. MP3).  |
| **`articleContent`** | string | **New.** Rich text / article content (plain or HTML). |
| `pdfUrl`       | string | Optional. PDF attachment.                       |
| `instruction`  | string | Optional. Short instructions/summary.           |

- **Create lecture** (`POST /lectures/:courseId/create-lecture`): accept `audioUrl` and `articleContent` in the body.
- **Update lecture** (`PATCH /lectures/:courseId/update-lecture/:lectureId`): accept `audioUrl` and `articleContent` in the body.
- **Lecture model**: add optional `audioUrl` and `articleContent` (string). Validation: at least one of `videoUrl`, `audioUrl`, or `articleContent` (non-empty) should be present if you enforce it server-side.

## Frontend behavior

- **Create**: Teacher can upload video (optional), audio (optional), and/or enter article text. At least one of video, audio, or article is required.
- **Edit**: Same fields; existing audio/article are shown and can be replaced or cleared.
- **Student view**: `UnifiedContentViewer` shows tabs for Video, Audio, Article, PDF when present and renders native `<audio>` for audio and sanitized HTML (line breaks) for article.

## File uploads

- Video: Cloudinary `video` (existing).
- Audio: Cloudinary `raw` (same as PDF); MIME is `audio/*`, so `useMedia` sends it as `raw`.
- Article: No file; stored as string in `articleContent`.
