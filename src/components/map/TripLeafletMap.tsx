'use client';

import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

import { RoadsidePoi } from '@/lib/types/roadside';
import { getDestinationPhoto } from '@/lib/geo/destination-photos';

export interface MapPoint {
  id: string;
  title: string;
  address?: string | null;
  latitude: number;
  longitude: number;
  sortOrder?: number;
  isLocked?: boolean;
  photoUrl?: string | null;
  weather?: {
    tempC: number;
    condition: 'sunny' | 'cloudy' | 'rainy' | 'storm';
    labelVi: string;
    isOutdoorWarning?: boolean;
    warningMessage?: string;
  } | null;
}

export interface TripLeafletMapProps {
  points?: MapPoint[];
  center?: [number, number];
  zoom?: number;
  showRoute?: boolean;
  onSelectPoint?: (point: MapPoint) => void;
  userLocation?: [number, number] | null;
  roadsidePois?: RoadsidePoi[];
  className?: string;
  interactive?: boolean;
  onMapClick?: (lat: number, lng: number) => void;
}

export default function TripLeafletMap({
  points = [],
  center,
  zoom = 13,
  showRoute = true,
  onSelectPoint,
  userLocation,
  roadsidePois = [],
  className = 'h-[400px] w-full rounded-2xl overflow-hidden',
  interactive = true,
  onMapClick,
}: TripLeafletMapProps) {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const routePolylineRef = useRef<L.Polyline | null>(null);

  // Khởi tạo Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      // Tọa độ mặc định: Trung tâm các điểm hoặc Đà Lạt nếu trống
      const initialCenter: [number, number] = center
        ? center
        : points.length > 0
        ? [points[0].latitude, points[0].longitude]
        : [11.9404, 108.4583];

      const map = L.map(mapContainerRef.current, {
        center: initialCenter,
        zoom: zoom,
        zoomControl: interactive,
        dragging: interactive,
        scrollWheelZoom: interactive ? 'center' : false,
      });

      // Sử dụng OpenStreetMap Tile Server chính thức (100% miễn phí, không yêu cầu API key)
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19,
      }).addTo(map);

      const markersGroup = L.layerGroup().addTo(map);
      markersLayerRef.current = markersGroup;
      mapInstanceRef.current = map;

      // Invalidate size after layout settles
      setTimeout(() => {
        map.invalidateSize();
      }, 200);

      if (onMapClick) {
        map.on('click', (e: L.LeafletMouseEvent) => {
          onMapClick(e.latlng.lat, e.latlng.lng);
        });
      }
    }

    const handleFocusMap = (e: Event) => {
      const customEvent = e as CustomEvent<{ latitude: number; longitude: number; name?: string }>;
      if (!customEvent.detail || !mapInstanceRef.current) return;
      const { latitude, longitude, name } = customEvent.detail;
      if (typeof latitude === 'number' && typeof longitude === 'number') {
        const map = mapInstanceRef.current;
        map.flyTo([latitude, longitude], 15, { duration: 1.2 });
        mapContainerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });

        L.popup()
          .setLatLng([latitude, longitude])
          .setContent(
            `<div style="font-family: inherit; font-size: 13px; font-weight: 600; color: #184E77; padding: 2px;">📍 ${
              name || 'Địa điểm gợi ý'
            }</div>`
          )
          .openOn(map);
      }
    };

    window.addEventListener('smart-trip:focus-map', handleFocusMap);

    return () => {
      window.removeEventListener('smart-trip:focus-map', handleFocusMap);
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Cập nhật Markers và Route Polyline
  useEffect(() => {
    const map = mapInstanceRef.current;
    const markersGroup = markersLayerRef.current;
    if (!map || !markersGroup) return;

    markersGroup.clearLayers();
    if (routePolylineRef.current) {
      routePolylineRef.current.remove();
      routePolylineRef.current = null;
    }

    const latLngs: [number, number][] = [];

    // 1. Vẽ User Live GPS Location nếu có
    if (userLocation) {
      const userIcon = L.divIcon({
        className: 'user-location-marker',
        html: `
          <div style="position: relative; width: 24px; height: 24px;">
            <div style="position: absolute; width: 24px; height: 24px; background: rgba(26, 117, 159, 0.3); border-radius: 50%; animation: pulse 2s infinite;"></div>
            <div style="position: absolute; top: 4px; left: 4px; width: 16px; height: 16px; background: #1A759F; border: 3px solid #FFFFFF; border-radius: 50%; box-shadow: 0 2px 6px rgba(0,0,0,0.3);"></div>
          </div>
        `,
        iconSize: [24, 24],
        iconAnchor: [12, 12],
      });

      L.marker(userLocation, { icon: userIcon, zIndexOffset: 1000 })
        .addTo(markersGroup)
        .bindPopup('<b>Vị trí hiện tại của nhóm</b>');

      latLngs.push(userLocation);
    }

    // 2. Vẽ các điểm dừng lịch trình
    points.forEach((point, idx) => {
      const displayIndex = point.sortOrder !== undefined ? point.sortOrder + 1 : idx + 1;
      const isLocked = point.isLocked;
      const weather = point.weather;

      // Icon màu Yale Blue (#184E77), nếu locked màu Emerald (#76C893)
      const bgColor = isLocked ? '#76C893' : '#184E77';
      const textColor = '#FFFFFF';

      const customIcon = L.divIcon({
        className: 'custom-trip-marker',
        html: `
          <div style="
            background: ${bgColor};
            color: ${textColor};
            width: 32px;
            height: 32px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: 700;
            font-size: 13px;
            border: 2.5px solid #FFFFFF;
            box-shadow: 0 4px 10px rgba(24, 78, 119, 0.35);
            cursor: pointer;
            position: relative;
          ">
            ${displayIndex}
            ${weather?.isOutdoorWarning ? `
              <span style="
                position: absolute;
                top: -6px;
                right: -6px;
                width: 14px;
                height: 14px;
                background: #C2410C;
                border: 2px solid #FFF;
                border-radius: 50%;
              "></span>
            ` : ''}
          </div>
        `,
        iconSize: [32, 32],
        iconAnchor: [16, 16],
      });

      const marker = L.marker([point.latitude, point.longitude], { icon: customIcon }).addTo(markersGroup);

      // Popup thông tin điểm đến & thời tiết kèm hình ảnh minh họa
      const photo = point.photoUrl || getDestinationPhoto(point.title);
      const popupHtml = `
        <div style="font-family: 'Be Vietnam Pro', sans-serif; min-width: 200px; max-width: 240px; padding: 2px;">
          ${photo ? `
            <div style="
              width: 100%;
              height: 96px;
              border-radius: 8px;
              margin-bottom: 8px;
              background-image: url('${photo}');
              background-size: cover;
              background-position: center;
              box-shadow: inset 0 0 0 1px rgba(0,0,0,0.1);
            "></div>
          ` : ''}
          <div style="font-weight: 700; font-size: 14px; color: #184E77; margin-bottom: 2px; line-height: 1.3;">
            ${point.title}
          </div>
          ${point.address ? `<div style="font-size: 11px; color: #64748B; margin-bottom: 6px; line-height: 1.3;">${point.address}</div>` : ''}
          ${weather ? `
            <div style="
              display: inline-flex;
              align-items: center;
              gap: 6px;
              background: ${weather.isOutdoorWarning ? '#FFF1E6' : '#EEF6E4'};
              color: ${weather.isOutdoorWarning ? '#C2410C' : '#2E7D5B'};
              padding: 3px 8px;
              border-radius: 9999px;
              font-size: 11px;
              font-weight: 600;
            ">
              <span>${weather.tempC}°C</span>
              <span>•</span>
              <span>${weather.labelVi}</span>
            </div>
            ${weather.warningMessage ? `
              <div style="margin-top: 6px; font-size: 11px; color: #C2410C; line-height: 1.4;">
                ⚠️ ${weather.warningMessage}
              </div>
            ` : ''}
          ` : ''}
        </div>
      `;

      marker.bindPopup(popupHtml);

      if (onSelectPoint) {
        marker.on('click', () => onSelectPoint(point));
      }

      latLngs.push([point.latitude, point.longitude]);
    });

    // 3. Vẽ các Roadside POIs (Cây xăng & Tiệm sửa xe)
    if (roadsidePois && roadsidePois.length > 0) {
      roadsidePois.forEach((poi) => {
        const isGas = poi.type === 'gas_station';
        const bgColor = isGas ? '#D97706' : '#1A759F';
        const iconSymbol = isGas ? '⛽' : '🔧';

        const poiIcon = L.divIcon({
          className: 'roadside-poi-marker',
          html: `
            <div style="
              background: ${bgColor};
              color: #FFFFFF;
              width: 26px;
              height: 26px;
              border-radius: 8px;
              display: flex;
              align-items: center;
              justify-content: center;
              font-size: 13px;
              border: 2px solid #FFFFFF;
              box-shadow: 0 3px 8px rgba(0,0,0,0.25);
              cursor: pointer;
            ">
              ${iconSymbol}
            </div>
          `,
          iconSize: [26, 26],
          iconAnchor: [13, 13],
        });

        const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${poi.latitude},${poi.longitude}`;

        const poiPopup = `
          <div style="font-family: 'Be Vietnam Pro', sans-serif; min-width: 190px; padding: 4px;">
            <div style="display: flex; align-items: center; gap: 4px; margin-bottom: 2px;">
              <span style="font-size: 10px; font-weight: 700; background: ${
                isGas ? '#FEF3C7' : '#E0F2FE'
              }; color: ${isGas ? '#92400E' : '#0369A1'}; padding: 2px 6px; border-radius: 4px;">
                ${isGas ? 'Cây xăng' : 'Sửa xe / Cứu hộ'}
              </span>
              ${poi.brand ? `<span style="font-size: 11px; color: #64748B;">• ${poi.brand}</span>` : ''}
            </div>
            <div style="font-weight: 700; font-size: 13px; color: #184E77; margin-bottom: 3px;">
              ${poi.name}
            </div>
            <div style="font-size: 11px; color: #64748B; margin-bottom: 4px;">
              📍 ${poi.address}
            </div>
            ${
              poi.phone
                ? `
              <div style="font-size: 12px; font-weight: 600; color: #1E6091; margin-bottom: 8px;">
                📞 <a href="tel:${poi.phone.replace(/\s+/g, '')}" style="color: inherit; text-decoration: none;">${poi.phone}</a>
              </div>
            `
                : ''
            }
            <a href="${googleMapsUrl}" target="_blank" rel="noopener noreferrer" style="
              display: inline-block;
              background: #184E77;
              color: #FFFFFF;
              font-size: 11px;
              font-weight: 600;
              padding: 4px 10px;
              border-radius: 6px;
              text-decoration: none;
              text-align: center;
            ">
              Chỉ đường Google Maps ↗
            </a>
          </div>
        `;

        L.marker([poi.latitude, poi.longitude], { icon: poiIcon })
          .addTo(markersGroup)
          .bindPopup(poiPopup);
      });
    }

    // 4. Nối tuyến Polyline giữa các điểm
    if (showRoute && latLngs.length >= 2) {
      routePolylineRef.current = L.polyline(latLngs, {
        color: '#1A759F',
        weight: 3.5,
        opacity: 0.85,
        dashArray: '6, 8',
      }).addTo(map);
    }

    // 5. Tự động Fit Bounds để hiển thị trọn vẹn các điểm
    if (latLngs.length > 0) {
      if (latLngs.length === 1) {
        map.setView(latLngs[0], zoom);
      } else {
        const bounds = L.latLngBounds(latLngs);
        map.fitBounds(bounds, { padding: [40, 40], maxZoom: 16 });
      }
    } else if (center) {
      map.setView(center, zoom);
    }

    setTimeout(() => {
      map.invalidateSize();
    }, 150);
  }, [points, center, userLocation, roadsidePois, showRoute, zoom, onSelectPoint]);

  return <div ref={mapContainerRef} className={className} />;
}
