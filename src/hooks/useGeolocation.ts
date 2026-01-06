import { useState, useCallback, useRef, useEffect } from 'react';

export interface Coordinates {
  lat: number;
  lng: number;
  accuracy?: number;
  timestamp?: number;
}

interface GeolocationState {
  currentPosition: Coordinates | null;
  error: string | null;
  isTracking: boolean;
  path: Coordinates[];
  distance: number;
}

// Haversine formula to calculate distance between two points
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

export function useGeolocation() {
  const [state, setState] = useState<GeolocationState>({
    currentPosition: null,
    error: null,
    isTracking: false,
    path: [],
    distance: 0
  });

  const watchIdRef = useRef<number | null>(null);
  const pathRef = useRef<Coordinates[]>([]);
  const distanceRef = useRef<number>(0);

  const getCurrentPosition = useCallback((): Promise<Coordinates> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported by this browser'));
        return;
      }

      // Check for secure context (required for iOS)
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
            timestamp: position.timestamp
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
          timeout: 30000, // Increased timeout for iOS
          maximumAge: 0
        }
      );
    });
  }, []);

  const startTracking = useCallback(() => {
    if (!navigator.geolocation) {
      setState(prev => ({ ...prev, error: 'Geolocation is not supported' }));
      return;
    }

    // Reset tracking state
    pathRef.current = [];
    distanceRef.current = 0;

    setState(prev => ({
      ...prev,
      isTracking: true,
      path: [],
      distance: 0,
      error: null
    }));

    watchIdRef.current = navigator.geolocation.watchPosition(
      (position) => {
        const newCoord: Coordinates = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracy: position.coords.accuracy,
          timestamp: position.timestamp
        };

        // Accept wider accuracy for iOS devices (up to 50m), but filter jitter
        const maxAccuracy = /iPhone|iPad|iPod/.test(navigator.userAgent) ? 50 : 30;
        
        if (position.coords.accuracy <= maxAccuracy) {
          // Calculate distance from last point
          if (pathRef.current.length > 0) {
            const lastPoint = pathRef.current[pathRef.current.length - 1];
            const segmentDistance = calculateDistance(lastPoint, newCoord);
            
            // Only add point if moved at least 3 meters (filter GPS jitter)
            if (segmentDistance >= 3) {
              distanceRef.current += segmentDistance;
              pathRef.current.push(newCoord);
            }
          } else {
            pathRef.current.push(newCoord);
          }

          setState(prev => ({
            ...prev,
            currentPosition: newCoord,
            path: [...pathRef.current],
            distance: distanceRef.current,
            error: null
          }));
        }
      },
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
        timeout: 30000, // Increased timeout for iOS
        maximumAge: 2000, // Allow slightly cached positions for smoother tracking
        // iOS specific: lower distanceFilter helps with accuracy
      }
    );
  }, []);

  const stopTracking = useCallback(() => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }

    const finalPath = [...pathRef.current];
    const finalDistance = distanceRef.current;

    setState(prev => ({
      ...prev,
      isTracking: false
    }));

    return { path: finalPath, distance: finalDistance };
  }, []);

  const resetTracking = useCallback(() => {
    pathRef.current = [];
    distanceRef.current = 0;
    setState(prev => ({
      ...prev,
      path: [],
      distance: 0
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
