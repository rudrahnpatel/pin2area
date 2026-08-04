import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Tooltip, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { ExternalLink } from 'lucide-react';
import 'leaflet/dist/leaflet.css';

// Custom marker icon tuned for light and dark themes
const createCustomIcon = (isSelected = false, isDark = false) => {
  const size = isSelected ? 18 : 12;
  const border = isSelected ? 3 : 2;
  const shadow = isSelected ? '0 0 14px rgba(255, 181, 157, 0.9)' : '0 0 6px rgba(0,0,0,0.4)';
  const color = isSelected ? (isDark ? '#FFB59D' : '#B3400E') : (isDark ? '#E1C551' : '#715D00');
  const borderColor = isSelected ? '#FFFFFF' : (isDark ? '#3B2F00' : '#FFE08C');

  return L.divIcon({
    className: 'custom-marker',
    html: `<div style="
      width: ${size}px; height: ${size}px;
      background: ${color};
      border: ${border}px solid ${borderColor};
      border-radius: 50%;
      box-shadow: ${shadow};
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    "></div>`,
    iconSize: [size + border * 2, size + border * 2],
    iconAnchor: [(size + border * 2) / 2, (size + border * 2) / 2],
  });
};

// Map resizer to ensure tiles load 100% reliably
function MapResizer() {
  const map = useMap();
  useEffect(() => {
    map.invalidateSize();
    const t1 = setTimeout(() => map.invalidateSize(), 150);
    const t2 = setTimeout(() => map.invalidateSize(), 500);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [map]);
  return null;
}

function FlyToLocation({ selectedLocation }) {
  const map = useMap();
  useEffect(() => {
    if (selectedLocation && selectedLocation.lat && selectedLocation.lng) {
      map.flyTo([selectedLocation.lat, selectedLocation.lng], 14, {
        animate: true,
        duration: 1.2
      });
    }
  }, [selectedLocation, map]);
  return null;
}

export default function MapView({ pincodes, selectedLocation, onSelectLocation, theme }) {
  const defaultCenter = [12.9716, 77.5946];
  const defaultZoom = 11;
  const isDark = theme === 'dark';

  const tileUrl = "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";
  const tileAttribution = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>';

  const openGoogleMaps = (lat, lng) => {
    window.open(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="map-wrapper" style={{ width: '100%', height: '100%', minHeight: '500px' }}>
      <MapContainer
        center={defaultCenter}
        zoom={defaultZoom}
        scrollWheelZoom={true}
        zoomControl={true}
        style={{ height: '100%', width: '100%', minHeight: '500px' }}
      >
        <MapResizer />
        <TileLayer
          attribution={tileAttribution}
          url={tileUrl}
        />

        {pincodes.map((pin) => (
          <Marker
            key={pin.pincode}
            position={[pin.lat, pin.lng]}
            icon={createCustomIcon(selectedLocation?.pincode === pin.pincode, isDark)}
            eventHandlers={{
              click: () => onSelectLocation(pin),
            }}
          >
            <Tooltip
              direction="top"
              offset={[0, -10]}
              className="pin-tooltip"
              permanent={false}
            >
              <strong>{pin.pincode}</strong>: {pin.area}
            </Tooltip>
            <Popup className="pin-popup">
              <div className="popup-inner">
                <div className="popup-header">
                  <span className="popup-badge">{pin.pincode}</span>
                  <h3 className="popup-title">{pin.area}</h3>
                </div>
                {pin.subAreas && pin.subAreas.length > 0 && (
                  <p className="popup-subs">{pin.subAreas.join(', ')}</p>
                )}
                <button 
                  className="popup-gmaps-btn"
                  onClick={() => openGoogleMaps(pin.lat, pin.lng)}
                >
                  <ExternalLink size={12} />
                  <span>Open in Google Maps</span>
                </button>
              </div>
            </Popup>
          </Marker>
        ))}

        <FlyToLocation selectedLocation={selectedLocation} />
      </MapContainer>
    </div>
  );
}
