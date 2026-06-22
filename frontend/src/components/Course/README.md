# Video Player Documentation

## Overview

This project provides multiple video player components for React applications, specifically designed for educational platforms. It includes both a VideoJS-based player and a Cloudinary video player for optimal streaming quality and user experience.

## Key Features

- **Adaptive Streaming**: HLS support for automatic quality adjustment based on network conditions
- **Quality Selection**: Manual quality selection options
- **Smooth Playback**: Enhanced buffering and preloading for uninterrupted viewing
- **Picture-in-Picture**: Support for PiP mode for multitasking
- **Cloudinary Integration**: Native Cloudinary video player support for optimal streaming
- **Video Preloading**: Preloads the next video for instant transitions
- **Playback Controls**: Play/pause, volume, seek, skip forward/backward
- **Playback Speed**: Adjustable playback speed (0.25x to 2x)
- **Fullscreen Mode**: Toggle fullscreen viewing
- **Progress Tracking**: Track video progress and completion
- **Automatic Player Selection**: Intelligently chooses between VideoJS and Cloudinary players based on the video source

## Installation

Make sure you have the required dependencies:

```bash
# For VideoJS player
npm install video.js @videojs/http-streaming videojs-contrib-quality-levels

# For Cloudinary player
npm install cloudinary-video-player

# Common dependencies
npm install lucide-react
```

## Basic Usage

```tsx
import VideoPlayer from '@/components/Course/VideoPlayer';

function MyComponent() {
  return (
    <VideoPlayer
      src="https://example.com/video.mp4"
      poster="https://example.com/poster.jpg"
    />
  );
}
```

The `VideoPlayer` component will automatically choose the best player based on the video source. If the URL is from Cloudinary, it will use the Cloudinary player; otherwise, it will use the VideoJS player.

## Advanced Usage

### With Cloudinary Direct Integration

```tsx
import VideoPlayer from '@/components/Course/VideoPlayer';

function MyComponent() {
  return (
    <VideoPlayer
      src="https://res.cloudinary.com/demo/video/upload/dog.mp4"
      cloudName="demo"
      publicId="dog"
      poster="https://res.cloudinary.com/demo/image/upload/dog.jpg"
    />
  );
}
```

### With Multiple Quality Options

```tsx
import VideoPlayer from '@/components/Course/VideoPlayer';

function MyComponent() {
  // Define multiple video resolutions
  const videoResolutions = [
    {
      url: 'https://res.cloudinary.com/demo/video/upload/sp_auto:maxres/v1/dog.mp4',
      quality: '1080p',
      format: 'mp4'
    },
    {
      url: 'https://res.cloudinary.com/demo/video/upload/h_720,q_auto/v1/dog.mp4',
      quality: '720p',
      format: 'mp4'
    },
    {
      url: 'https://res.cloudinary.com/demo/video/upload/sp_hd/v1/dog.m3u8',
      quality: 'Auto (HLS)',
      format: 'hls'
    }
  ];

  return (
    <VideoPlayer
      src="https://res.cloudinary.com/demo/video/upload/dog.mp4"
      videoResolutions={videoResolutions}
      hlsUrl="https://res.cloudinary.com/demo/video/upload/sp_hd/v1/dog.m3u8"
    />
  );
}
```

### With Progress Tracking

```tsx
import VideoPlayer from '@/components/Course/VideoPlayer';

function MyComponent() {
  const handleComplete = (player) => {
    console.log('Video completed!');
    // Update course progress, etc.
  };

  const handleTimeUpdate = (time: number) => {
    console.log('Current time:', time);
    // Save current position for resuming later
  };

  return (
    <VideoPlayer
      src="https://example.com/video.mp4"
      onComplete={handleComplete}
      onTimeUpdate={handleTimeUpdate}
      videoId="unique-video-id" // Used for saving position in Redux
    />
  );
}
```

### Forcing a Specific Player

```tsx
import VideoPlayer from '@/components/Course/VideoPlayer';

function MyComponent() {
  return (
    <VideoPlayer
      src="https://res.cloudinary.com/demo/video/upload/dog.mp4"
      useCloudinaryPlayer={false} // Force VideoJS player
    />
  );
}
```

## Props

### Common Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `src` | string | (required) | URL of the video file |
| `videoResolutions` | array | undefined | Array of video resolution options |
| `hlsUrl` | string | undefined | URL of the HLS stream |
| `initialPosition` | number | 0 | Initial playback position in seconds |
| `onTimeUpdate` | function | undefined | Callback fired when playback position changes |
| `onComplete` | function | undefined | Callback fired when video is considered complete (95% watched) |
| `onDurationChange` | function | undefined | Callback fired when video duration is available |
| `onReady` | function | undefined | Callback fired when the player is ready |
| `className` | string | undefined | Additional CSS classes |
| `poster` | string | undefined | URL of the poster image |
| `videoId` | string | undefined | Unique identifier for the video (used for saving position) |

### VideoPlayer-specific Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `useCloudinaryPlayer` | boolean | auto | Whether to use the Cloudinary player (true) or the VideoJS player (false) |
| `cloudName` | string | undefined | Your Cloudinary cloud name |
| `publicId` | string | undefined | The public ID of the video in your Cloudinary account |

## Utility Functions

The player comes with utility functions for working with videos:

### isCloudinaryUrl

Checks if a URL is from Cloudinary:

```tsx
import { isCloudinaryUrl } from '@/utils/videoUtils';

const isFromCloudinary = isCloudinaryUrl(url);
// Returns: true or false
```

### optimizeCloudinaryUrl

Optimizes a Cloudinary URL for better video streaming:

```tsx
import { optimizeCloudinaryUrl } from '@/utils/videoUtils';

const optimizedUrl = optimizeCloudinaryUrl(url, {
  quality: 'auto',
  streaming: 'auto:maxres',
  dpr: 'auto',
  enableCache: true
});
```

### generateCloudinaryQualities

Generates quality variants for a Cloudinary video:

```tsx
import { generateCloudinaryQualities } from '@/utils/videoUtils';

const qualities = generateCloudinaryQualities(cloudinaryUrl);
// Returns: [{ label: '1080p', src: '...' }, { label: '720p', src: '...' }, ...]
```

### isHlsStream

Checks if a URL is an HLS stream:

```tsx
import { isHlsStream } from '@/utils/videoUtils';

const isHls = isHlsStream(url);
// Returns: true or false
```

## Example Component

See `VideoPlayerExample.tsx` for a complete example of how to use the video player with all features.
