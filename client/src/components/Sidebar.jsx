import { useState, useRef } from 'react';
import { Search, X, Sun, Moon, Monitor, Clock, MapPin, Copy, Check, ExternalLink } from 'lucide-react';

export default function Sidebar({ theme, setTheme, query, onSearch, results, onSelectLocation, totalPincodes, history, clearHistory, addToHistory }) {
  const inputRef = useRef(null);
  const [copiedPin, setCopiedPin] = useState(null);

  const handleHistoryClick = (h) => {
    onSearch(h);
  };

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
    const url = `https://www.google.com/maps/dir/?api=1&destination=${r.lat},${r.lng}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <aside className="sidebar">
      {/* Header */}
      <header className="sidebar-header">
        <div className="brand">
          <div className="brand-icon-wrapper">
            <MapPin size={18} />
          </div>
          <div>
            <h1 className="brand-title">Pin<span className="brand-title-italic">2Area</span></h1>
            <p className="brand-subtitle">Bangalore Pincode Directory</p>
          </div>
        </div>
        <div className="theme-switcher">
          <button className={`theme-btn ${theme === 'light' ? 'active' : ''}`} onClick={() => setTheme('light')} title="Light Mode">
            <Sun size={14} />
          </button>
          <button className={`theme-btn ${theme === 'auto' ? 'active' : ''}`} onClick={() => setTheme('auto')} title="System Theme">
            <Monitor size={14} />
          </button>
          <button className={`theme-btn ${theme === 'dark' ? 'active' : ''}`} onClick={() => setTheme('dark')} title="Dark Mode">
            <Moon size={14} />
          </button>
        </div>
      </header>

      {/* Search */}
      <div className="search-container">
        <div className="search-box">
          <Search size={18} className="search-icon" />
          <input
            ref={inputRef}
            type="text"
            className="search-input"
            placeholder="Search by pincode (e.g. 560092) or area name..."
            value={query}
            onChange={(e) => onSearch(e.target.value)}
          />
          {query && (
            <button type="button" className="search-clear" onClick={handleClear} title="Clear search">
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      <div className="sidebar-body">
        {/* Recent Searches */}
        {!query && history.length > 0 && (
          <div className="history-section">
            <div className="history-head">
              <span className="section-label">Recent Searches</span>
              <button className="text-btn" onClick={clearHistory}>Clear all</button>
            </div>
            <div className="history-chips">
              {history.map((h, i) => (
                <button key={i} className="chip" onClick={() => handleHistoryClick(h)}>
                  <Clock size={12} />
                  <span>{h}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Stats bar */}
        {!query && (
          <div className="stats-card">
            <div className="stat-item">
              <span className="stat-value">{totalPincodes}</span>
              <span className="stat-desc">Bangalore Areas</span>
            </div>
            <div className="stat-divider" />
            <div className="stat-item">
              <span className="stat-value">560xxx</span>
              <span className="stat-desc">Pincode Range</span>
            </div>
            <div className="stat-divider" />
            <div className="stat-item">
              <span className="stat-value">100%</span>
              <span className="stat-desc">Official Data</span>
            </div>
          </div>
        )}

        {/* Results list */}
        {query && results.length > 0 && (
          <div className="results-list">
            <div className="results-meta">
              <span className="section-label">Found {results.length} result{results.length !== 1 ? 's' : ''}</span>
            </div>
            {results.map((r) => (
              <div key={r.pincode} className="result-card" onClick={() => onSelectLocation(r)}>
                <div className="card-header-row">
                  <div className="pin-badge-wrapper">
                    <span className="pin-badge">{r.pincode}</span>
                    <button 
                      className={`copy-btn ${copiedPin === r.pincode ? 'copied' : ''}`}
                      onClick={(e) => handleCopy(e, r.pincode)}
                      title="Copy pincode"
                    >
                      {copiedPin === r.pincode ? <Check size={12} /> : <Copy size={12} />}
                      <span>{copiedPin === r.pincode ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>

                  <button 
                    className="directions-btn"
                    onClick={(e) => handleDirections(e, r)}
                    title="Get Directions on Google Maps"
                  >
                    <ExternalLink size={12} />
                    <span>Directions</span>
                  </button>
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
            <p className="empty-title">No pincode or area matching "{query}"</p>
            <p className="empty-sub">Try searching with a 6-digit pincode (e.g. 560092) or major locality name (e.g. Sahakaranagar, Koramangala).</p>
          </div>
        )}

        {/* Initial guidance */}
        {!query && history.length === 0 && (
          <div className="guide-box">
            <MapPin size={28} className="guide-icon" />
            <h4 className="guide-title">Bangalore Pincode Directory</h4>
            <p className="guide-text">Search any 6-digit pincode or locality name to view sub-localities, post offices, map coordinates, and Google Maps directions.</p>
          </div>
        )}
      </div>
    </aside>
  );
}
