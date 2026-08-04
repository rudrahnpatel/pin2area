import { useState, useRef } from 'react';
import { Search, X, Sun, Moon, Monitor, Clock, MapPin, Copy, Check, ExternalLink, Map as MapIcon, ChevronDown } from 'lucide-react';
import MapView from './MapView';

export default function MobileView({ theme, setTheme, query, onSearch, results, onSelectLocation, selectedLocation, totalPincodes, history, clearHistory, addToHistory, pincodes }) {
  const [copiedPin, setCopiedPin] = useState(null);
  const [showMapModal, setShowMapModal] = useState(false);
  const inputRef = useRef(null);

  const handleClear = () => {
    onSearch('');
    inputRef.current?.focus();
  };

  const handleCopy = (e, pin) => {
    e.stopPropagation();
    navigator.clipboard.writeText(pin);
    setCopiedPin(pin);
    setTimeout(() => setCopiedPin(null), 1800);
  };

  const handleDirections = (e, r) => {
    e.stopPropagation();
    window.open(`https://www.google.com/maps/dir/?api=1&destination=${r.lat},${r.lng}`, '_blank', 'noopener,noreferrer');
  };

  const handleCardClick = (loc) => {
    onSelectLocation(loc);
  };

  const handleOpenMap = (e, loc) => {
    e.stopPropagation();
    onSelectLocation(loc);
    setShowMapModal(true);
  };

  return (
    <div className="mobile-view-container">
      {/* Mobile Top Header */}
      <header className="mobile-header">
        <div className="brand">
          <div className="brand-icon">
            <MapPin size={20} />
          </div>
          <div>
            <h1 className="brand-title">Pin2Area</h1>
            <p className="brand-subtitle">Bangalore Directory</p>
          </div>
        </div>
        <div className="theme-switcher compact">
          <button className={`theme-btn ${theme === 'light' ? 'active' : ''}`} onClick={() => setTheme('light')}>
            <Sun size={13} />
          </button>
          <button className={`theme-btn ${theme === 'auto' ? 'active' : ''}`} onClick={() => setTheme('auto')}>
            <Monitor size={13} />
          </button>
          <button className={`theme-btn ${theme === 'dark' ? 'active' : ''}`} onClick={() => setTheme('dark')}>
            <Moon size={13} />
          </button>
        </div>
      </header>

      {/* Search Input */}
      <div className="search-container mobile-search">
        <div className="search-box">
          <Search size={18} className="search-icon" />
          <input
            ref={inputRef}
            type="text"
            className="search-input"
            placeholder="Search pincode or area name..."
            value={query}
            onChange={(e) => onSearch(e.target.value)}
          />
          {query && (
            <button type="button" className="search-clear" onClick={handleClear}>
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="mobile-content-body">
        {/* Recent Searches (Clean Vertical List) */}
        {!query && history.length > 0 && (
          <div className="history-section">
            <div className="history-head">
              <span className="section-label">Recent Searches</span>
              <button className="text-btn" onClick={clearHistory}>Clear all</button>
            </div>
            <div className="history-vertical-list">
              {history.map((item, idx) => (
                <button key={idx} className="history-vertical-item" onClick={() => onSearch(item)}>
                  <Clock size={14} className="history-item-icon" />
                  <span className="history-item-text">{item}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Stats card */}
        {!query && (
          <div className="stats-card mobile-stats">
            <div className="stat-item">
              <span className="stat-value">{totalPincodes}</span>
              <span className="stat-desc">Locations</span>
            </div>
            <div className="stat-divider" />
            <div className="stat-item">
              <span className="stat-value">560xxx</span>
              <span className="stat-desc">Coverage</span>
            </div>
            <div className="stat-divider" />
            <div className="stat-item">
              <span className="stat-value">Verified</span>
              <span className="stat-desc">India Post</span>
            </div>
          </div>
        )}

        {/* Search Results */}
        {query && results.length > 0 && (
          <div className="results-list">
            <span className="section-label">Found {results.length} result{results.length !== 1 ? 's' : ''}</span>
            {results.map((r) => (
              <div key={r.pincode} className="result-card" onClick={() => handleCardClick(r)}>
                <div className="card-header-row">
                  <div className="pin-badge-wrapper">
                    <span className="pin-badge">{r.pincode}</span>
                    <button className={`copy-btn ${copiedPin === r.pincode ? 'copied' : ''}`} onClick={(e) => handleCopy(e, r.pincode)}>
                      {copiedPin === r.pincode ? <Check size={12} /> : <Copy size={12} />}
                      <span>{copiedPin === r.pincode ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>

                  <div className="card-actions">
                    <button className="map-preview-btn" onClick={(e) => handleOpenMap(e, r)} title="View location on map">
                      <MapIcon size={12} />
                      <span>Map</span>
                    </button>
                    <button className="directions-btn" onClick={(e) => handleDirections(e, r)} title="Google Maps Directions">
                      <ExternalLink size={12} />
                      <span>Directions</span>
                    </button>
                  </div>
                </div>

                <h3 className="card-area-name">{r.area}</h3>

                {r.subAreas && r.subAreas.length > 0 && (
                  <div className="subareas-tags">
                    {r.subAreas.map((sub, idx) => (
                      <span key={idx} className="sub-tag">{sub}</span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Empty state */}
        {query && results.length === 0 && (
          <div className="empty-state">
            <Search size={36} strokeWidth={1.5} />
            <p className="empty-title">No matching pincode or area</p>
            <p className="empty-sub">Search for a 6-digit pincode like 560092 or locality like Sahakaranagar.</p>
          </div>
        )}

        {!query && history.length === 0 && (
          <div className="guide-box">
            <MapPin size={26} className="guide-icon" />
            <h4 className="guide-title">Bangalore Pincode Lookup</h4>
            <p className="guide-text">Type any pincode (560xxx) or area name to find post office coverage, sub-localities, and Google Maps directions.</p>
          </div>
        )}
      </div>

      {/* Floating Map Action Button */}
      <button className="floating-map-btn" onClick={() => setShowMapModal(true)}>
        <MapIcon size={18} />
        <span>View Map</span>
      </button>

      {/* Map Modal */}
      {showMapModal && (
        <div className="map-modal-overlay">
          <div className="map-modal-content">
            <div className="map-modal-header">
              <span className="map-modal-title">
                {selectedLocation ? `${selectedLocation.pincode} - ${selectedLocation.area}` : 'Bangalore Pincode Map'}
              </span>
              <button className="map-modal-close" onClick={() => setShowMapModal(false)}>
                <X size={18} />
              </button>
            </div>
            <div className="map-modal-body">
              <MapView
                pincodes={pincodes}
                selectedLocation={selectedLocation}
                onSelectLocation={onSelectLocation}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
