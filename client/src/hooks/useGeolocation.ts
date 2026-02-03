import { useState, useCallback, useRef, useEffect } from 'react';

export interface Coordinates {
  lat: number;
  lng: number;
  accuracy?: number;
  timestamp?: number;
  speed?: number; // meters per second
}

interface GeolocationState {
  currentPosition: Coordinates | null;
  error: string | null;
  isTracking: boolean;
  path: Coordinates[];
  distance: number;
  currentSpeed: number; // m/s
  currentPace: number; // seconds per km (0 if not moving)
}

// Haversine formula to calculate distance between two points in meters
const calculateDistance = (point1: Coordinates, point2: Coordinates): number => {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = (point1.lat * Math.PI) / 180;
  const φ2 = (point2.lat * Math.PI) / 180;
  const Δφ = ((point2.lat - point1.lat) * Math.PI) / 180;
  const Δλ = ((point2.lng - point1.lng) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
};

// Constants for filtering - more lenient for better tracking
const MAX_SPEED_MPS = 15; // ~54 km/h - max reasonable speed (allows fast running + some margin)
const MIN_ACCURACY_METERS = 50; // Stricter accuracy for better quality
const MIN_MOVEMENT_METERS = 3; // Minimum movement to count (filters GPS drift)
const SPEED_HISTORY_SIZE = 3; // Fewer samples for more responsive pace
const STATIONARY_SPEED_THRESHOLD = 0.5; // m/s - below this considered stationary

export function useGeolocation() {
  const [state, setState] = useState<GeolocationState>({
    currentPosition: null,
    error: null,
    isTracking: false,
    path: [],
    distance: 0,
    currentSpeed: 0,
    currentPace: 0
  });

  const watchIdRef = useRef<number | null>(null);
  const pathRef = useRef<Coordinates[]>([]);
  const distanceRef = useRef<number>(0);
  const speedHistoryRef = useRef<number[]>([]);
  const lastValidPositionRef = useRef<Coordinates | null>(null);
  const startTimeRef = useRef<number | null>(null);
  const lastUpdateTimeRef = useRef<number>(0);

  // Calculate average speed from recent history
  const getAverageSpeed = useCallback((): number => {
    const history = speedHistoryRef.current;
    if (history.length === 0) return 0;
    const sum = history.reduce((a, b) => a + b, 0);
    return sum / history.length;
  }, []);

  // Convert speed (m/s) to pace (seconds per km)
  const speedToPace = useCallback((speedMps: number): number => {
    if (speedMps < STATIONARY_SPEED_THRESHOLD) return 0; // Not moving
    return 1000 / speedMps; // seconds per km
  }, []);

  const getCurrentPosition = useCallback((): Promise<Coordinates> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported by this browser'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const coords: Coordinates = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            accuracy: position.coords.accuracy,
            timestamp: position.timestamp,
            speed: position.coords.speed ?? undefined
          };
          setState(prev => ({ ...prev, currentPosition: coords, error: null }));
          console.log('Initial position acquired:', coords.lat.toFixed(6), coords.lng.toFixed(6), `accuracy: ${coords.accuracy?.toFixed(0)}m`);
          resolve(coords);
        },
        (error) => {
          let errorMessage = 'Failed to get location';
          switch (error.code) {
            case error.PERMISSION_DENIED:
              errorMessage = 'Location permission denied. Please enable location access.';
              break;
            case error.POSITION_UNAVAILABLE:
              errorMessage = 'Location unavailable. Please enable GPS.';
              break;
            case error.TIMEOUT:
              errorMessage = 'Location request timed out. Please try again.';
              break;
          }
          setState(prev => ({ ...prev, error: errorMessage }));
          reject(new Error(errorMessage));
        },
        {
          enableHighAccuracy: true,
          timeout: 30000,
          maximumAge: 0
        }
      );
    });
  }, []);

  const processPosition = useCallback((position: GeolocationPosition) => {
    const now = Date.now();
    const coords: Coordinates = {
      lat: position.coords.latitude,
      lng: position.coords.longitude,
      accuracy: position.coords.accuracy,
      timestamp: position.timestamp,
      speed: position.coords.speed ?? undefined
    };

    // Throttle updates to prevent overwhelming the UI (min 500ms between updates)
    if (now - lastUpdateTimeRef.current < 500) {
      return;
    }
    lastUpdateTimeRef.current = now;

    // Filter by accuracy - reject very inaccurate readings but be lenient
    if (position.coords.accuracy > MIN_ACCURACY_METERS) {
      console.log(`GPS: Skipped - low accuracy (${position.coords.accuracy.toFixed(0)}m > ${MIN_ACCURACY_METERS}m)`);
      // Still update position for display, just don't track distance
      setState(prev => ({ ...prev, currentPosition: coords }));
      return;
    }

    // FIRST POINT - always add it to start the path
    if (!lastValidPositionRef.current) {
      pathRef.current = [coords];
      lastValidPositionRef.current = coords;
      startTimeRef.current = position.timestamp;
      
      setState(prev => ({
        ...prev,
        currentPosition: coords,
        path: [coords],
        distance: 0,
        currentSpeed: 0,
        currentPace: 0,
        error: null
      }));
      
      console.log('GPS: First point recorded', coords.lat.toFixed(6), coords.lng.toFixed(6));
      return;
    }

    // Calculate distance from last valid point
    const segmentDistance = calculateDistance(lastValidPositionRef.current, coords);
    
    // Calculate time difference in seconds
    const timeDiff = (position.timestamp - (lastValidPositionRef.current.timestamp || position.timestamp)) / 1000;
    
    // Calculate instantaneous speed
    let instantSpeed = timeDiff > 0 ? segmentDistance / timeDiff : 0;
    
    // Use device-reported speed if available and reasonable
    if (position.coords.speed !== null && position.coords.speed >= 0 && position.coords.speed < MAX_SPEED_MPS) {
      // Blend device speed with calculated speed for stability
      instantSpeed = (instantSpeed + position.coords.speed) / 2;
    }

    // Filter unrealistic speeds (teleportation/GPS jumps)
    if (instantSpeed > MAX_SPEED_MPS) {
      console.log(`GPS: Skipped - unrealistic speed (${(instantSpeed * 3.6).toFixed(1)} km/h)`);
      // Still update display position
      setState(prev => ({ ...prev, currentPosition: coords }));
      return;
    }

    // Filter tiny movements (GPS drift when stationary)
    if (segmentDistance < MIN_MOVEMENT_METERS) {
      // Update position for display but don't add to path/distance
      const avgSpeed = getAverageSpeed();
      setState(prev => ({
        ...prev,
        currentPosition: coords,
        currentSpeed: avgSpeed,
        currentPace: speedToPace(avgSpeed)
      }));
      return;
    }

    // Valid movement - add distance
    distanceRef.current += segmentDistance;

    // Update speed history
    if (instantSpeed > STATIONARY_SPEED_THRESHOLD) {
      speedHistoryRef.current.push(instantSpeed);
      if (speedHistoryRef.current.length > SPEED_HISTORY_SIZE) {
        speedHistoryRef.current.shift();
      }
    }

    // Add to path
    pathRef.current.push(coords);
    lastValidPositionRef.current = coords;

    const avgSpeed = getAverageSpeed();
    const currentPace = speedToPace(avgSpeed);

    setState(prev => ({
      ...prev,
      currentPosition: coords,
      path: [...pathRef.current],
      distance: distanceRef.current,
      currentSpeed: avgSpeed,
      currentPace: currentPace,
      error: null
    }));

    console.log(
      `GPS: +${segmentDistance.toFixed(1)}m | Total: ${distanceRef.current.toFixed(0)}m | ` +
      `Speed: ${(avgSpeed * 3.6).toFixed(1)}km/h | Accuracy: ${position.coords.accuracy.toFixed(0)}m`
    );
  }, [getAverageSpeed, speedToPace]);

  const startTracking = useCallback(() => {
    if (!navigator.geolocation) {
      setState(prev => ({ ...prev, error: 'Geolocation is not supported' }));
      return;
    }

    // Reset all tracking state
    pathRef.current = [];
    distanceRef.current = 0;
    speedHistoryRef.current = [];
    lastValidPositionRef.current = null;
    startTimeRef.current = null;
    lastUpdateTimeRef.current = 0;

    setState(prev => ({
      ...prev,
      isTracking: true,
      path: [],
      distance: 0,
      currentSpeed: 0,
      currentPace: 0,
      error: null
    }));

    console.log('GPS: Starting tracking...');

    watchIdRef.current = navigator.geolocation.watchPosition(
      processPosition,
      (error) => {
        let errorMessage = 'GPS error during tracking';
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'Location permission denied. Please enable in Settings.';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'GPS signal lost. Move to an open area.';
            break;
          case error.TIMEOUT:
            errorMessage = 'GPS timeout. Trying to reconnect...';
            // Don't set error for timeout, just log it - GPS will retry
            console.log(errorMessage);
            return;
        }
        setState(prev => ({ ...prev, error: errorMessage }));
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0 // Always get fresh position
      }
    );
  }, [processPosition]);

  const stopTracking = useCallback(() => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }

    const finalPath = [...pathRef.current];
    const finalDistance = distanceRef.current;

    console.log(`GPS: Tracking stopped. Final distance: ${finalDistance.toFixed(0)}m, Points: ${finalPath.length}`);

    setState(prev => ({
      ...prev,
      isTracking: false,
      currentSpeed: 0,
      currentPace: 0
    }));

    return { path: finalPath, distance: finalDistance };
  }, []);

  const resetTracking = useCallback(() => {
    pathRef.current = [];
    distanceRef.current = 0;
    speedHistoryRef.current = [];
    lastValidPositionRef.current = null;
    startTimeRef.current = null;
    lastUpdateTimeRef.current = 0;
    
    setState(prev => ({
      ...prev,
      path: [],
      distance: 0,
      currentSpeed: 0,
      currentPace: 0
    }));
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, []);

  return {
    ...state,
    getCurrentPosition,
    startTracking,
    stopTracking,
    resetTracking
  };
}
