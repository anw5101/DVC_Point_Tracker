import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Calendar, BedDouble } from 'lucide-react';
import { getResortById, getPointChart, getAvailableYears, locationNames, formatDues } from '../data/dataLoader';
import { getSeasonColor, formatDateRange, getUniqueRoomNames } from '../utils/pointCalculator';

export default function ResortDetail() {
  const { resortId } = useParams();
  const navigate = useNavigate();
  const resort = getResortById(resortId);
  const availableYears = resort ? getAvailableYears(resortId) : [];

  const [selectedYear, setSelectedYear] = useState(availableYears[0] || 2025);
  const [selectedRoomFilter, setSelectedRoomFilter] = useState('all');

  if (!resort) {
    return (
      <div className="empty-state animate-in">
        <div className="empty-state-icon">
          <BedDouble size={28} />
        </div>
        <div className="empty-state-title">Resort Not Found</div>
        <div className="empty-state-text">This resort could not be found in our database.</div>
        <button onClick={() => navigate('/charts')} className="btn btn-secondary" style={{ marginTop: 'var(--space-4)' }}>
          Back to Charts
        </button>
      </div>
    );
  }

  const chartData = getPointChart(resortId, selectedYear);
  const travelPeriods = chartData?.travelPeriods || [];
  const pointChartEntries = chartData?.pointChart || [];

  // Get room types from resort metadata
  const roomTypes = resort.roomTypes || [];
  const uniqueRoomNames = getUniqueRoomNames(roomTypes);

  // Filter room types by selected name
  const filteredRoomTypes = selectedRoomFilter === 'all'
    ? roomTypes
    : roomTypes.filter(rt => rt.name === selectedRoomFilter);

  // Only show rooms that have chart data
  const roomsWithData = filteredRoomTypes.filter(rt =>
    pointChartEntries.some(entry => entry.roomTypeId === rt.id)
  );

  // Get the dues for this resort
  const dues = resort.dues?.[String(selectedYear)];

  return (
    <div className="animate-in">
      {/* Back Link */}
      <button className="back-link" onClick={() => navigate('/charts')}>
        <ArrowLeft size={14} /> Back to All Resorts
      </button>

      {/* Resort Detail Header */}
      <div className="resort-detail-header animate-in animate-in-delay-1">
        <div className="resort-detail-info">
          <h1 className="resort-detail-title">{resort.name}</h1>
          <p className="resort-detail-subtitle">{resort.theme}</p>
          <div className="resort-detail-badges">
            <span className="badge badge-blue">{locationNames[resort.location]}</span>
            {dues && <span className="badge badge-gold">Dues: {formatDues(dues)}/pt</span>}
            <span className="badge badge-purple">Expires {resort.expirationYear}</span>
          </div>
        </div>

        <div className="resort-detail-controls">
          <div className="year-toggle">
            {availableYears.map(year => (
              <button
                key={year}
                className={selectedYear === year ? 'active' : ''}
                onClick={() => setSelectedYear(year)}
              >
                <Calendar size={12} style={{ marginRight: '4px' }} />
                {year}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Room Type Filter Chips */}
      <div className="room-type-selector animate-in animate-in-delay-2">
        <button
          className={`room-type-chip ${selectedRoomFilter === 'all' ? 'active' : ''}`}
          onClick={() => setSelectedRoomFilter('all')}
        >
          All Room Types
        </button>
        {uniqueRoomNames.map(name => (
          <button
            key={name}
            className={`room-type-chip ${selectedRoomFilter === name ? 'active' : ''}`}
            onClick={() => setSelectedRoomFilter(name)}
          >
            <BedDouble size={12} /> {name}
          </button>
        ))}
      </div>

      {/* Point Chart Table */}
      {chartData ? (
        <div className="animate-in animate-in-delay-3">
          {roomsWithData.map(roomType => {
            const chartEntry = pointChartEntries.find(e => e.roomTypeId === roomType.id);
            if (!chartEntry) return null;

            return (
              <div key={roomType.id} className="point-chart-container" style={{ marginBottom: 'var(--space-6)' }}>
                <table className="point-chart-table">
                  <thead>
                    <tr>
                      <th colSpan={4} style={{
                        textAlign: 'left',
                        fontSize: 'var(--text-base)',
                        textTransform: 'none',
                        letterSpacing: 'normal',
                        color: 'var(--color-text-primary)',
                        padding: 'var(--space-4) var(--space-4)',
                        borderBottom: '1px solid var(--color-border)',
                      }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                          <BedDouble size={16} style={{ color: 'var(--color-accent-gold)' }} />
                          {roomType.name} — {roomType.view}
                          <span className="badge badge-blue" style={{ marginLeft: '8px' }}>
                            Sleeps {roomType.sleeps}
                          </span>
                        </span>
                      </th>
                    </tr>
                    <tr>
                      <th style={{ textAlign: 'left' }}>Season</th>
                      <th style={{ textAlign: 'left' }}>Date Ranges</th>
                      <th>Weekday Pts</th>
                      <th>Weekend Pts</th>
                    </tr>
                  </thead>
                  <tbody>
                    {travelPeriods.map((period, periodIdx) => {
                      const seasonData = chartEntry.seasons[period.id];
                      if (!seasonData) return null;

                      return (
                        <tr key={period.id}>
                          <td style={{ textAlign: 'left' }}>
                            <span className="season-cell">
                              <span
                                className="season-dot"
                                style={{ backgroundColor: getSeasonColor(periodIdx) }}
                              />
                              <span className="season-name">{period.name}</span>
                            </span>
                          </td>
                          <td style={{ textAlign: 'left' }}>
                            <span className="season-dates">
                              {period.dateRanges.map((range, i) => (
                                <span key={i}>
                                  {i > 0 && ', '}
                                  {formatDateRange(range.start, range.end)}
                                </span>
                              ))}
                            </span>
                          </td>
                          <td className="points-value" style={{ fontVariantNumeric: 'tabular-nums', fontWeight: 'var(--font-semibold)', color: 'var(--color-text-primary)' }}>
                            {seasonData.weekday}
                          </td>
                          <td className="points-value" style={{ fontVariantNumeric: 'tabular-nums', fontWeight: 'var(--font-semibold)', color: 'var(--color-text-primary)' }}>
                            {seasonData.weekend}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="empty-state">
          <div className="empty-state-icon">
            <Calendar size={28} />
          </div>
          <div className="empty-state-title">No Chart Data Available</div>
          <div className="empty-state-text">
            Point chart data for {resort.shortName} in {selectedYear} has not been loaded yet.
          </div>
        </div>
      )}
    </div>
  );
}
