import { useState, useEffect, useCallback, useRef } from 'react';
import { Search, X, Sun, Moon, MapPin, Copy, Check, ExternalLink, Bookmark, Navigation, Clock, ChevronDown, SearchX, Home, WifiOff, Compass, RefreshCw, Sparkles } from 'lucide-react';
import MapView from './components/MapView';
import pincodes, { searchPincodes } from './data/pincodes';
import './index.css';

function App() {
  const [theme, setTheme] = useState(() => localStorage.getItem('pin2area-theme') || 'dark');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedLocation, setSelectedLocation] = useState(pincodes[0]); // Default 560001
  const [query, setQuery] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [showSubAreas, setShowSubAreas] = useState(false);

  const [currentPath, setCurrentPath] = useState(() => window.location.pathname);
  const [isOffline, setIsOffline] = useState(() => !navigator.onLine);

  const [history, setHistory] = useState(() => {
    const saved = localStorage.getItem('pin2area-history');
    return saved ? JSON.parse(saved) : [];
  });
  const [savedAreas, setSavedAreas] = useState(() => {
    const saved = localStorage.getItem('pin2area-saved');
    return saved ? JSON.parse(saved) : [];
  });

  const [copiedPin, setCopiedPin] = useState(null);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [showSavedDropdown, setShowSavedDropdown] = useState(false);
  const searchContainerRef = useRef(null);
  const savedContainerRef = useRef(null);
  const inputRef = useRef(null);
  const itemRefs = useRef([]);

  // Theme management
  useEffect(() => {
    localStorage.setItem('pin2area-theme', theme);
    const root = document.documentElement;
    root.setAttribute('data-theme', theme);
  }, [theme]);

  // Network status listeners (Online / Offline)
  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // URL Path popstate listener
  useEffect(() => {
    const handlePopState = () => {
      setCurrentPath(window.location.pathname);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigateTo = (path) => {
    window.history.pushState({}, '', path);
    setCurrentPath(path);
  };

  // Click outside search & saved container to close autocomplete dropdowns
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
      if (savedContainerRef.current && !savedContainerRef.current.contains(e.target)) {
        setShowSavedDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Auto-scroll highlighted suggestion into view when using arrow keys
  useEffect(() => {
    if (showDropdown && selectedIndex >= 0 && itemRefs.current[selectedIndex]) {
      itemRefs.current[selectedIndex]?.scrollIntoView({
        block: 'nearest',
        behavior: 'smooth',
      });
    }
  }, [selectedIndex, showDropdown]);

  const addToHistory = useCallback((term) => {
    if (!term || term.trim().length < 2) return;
    const clean = term.trim();
    const newHistory = [clean, ...history.filter(h => h !== clean)].slice(0, 6);
    setHistory(newHistory);
    localStorage.setItem('pin2area-history', JSON.stringify(newHistory));
  }, [history]);

  const handleSearchChange = useCallback((q) => {
    setQuery(q);
    setSelectedIndex(0);
    const trimmed = q.trim();
    if (!trimmed) {
      setSearchResults([]);
      setShowDropdown(false);
      setSelectedLocation(pincodes[0]);
      return;
    }

    const results = searchPincodes(trimmed);
    setSearchResults(results);

    // Single result match or exact 6-digit pincode match -> Direct search!
    const exactMatch = results.find(r => r.pincode === trimmed || r.area.toLowerCase() === trimmed.toLowerCase());

    if (results.length === 1 || exactMatch) {
      const match = exactMatch || results[0];
      setSelectedLocation(match);
      setShowDropdown(false);
      addToHistory(match.area);
    } else if (results.length > 1) {
      setSelectedLocation(results[0]);
      setShowDropdown(true);
    } else {
      setSelectedLocation(null);
      setShowDropdown(true);
    }
  }, [addToHistory]);

  const handleKeyDown = (e) => {
    if (!showDropdown && (e.key === 'ArrowDown' || e.key === 'ArrowUp')) {
      if (searchResults.length > 1) {
        setShowDropdown(true);
      }
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev < searchResults.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : searchResults.length - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (searchResults.length > 0) {
        const targetIndex = selectedIndex >= 0 && selectedIndex < searchResults.length ? selectedIndex : 0;
        const match = searchResults[targetIndex];
        setSelectedLocation(match);
        addToHistory(match.area);
        setShowDropdown(false);
      }
    } else if (e.key === 'Escape') {
      setShowDropdown(false);
    }
  };

  const clearHistory = useCallback(() => {
    setHistory([]);
    localStorage.removeItem('pin2area-history');
  }, []);

  const handleSelectLocation = useCallback((loc) => {
    setSelectedLocation(loc);
    addToHistory(loc.area);
    setShowDropdown(false);
  }, [addToHistory]);

  const handleCopy = (pin) => {
    navigator.clipboard.writeText(pin);
    setCopiedPin(pin);
    setTimeout(() => setCopiedPin(null), 1800);
  };

  const toggleSaveArea = (loc) => {
    const isSaved = savedAreas.some(s => s.pincode === loc.pincode);
    let updated;
    if (isSaved) {
      updated = savedAreas.filter(s => s.pincode !== loc.pincode);
    } else {
      updated = [...savedAreas, loc];
    }
    setSavedAreas(updated);
    localStorage.setItem('pin2area-saved', JSON.stringify(updated));
  };

  const handleDirections = (loc) => {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${loc.lat},${loc.lng}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const isCurrentSaved = selectedLocation && savedAreas.some(s => s.pincode === selectedLocation.pincode);

  // 1. CONNECTION LOST (Offline Mode Page)
  if (isOffline) {
    return (
      <div className="full-page-overlay">
        <div className="offline-card">
          <span className="fun-404-badge">Network Offline</span>
          <div className="icon-glow-container offline">
            <WifiOff size={44} className="pulse-wifi" />
          </div>
          <h2 className="page-title">Connection Lost!</h2>
          <p className="page-subtitle">
            You're off the grid! Looks like your internet took a tea break. Check your Wi-Fi or mobile data to reconnect.
          </p>

          <div className="fun-info-box">
            <div className="fun-info-item">
              <span>Network Status:</span>
              <span>Disconnected</span>
            </div>
            <div className="fun-info-item">
              <span>Local Directory:</span>
              <span>112 Locations Cached</span>
            </div>
          </div>

          <div className="action-row-404">
            <button className="btn filled" onClick={() => setIsOffline(!navigator.onLine)}>
              <RefreshCw size={16} />
              <span>Retry Connection</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 2. FUN 404 PAGE NOT FOUND (Broken Links / Invalid URLs)
  if (currentPath !== '/' && currentPath !== '') {
    return (
      <div className="full-page-overlay">
        <div className="fun-404-card">
          <span className="fun-404-badge">404 • You Lost!</span>
          <div className="icon-glow-container">
            <Compass size={44} className="spinning-compass" />
          </div>
          <h2 className="page-title">Oops! Page Not Found</h2>
          <p className="page-subtitle">
            You've wandered off the Bangalore map into uncharted territory! This pincode or URL was lost in transit.
          </p>

          <div className="fun-info-box">
            <div className="fun-info-item">
              <span>Current Path:</span>
              <span>{currentPath}</span>
            </div>
            <div className="fun-info-item">
              <span>GPS Signal:</span>
              <span>Out of Range</span>
            </div>
          </div>

          <div className="action-row-404">
            <button className="btn filled" onClick={() => navigateTo('/')}>
              <Home size={16} />
              <span>Return to Home Page</span>
            </button>
            <button className="btn outline" onClick={() => {
              const random = pincodes[Math.floor(Math.random() * pincodes.length)];
              setSelectedLocation(random);
              navigateTo('/');
            }}>
              <Sparkles size={16} />
              <span>Teleport to Random Pincode</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="wrap">
      {/* ---------- TOP APP BAR ---------- */}
      <header className="appbar">
        <div className="brand">
          <div className="brand-text">
            <h1>Pin2Area</h1>
            <div className="tag">Bangalore Pincode Directory</div>
          </div>
        </div>

        <div className="appbar-actions">
          {/* Saved Locations Dropdown Button */}
          <div className="saved-dropdown-wrapper" ref={savedContainerRef}>
            <button
              className={`icon-btn saved-toggle-btn ${showSavedDropdown ? 'active' : ''}`}
              onClick={() => setShowSavedDropdown((prev) => !prev)}
              aria-label="View saved locations"
              title="Saved Locations"
            >
              <Bookmark size={18} fill={savedAreas.length > 0 ? 'currentColor' : 'none'} />
              {savedAreas.length > 0 && (
                <span className="saved-badge-count">{savedAreas.length}</span>
              )}
            </button>

            {/* Saved Locations Overlay Dropdown Menu */}
            {showSavedDropdown && (
              <div className="saved-dropdown-menu">
                <div className="dropdown-header">
                  <span>Saved Locations ({savedAreas.length})</span>
                </div>
                <div className="dropdown-scroll-list">
                  {savedAreas.length === 0 ? (
                    <div className="saved-empty-dropdown">
                      <Bookmark size={24} className="empty-icon" />
                      <p>No saved locations yet</p>
                      <span>Click Save on any result card to bookmark it here.</span>
                    </div>
                  ) : (
                    savedAreas.map((s) => (
                      <div
                        key={s.pincode}
                        className={`google-suggestion-item ${selectedLocation?.pincode === s.pincode ? 'selected' : ''}`}
                        onClick={() => {
                          handleSelectLocation(s);
                          setShowSavedDropdown(false);
                        }}
                      >
                        <Bookmark size={16} className="sugg-icon saved" fill="currentColor" />
                        <span className="sugg-pin-badge">{s.pincode}</span>
                        <span className="sugg-area-text">{s.area}</span>
                        {s.subAreas && s.subAreas.length > 0 && (
                          <span className="sugg-sub-preview">• {s.subAreas[0]}</span>
                        )}
                        <button
                          type="button"
                          className="saved-item-remove"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleSaveArea(s);
                          }}
                          title="Remove bookmark"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Theme Toggle Button */}
          <button
            className="icon-btn"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            aria-label="Toggle theme"
            title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
          >
            {theme === 'dark' ? <Sun className="sun-icon" size={20} /> : <Moon className="moon-icon" size={20} />}
          </button>
        </div>
      </header>

      {/* ---------- GRID LAYOUT ---------- */}
      <div className="grid">
        {/* LEFT COLUMN: Search, Autocomplete Overlay, Result Card, Saved */}
        <div className="left-column">
          {/* Google Search Style Search Box with Overlay Dropdown */}
          <div className="search-bar-wrapper" ref={searchContainerRef}>
            <div className={`search-bar ${showDropdown ? 'has-dropdown' : ''}`}>
              <Search size={20} className="search-icon" />
              <input
                ref={inputRef}
                type="text"
                placeholder="Search pincode or area name..."
                value={query}
                onChange={(e) => handleSearchChange(e.target.value)}
                onKeyDown={handleKeyDown}
                onFocus={() => {
                  if (query.trim() && searchResults.length > 1) setShowDropdown(true);
                }}
                autoComplete="off"
              />
              {query && (
                <button type="button" className="search-clear-btn" onClick={() => handleSearchChange('')}>
                  <X size={16} />
                </button>
              )}
            </div>

            {/* Google Search Style Autocomplete Overlay Dropdown */}
            {showDropdown && (
              <div className="google-search-dropdown">
                {searchResults.length > 0 ? (
                  <div className="dropdown-scroll-list">
                    {searchResults.map((r, idx) => (
                      <div
                        key={r.pincode}
                        ref={(el) => (itemRefs.current[idx] = el)}
                        className={`google-suggestion-item ${selectedIndex === idx ? 'selected' : ''}`}
                        onClick={() => handleSelectLocation(r)}
                        onMouseEnter={() => setSelectedIndex(idx)}
                      >
                        <Search size={16} className="sugg-icon" />
                        <span className="sugg-pin-badge">{r.pincode}</span>
                        <span className="sugg-area-text">{r.area}</span>
                        {r.subAreas && r.subAreas.length > 0 && (
                          <span className="sugg-sub-preview">• {r.subAreas[0]}</span>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="dropdown-no-results">
                    <SearchX size={18} />
                    <span>No pincode or area found for "{query}"</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Recent Searches */}
          {!query && history.length > 0 && (
            <div className="chip-section">
              <div className="chip-section-head">
                <span>Recent searches</span>
                <button onClick={clearHistory}>Clear</button>
              </div>
              <div className="chip-row">
                {history.map((h, i) => (
                  <div key={i} className="chip" onClick={() => {
                    handleSearchChange(h);
                  }}>
                    <Clock size={14} />
                    <span>{h}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* RESULT CARD */}
          {selectedLocation ? (
            <div className="result-card">
              <div className="result-top">
                <div className="badge">
                  <div className="pin">{selectedLocation.pincode}</div>
                  <div className="sub">Bengaluru</div>
                </div>
                <div className="actions">
                  <button
                    className={`btn outline ${copiedPin === selectedLocation.pincode ? 'copied' : ''}`}
                    onClick={() => handleCopy(selectedLocation.pincode)}
                  >
                    {copiedPin === selectedLocation.pincode ? <Check size={16} /> : <Copy size={16} />}
                    <span>{copiedPin === selectedLocation.pincode ? 'Copied' : 'Copy'}</span>
                  </button>
                  <button
                    className={`btn ${isCurrentSaved ? 'success' : 'tonal'}`}
                    onClick={() => toggleSaveArea(selectedLocation)}
                  >
                    <Bookmark size={16} fill={isCurrentSaved ? 'currentColor' : 'none'} />
                    <span>{isCurrentSaved ? 'Saved' : 'Save'}</span>
                  </button>
                  <button
                    className="btn filled"
                    onClick={() => handleDirections(selectedLocation)}
                  >
                    <Navigation size={16} />
                    <span>Directions</span>
                  </button>
                </div>
              </div>

              <h2 className="area-name">{selectedLocation.area}</h2>

              {selectedLocation.subAreas && selectedLocation.subAreas.length > 0 && (
                <div className="subareas-accordion">
                  <button
                    type="button"
                    className={`subareas-trigger ${showSubAreas ? 'open' : ''}`}
                    onClick={() => setShowSubAreas((prev) => !prev)}
                  >
                    <div className="trigger-left">
                      <span className="section-label">Sub-localities &amp; post offices</span>
                      <span className="subareas-count">{selectedLocation.subAreas.length}</span>
                    </div>
                    <div className="trigger-right">
                      <span className="trigger-text">{showSubAreas ? 'Hide' : 'Show all'}</span>
                      <ChevronDown className={`chevron ${showSubAreas ? 'rotated' : ''}`} size={16} />
                    </div>
                  </button>

                  {showSubAreas && (
                    <div className="pill-row animated-reveal">
                      {selectedLocation.subAreas.map((sub, idx) => (
                        <span key={idx} className="pill">{sub}</span>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <div className="meta-grid">
                <div>
                  <span className="m-label">Coordinates</span>
                  <span className="m-value">{selectedLocation.lat.toFixed(4)}° N, {selectedLocation.lng.toFixed(4)}° E</span>
                </div>
                <div>
                  <span className="m-label">District</span>
                  <span className="m-value">Bengaluru Urban</span>
                </div>
                <div>
                  <span className="m-label">State</span>
                  <span className="m-value">Karnataka</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="result-card not-found-card">
              <div className="not-found-icon-wrapper">
                <SearchX size={44} className="not-found-icon" />
              </div>
              <h3 className="not-found-title">Result Not Found</h3>
              <p className="not-found-query">No location matches "<strong>{query}</strong>"</p>
              <p className="not-found-sub">
                We couldn't find any pincode or area matching your search in our Bangalore directory. Try searching for a 6-digit pincode like 560092 or major locality like Koramangala or Sahakaranagar.
              </p>
              <button className="btn filled clear-search-btn" onClick={() => handleSearchChange('')}>
                <X size={16} />
                <span>Clear Search</span>
              </button>
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: SQUIRCLE MAP (With Dark Mode support!) */}
        <div className="map-panel">
          <div className="map-frame-wrapper">
            <MapView
              pincodes={pincodes}
              selectedLocation={selectedLocation}
              onSelectLocation={handleSelectLocation}
              theme={theme}
            />
          </div>
        </div>
      </div>

      {/* ---------- FOOTER ---------- */}
      <footer className="app-footer">
        <div className="footer-line">
          <span>Pin2area</span>
          <span className="footer-sep">·</span>
          <span>Built by Rudra Patel</span>
          <span className="footer-sep">·</span>
          <span>Data: India Post (updated Aug 2026)</span>
        </div>
        <div className="footer-line">
          <span>{pincodes.length} locations indexed</span>
          <span className="footer-sep">·</span>
          <a
            href="mailto:patelrudrahn676@gmail.com?subject=Pin2area%20Issue%20Report"
            className="footer-link"
          >
            Report an issue
          </a>
          <span className="footer-sep">·</span>
          <span>Not affiliated with India Post</span>
        </div>
      </footer>
    </div>
  );
}

export default App;
