import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Coordinates } from '@/hooks/useGeolocation';
import { Territory, useTerritories } from '@/hooks/useTerritories';
import { useAuth } from '@/contexts/AuthContext';

interface TerritoryMapProps {
  center?: Coordinates;
  path?: Coordinates[];
  height?: string;
  showCurrentLocation?: boolean;
  isTracking?: boolean;
  zoom?: number;
  pincode?: string;
  showTerritories?: boolean;
  previewTerritory?: Coordinates[];
}

export function TerritoryMap({ 
  center, 
  path = [], 
  height = '300px',
  showCurrentLocation = true,
  isTracking = false,
  zoom = 15,
  pincode,
  showTerritories = true,
  previewTerritory
}: TerritoryMapProps) {
  const { user } = useAuth();
  const mapRef = useRef<L.Map | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const pathLineRef = useRef<L.Polyline | null>(null);
  const markerRef = useRef<L.CircleMarker | null>(null);
  const territoryLayersRef = useRef<L.Polygon[]>([]);
  const previewLayerRef = useRef<L.Polygon | null>(null);
  const [mapReady, setMapReady] = useState(false);

  const { territories } = useTerritories(showTerritories ? pincode || null : null);

  // Initialize map
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const defaultCenter: L.LatLngExpression = center 
      ? [center.lat, center.lng] 
      : [40.7128, -74.0060];

    mapRef.current = L.map(containerRef.current, {
      center: defaultCenter,
      zoom: zoom,
      zoomControl: true,
      attributionControl: false
    });

    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
      maxZoom: 19
    }).addTo(mapRef.current);

    setMapReady(true);

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        setMapReady(false);
      }
    };
  }, []);

  // Update map center when tracking
  useEffect(() => {
    if (mapRef.current && center && isTracking) {
      mapRef.current.panTo([center.lat, center.lng]);
    }
  }, [center, isTracking]);

  // Update current location marker
  useEffect(() => {
    if (!mapRef.current || !center || !showCurrentLocation) return;

    if (markerRef.current) {
      markerRef.current.setLatLng([center.lat, center.lng]);
    } else {
      markerRef.current = L.circleMarker([center.lat, center.lng], {
        radius: 10,
        fillColor: '#22d3ee',
        fillOpacity: 1,
        color: '#0891b2',
        weight: 3
      }).addTo(mapRef.current);
    }
  }, [center, showCurrentLocation]);

  // Update path line
  useEffect(() => {
    if (!mapRef.current) return;

    if (pathLineRef.current) {
      mapRef.current.removeLayer(pathLineRef.current);
    }

    if (path.length > 1) {
      const latLngs: L.LatLngExpression[] = path.map(p => [p.lat, p.lng]);
      
      pathLineRef.current = L.polyline(latLngs, {
        color: '#10b981',
        weight: 4,
        opacity: 0.9,
        smoothFactor: 1,
        lineCap: 'round',
        lineJoin: 'round'
      }).addTo(mapRef.current);

      if (!isTracking && path.length > 0) {
        mapRef.current.fitBounds(pathLineRef.current.getBounds(), { padding: [50, 50] });
      }
    }
  }, [path, isTracking]);

  // Draw territories
  useEffect(() => {
    if (!mapRef.current || !mapReady) return;

    // Clear existing territory layers
    territoryLayersRef.current.forEach(layer => {
      mapRef.current?.removeLayer(layer);
    });
    territoryLayersRef.current = [];

    // Draw each territory
    territories.forEach(territory => {
      if (territory.territory_polygon.length < 3) return;

      const latLngs: L.LatLngExpression[] = territory.territory_polygon.map(
        p => [p.lat, p.lng]
      );

      const isOwnTerritory = territory.user_id === user?.id;
      
      const polygon = L.polygon(latLngs, {
        color: territory.color,
        fillColor: territory.color,
        fillOpacity: isOwnTerritory ? 0.4 : 0.25,
        weight: isOwnTerritory ? 3 : 2,
        dashArray: isOwnTerritory ? undefined : '5, 5'
      }).addTo(mapRef.current!);

      polygon.bindPopup(`
        <div class="text-sm">
          <strong>${territory.username}</strong><br/>
          <span class="text-muted-foreground">
            ${(territory.distance_meters / 1000).toFixed(2)} km covered
          </span>
        </div>
      `);

      territoryLayersRef.current.push(polygon);
    });
  }, [territories, mapReady, user?.id]);

  // Draw preview territory (for current run before saving)
  useEffect(() => {
    if (!mapRef.current || !mapReady) return;

    if (previewLayerRef.current) {
      mapRef.current.removeLayer(previewLayerRef.current);
      previewLayerRef.current = null;
    }

    if (previewTerritory && previewTerritory.length >= 3) {
      const latLngs: L.LatLngExpression[] = previewTerritory.map(p => [p.lat, p.lng]);
      
      previewLayerRef.current = L.polygon(latLngs, {
        color: '#f59e0b',
        fillColor: '#f59e0b',
        fillOpacity: 0.3,
        weight: 2,
        dashArray: '10, 5'
      }).addTo(mapRef.current);
    }
  }, [previewTerritory, mapReady]);

  return (
    <div 
      ref={containerRef} 
      className="map-container w-full rounded-xl"
      style={{ height }}
    />
  );
}
