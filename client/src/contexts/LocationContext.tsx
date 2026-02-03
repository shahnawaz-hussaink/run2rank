import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';

export interface Coordinates {
  lat: number;
  lng: number;
  accuracy?: number;
  timestamp?: number;
}

interface LocationContextType {
  currentLocation: Coordinates | null;
  locationPermission: 'granted' | 'denied' | 'prompt' | 'unknown';
  locationError: string | null;
  isLoading: boolean;
  requestLocation: () => Promise<Coordinates | null>;
  startWatching: () => void;
  stopWatching: () => void;
}

const LocationContext = createContext<LocationContextType | undefined>(undefined);

export function LocationProvider({ children }: { children: ReactNode }) {
  const [currentLocation, setCurrentLocation] = useState<Coordinates | null>(null);
  const [locationPermission, setLocationPermission] = useState<'granted' | 'denied' | 'prompt' | 'unknown'>('unknown');
  const [locationError, setLocationError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [watchId, setWatchId] = useState<number | null>(null);

  // Check permission status on mount
  useEffect(() => {
    const checkPermission = async () => {
      if (!navigator.geolocation) {
        setLocationError('Geolocation is not supported by this browser');
        setIsLoading(false);
        return;
      }

      try {
        // Check if permissions API is available
        if (navigator.permissions && navigator.permissions.query) {
          const result = await navigator.permissions.query({ name: 'geolocation' });
          setLocationPermission(result.state as 'granted' | 'denied' | 'prompt');
          
          // If already granted, get location immediately
          if (result.state === 'granted') {
            getLocation();
          } else {
            setIsLoading(false);
          }

          // Listen for permission changes
          result.addEventListener('change', () => {
            setLocationPermission(result.state as 'granted' | 'denied' | 'prompt');
            if (result.state === 'granted') {
              getLocation();
            }
          });
        } else {
          // Fallback: try to get location and see what happens
          getLocation();
        }
      } catch (error) {
        console.log('Permission check failed, attempting direct location request');
        getLocation();
      }
    };

    checkPermission();

    return () => {
      if (watchId !== null) {
        navigator.geolocation.clearWatch(watchId);
      }
    };
  }, []);

  const getLocation = useCallback(() => {
    if (!navigator.geolocation) return;

    setIsLoading(true);
    setLocationError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const coords: Coordinates = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracy: position.coords.accuracy,
          timestamp: position.timestamp
        };
        setCurrentLocation(coords);
        setLocationPermission('granted');
        setLocationError(null);
        setIsLoading(false);
        console.log('Location obtained:', coords);
      },
      (error) => {
        let errorMessage = 'Failed to get location';
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'Location permission denied';
            setLocationPermission('denied');
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Location unavailable';
            break;
          case error.TIMEOUT:
            errorMessage = 'Location request timed out';
            break;
        }
        setLocationError(errorMessage);
        setIsLoading(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000 // Cache for 1 minute
      }
    );
  }, []);

  const requestLocation = useCallback(async (): Promise<Coordinates | null> => {
    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        setLocationError('Geolocation is not supported');
        resolve(null);
        return;
      }

      setIsLoading(true);
      
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const coords: Coordinates = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            accuracy: position.coords.accuracy,
            timestamp: position.timestamp
          };
          setCurrentLocation(coords);
          setLocationPermission('granted');
          setLocationError(null);
          setIsLoading(false);
          resolve(coords);
        },
        (error) => {
          let errorMessage = 'Failed to get location';
          switch (error.code) {
            case error.PERMISSION_DENIED:
              errorMessage = 'Location permission denied. Please enable in your browser settings.';
              setLocationPermission('denied');
              break;
            case error.POSITION_UNAVAILABLE:
              errorMessage = 'Location unavailable. Please enable GPS.';
              break;
            case error.TIMEOUT:
              errorMessage = 'Location request timed out.';
              break;
          }
          setLocationError(errorMessage);
          setIsLoading(false);
          resolve(null);
        },
        {
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 0
        }
      );
    });
  }, []);

  const startWatching = useCallback(() => {
    if (!navigator.geolocation || watchId !== null) return;

    const id = navigator.geolocation.watchPosition(
      (position) => {
        const coords: Coordinates = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracy: position.coords.accuracy,
          timestamp: position.timestamp
        };
        setCurrentLocation(coords);
        setLocationPermission('granted');
        setLocationError(null);
      },
      (error) => {
        console.error('Watch position error:', error);
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 5000
      }
    );
    
    setWatchId(id);
  }, [watchId]);

  const stopWatching = useCallback(() => {
    if (watchId !== null) {
      navigator.geolocation.clearWatch(watchId);
      setWatchId(null);
    }
  }, [watchId]);

  return (
    <LocationContext.Provider 
      value={{ 
        currentLocation, 
        locationPermission, 
        locationError, 
        isLoading, 
        requestLocation,
        startWatching,
        stopWatching
      }}
    >
      {children}
    </LocationContext.Provider>
  );
}

export function useLocation() {
  const context = useContext(LocationContext);
  if (context === undefined) {
    throw new Error('useLocation must be used within a LocationProvider');
  }
  return context;
}
