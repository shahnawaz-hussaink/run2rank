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

// Calculate speed between two points in m/s
const calculateSpeed = (point1: Coordinates, point2: Coordinates): number => {
  if (!point1.timestamp || !point2.timestamp) return 0;
  const timeDiff = (point2.timestamp - point1.timestamp) / 1000; // seconds
  if (timeDiff <= 0) return 0;
  const distance = calculateDistance(point1, point2);
  return distance / timeDiff;
};

// Smoothing factor for coordinates (simple exponential smoothing)
const smoothCoordinate = (
  newValue: number,
  oldValue: number | undefined,
  factor: number = 0.3
): number => {
  if (oldValue === undefined) return newValue;
  return oldValue + factor * (newValue - oldValue);
};

// Constants for filtering
const MAX_SPEED_MPS = 12; // ~43 km/h - max reasonable running/sprinting speed
const MIN_ACCURACY_METERS = 100; // Accept readings up to 100m accuracy
const MIN_MOVEMENT_METERS = 2; // Minimum movement to count (filters GPS drift)
const SPEED_HISTORY_SIZE = 5; // Number of speed samples to average
const STATIONARY_SPEED_THRESHOLD = 0.3; // m/s - below this considered stationary

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
  const smoothedPositionRef = useRef<Coordinates | null>(null);

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

      if (window.isSecureContext === false) {
        reject(new Error('Geolocation requires a secure connection (HTTPS)'));
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
          resolve(coords);
        },
        (error) => {
          let errorMessage = 'Failed to get location';
          switch (error.code) {
            case error.PERMISSION_DENIED:
              errorMessage = 'Location permission denied. Please enable location access in your device settings.';
              break;
            case error.POSITION_UNAVAILABLE:
              errorMessage = 'Location information unavailable. Please ensure GPS is enabled.';
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
    const rawCoord: Coordinates = {
      lat: position.coords.latitude,
      lng: position.coords.longitude,
      accuracy: position.coords.accuracy,
      timestamp: position.timestamp,
      speed: position.coords.speed ?? undefined
    };

    // Filter by accuracy - reject very inaccurate readings
    if (position.coords.accuracy > MIN_ACCURACY_METERS) {
      console.log(`GPS: Rejected - accuracy too low (${position.coords.accuracy}m)`);
      return;
    }

    // Apply coordinate smoothing
    const smoothedCoord: Coordinates = {
      lat: smoothCoordinate(rawCoord.lat, smoothedPositionRef.current?.lat, 0.4),
      lng: smoothCoordinate(rawCoord.lng, smoothedPositionRef.current?.lng, 0.4),
      accuracy: rawCoord.accuracy,
      timestamp: rawCoord.timestamp,
      speed: rawCoord.speed
    };
    smoothedPositionRef.current = smoothedCoord;

    // Calculate speed from position change if device doesn't provide it
    let calculatedSpeed = rawCoord.speed ?? 0;
    if (lastValidPositionRef.current && lastValidPositionRef.current.timestamp) {
      const positionSpeed = calculateSpeed(lastValidPositionRef.current, smoothedCoord);
      // Use device speed if available and reasonable, otherwise use calculated
      if (rawCoord.speed === undefined || rawCoord.speed === null) {
        calculatedSpeed = positionSpeed;
      } else {
        // Average device speed with calculated for better accuracy
        calculatedSpeed = (rawCoord.speed + positionSpeed) / 2;
      }
    }

    // Filter unrealistic speeds (teleportation/GPS jumps)
    if (calculatedSpeed > MAX_SPEED_MPS && lastValidPositionRef.current) {
      console.log(`GPS: Rejected - unrealistic speed (${(calculatedSpeed * 3.6).toFixed(1)} km/h)`);
      return;
    }

    // Calculate distance from last valid point
    let segmentDistance = 0;
    if (lastValidPositionRef.current) {
      segmentDistance = calculateDistance(lastValidPositionRef.current, smoothedCoord);
      
      // Filter tiny movements (GPS drift when stationary)
      if (segmentDistance < MIN_MOVEMENT_METERS) {
        // Still update current position for display, but don't add to path/distance
        setState(prev => ({
          ...prev,
          currentPosition: smoothedCoord,
          currentSpeed: getAverageSpeed(),
          currentPace: speedToPace(getAverageSpeed())
        }));
        return;
      }

      // Add distance
      distanceRef.current += segmentDistance;
    }

    // Update speed history
    speedHistoryRef.current.push(calculatedSpeed);
    if (speedHistoryRef.current.length > SPEED_HISTORY_SIZE) {
      speedHistoryRef.current.shift();
    }

    // Add to path
    pathRef.current.push(smoothedCoord);
    lastValidPositionRef.current = smoothedCoord;

    const avgSpeed = getAverageSpeed();
    const currentPace = speedToPace(avgSpeed);

    setState(prev => ({
      ...prev,
      currentPosition: smoothedCoord,
      path: [...pathRef.current],
      distance: distanceRef.current,
      currentSpeed: avgSpeed,
      currentPace: currentPace,
      error: null
    }));

    console.log(`GPS: Valid point - Distance: ${distanceRef.current.toFixed(0)}m, Speed: ${(avgSpeed * 3.6).toFixed(1)} km/h, Accuracy: ${position.coords.accuracy.toFixed(0)}m`);
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
    smoothedPositionRef.current = null;

    setState(prev => ({
      ...prev,
      isTracking: true,
      path: [],
      distance: 0,
      currentSpeed: 0,
      currentPace: 0,
      error: null
    }));

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
            errorMessage = 'GPS timeout. Retrying...';
            break;
        }
        setState(prev => ({ ...prev, error: errorMessage }));
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
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
    smoothedPositionRef.current = null;
    
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
