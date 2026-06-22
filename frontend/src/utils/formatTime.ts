/**
 * Formats seconds into a human-readable duration string
 * @param seconds - Total seconds to format
 * @param format - Output format ('compact' for "1h 30m", 'full' for "1 hour 30 minutes")
 * @returns Formatted duration string
 */
export const formatDuration = (seconds: number, format: 'compact' | 'full' = 'compact'): string => {
  if (!seconds || isNaN(seconds)) return format === 'compact' ? '0m' : '0 minutes';

  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);

  if (format === 'compact') {
    if (hours > 0) {
      return `${hours}h ${minutes > 0 ? `${minutes}m` : ''}`;
    }
    return `${minutes}m`;
  } else {
    // Full format
    const hourText = hours > 0 ? `${hours} hour${hours !== 1 ? 's' : ''}` : '';
    const minuteText = minutes > 0 ? `${minutes} minute${minutes !== 1 ? 's' : ''}` : '';

    if (hours > 0 && minutes > 0) {
      return `${hourText} ${minuteText}`;
    }

    return hourText || minuteText || '0 minutes';
  }
};

/**
 * Formats seconds into HH:MM:SS format
 * @param seconds - Total seconds to format
 * @returns Formatted time string (HH:MM:SS or MM:SS)
 */
export const formatTimeDisplay = (seconds: number): string => {
  if (!seconds || isNaN(seconds)) return '00:00';

  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = Math.floor(seconds % 60);

  const formattedMinutes = String(minutes).padStart(2, '0');
  const formattedSeconds = String(remainingSeconds).padStart(2, '0');

  if (hours > 0) {
    const formattedHours = String(hours).padStart(2, '0');
    return `${formattedHours}:${formattedMinutes}:${formattedSeconds}`;
  }

  return `${formattedMinutes}:${formattedSeconds}`;
};

/**
 * Formats video timestamp in a user-friendly format with AM/PM
 * @param seconds - Total seconds to format
 * @returns Formatted timestamp string (e.g., "01:30 PM")
 */
export const formatTimestamp = (seconds: number): string => {
  if (!seconds || isNaN(seconds)) return '00:00';

  // Get current time
  const now = new Date();

  // Create a date object for today with the video timestamp
  const date = new Date(now.setHours(0, 0, 0, 0)); // Reset to midnight
  date.setSeconds(seconds); // Add the video timestamp seconds

  // Format the time with AM/PM
  const hours = date.getHours();
  const minutes = date.getMinutes();
  const seconds12Hour = date.getSeconds();
  const ampm = hours >= 12 ? 'PM' : 'AM';

  // Convert to 12-hour format
  const hours12 = hours % 12 || 12;

  // Format with leading zeros
  const formattedHours = String(hours12).padStart(2, '0');
  const formattedMinutes = String(minutes).padStart(2, '0');
  const formattedSeconds = String(seconds12Hour).padStart(2, '0');

  return `${formattedHours}:${formattedMinutes}:${formattedSeconds} ${ampm}`;
};
