export function formatDistance(meters: number): string {
  if (meters < 1000) {
    return `${Math.round(meters)}m`;
  }
  return `${(meters / 1000).toFixed(2)}km`;
}

export function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${minutes}:${secs.toString().padStart(2, '0')}`;
}

// Format pace from average (distance in meters, duration in seconds)
export function formatPace(meters: number, seconds: number): string {
  if (meters === 0 || seconds === 0) return '--:--';
  
  // Calculate seconds per kilometer
  const secondsPerKm = (seconds / meters) * 1000;
  
  // Cap at reasonable pace (max 30 min/km for walking)
  if (secondsPerKm > 1800) return '--:--';
  
  const paceMinutes = Math.floor(secondsPerKm / 60);
  const paceSeconds = Math.round(secondsPerKm % 60);
  
  return `${paceMinutes}:${paceSeconds.toString().padStart(2, '0')}`;
}

// Format real-time pace from seconds per km
export function formatCurrentPace(secondsPerKm: number): string {
  if (secondsPerKm === 0 || secondsPerKm > 1800) return '--:--';
  
  const paceMinutes = Math.floor(secondsPerKm / 60);
  const paceSeconds = Math.round(secondsPerKm % 60);
  
  return `${paceMinutes}:${paceSeconds.toString().padStart(2, '0')}`;
}

// Format speed in km/h
export function formatSpeed(metersPerSecond: number): string {
  const kmh = metersPerSecond * 3.6;
  return `${kmh.toFixed(1)} km/h`;
}

export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
}

export function formatTime(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });
}
