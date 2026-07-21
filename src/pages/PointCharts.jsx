import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Castle, MapPin } from 'lucide-react';
import { getAllResorts, getResortsWithCharts, locationNames } from '../data/dataLoader';

const filterTabs = [
  { id: 'all', label: 'All' },
  { id: 'walt-disney-world', label: 'Walt Disney World' },
  { id: 'disneyland', label: 'Disneyland' },
  { id: 'aulani', label: 'Aulani' },
  { id: 'hilton-head', label: 'Hilton Head' },
  { id: 'vero-beach', label: 'Vero Beach' },
];

export default function PointCharts() {
  const [selectedLocation, setSelectedLocation] = useState('all');

  const resorts = getAllResorts();
  const resortsWithCharts = getResortsWithCharts();

  const filteredResorts = selectedLocation === 'all'
    ? resorts
    : resorts.filter(r => r.location === selectedLocation);

  return (
    <div className="animate-in">
      <div className="page-header">
        <h1>Point Charts</h1>
        <p className="subtitle">Browse and compare point values across all DVC resorts</p>
      </div>

      {/* Location Filter Tabs */}
      <div className="tab-nav" style={{ marginBottom: 'var(--space-6)' }}>
        {filterTabs.map(tab => (
          <button
            key={tab.id}
            className={selectedLocation === tab.id ? 'active' : ''}
            onClick={() => setSelectedLocation(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Resort Cards Grid */}
      <div className="resort-cards-grid">
        {filteredResorts.map((resort, index) => {
          const hasChart = resortsWithCharts.includes(resort.id);
          const delayClass = `animate-in-delay-${(index % 4) + 1}`;
          const dues2025 = resort.dues?.['2025'];

          const cardContent = (
            <>
              <div className="resort-card-header">
                <div className="resort-card-icon">
                  <Castle size={18} />
                </div>
              </div>
              <div className="resort-card-body">
                <div className="resort-card-name">{resort.shortName}</div>
                <div className="resort-card-meta">
                  <span className="badge badge-blue">
                    <MapPin size={10} />
                    {locationNames[resort.location] || resort.location}
                  </span>
                  {hasChart ? (
                    <span className="badge badge-teal">Chart Available</span>
                  ) : (
                    <span className="badge badge-gold">Coming Soon</span>
                  )}
                </div>
                <div className="resort-card-stats">
                  <div className="resort-card-stat">
                    <span className="resort-card-stat-label">Dues 2025</span>
                    <span className="resort-card-stat-value">
                      ${dues2025 ? dues2025.toFixed(2) : '—'}
                    </span>
                  </div>
                  <div className="resort-card-stat">
                    <span className="resort-card-stat-label">Expires</span>
                    <span className="resort-card-stat-value">{resort.expirationYear}</span>
                  </div>
                  <div className="resort-card-stat">
                    <span className="resort-card-stat-label">Room Types</span>
                    <span className="resort-card-stat-value">{resort.roomTypes?.length || 0}</span>
                  </div>
                </div>
              </div>
            </>
          );

          if (hasChart) {
            return (
              <Link
                key={resort.id}
                to={`/charts/${resort.id}`}
                className={`resort-card animate-in ${delayClass}`}
                style={{ textDecoration: 'none' }}
              >
                {cardContent}
              </Link>
            );
          }

          return (
            <div
              key={resort.id}
              className={`resort-card animate-in ${delayClass}`}
              style={{ opacity: 0.5, cursor: 'default' }}
            >
              {cardContent}
            </div>
          );
        })}
      </div>
    </div>
  );
}
