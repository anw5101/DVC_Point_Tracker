import { useState, useMemo } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Cell,
  LineChart, Line
} from 'recharts';
import { TrendingUp, DollarSign, BedDouble, Info } from 'lucide-react';
import { getAllResorts, getPointChart } from '../data/dataLoader';

export default function Trends() {
  const [activeTab, setActiveTab] = useState('value-index');
  const resorts = getAllResorts();

  // Aggregate: DVC Value Index
  // Calculates the cheapest 1-week stay (5 weekdays, 2 weekend days) in a Studio for each resort
  const valueIndexData = useMemo(() => {
    const data = [];
    resorts.forEach(resort => {
      const chart = getPointChart(resort.id, 2025);
      if (!chart || !chart.pointChart) return;
      
      // Find the first room type that is a studio
      const studioRoom = chart.pointChart.find(r => r.roomTypeId.includes('studio'));
      if (!studioRoom) return;
      
      let cheapestWeek = Infinity;
      
      Object.values(studioRoom.seasons).forEach(season => {
        const weekPoints = (season.weekday * 5) + (season.weekend * 2);
        if (weekPoints < cheapestWeek) {
          cheapestWeek = weekPoints;
        }
      });
      
      data.push({
        name: resort.shortName || resort.name,
        fullName: resort.name,
        location: resort.location,
        points: cheapestWeek
      });
    });
    
    // Sort from cheapest to most expensive
    return data.sort((a, b) => a.points - b.points);
  }, [resorts]);

  // Aggregate: Annual Dues
  const duesData = useMemo(() => {
    return resorts.map(resort => ({
      name: resort.shortName || resort.name,
      fullName: resort.name,
      dues2025: resort.dues ? resort.dues['2025'] : 0,
      dues2026: resort.dues ? resort.dues['2026'] : 0,
    })).filter(r => r.dues2025 > 0)
      .sort((a, b) => a.dues2025 - b.dues2025);
  }, [resorts]);

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div style={{ backgroundColor: 'var(--color-surface)', padding: 'var(--space-3)', border: '1px solid var(--color-border)', borderRadius: '0.5rem', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
          <p style={{ fontWeight: '600', marginBottom: 'var(--space-1)' }}>{payload[0].payload.fullName}</p>
          {payload.map((entry, index) => (
            <p key={index} style={{ color: entry.color, fontWeight: '500' }}>
              {entry.name === 'points' ? `${entry.value} Points` : `$${entry.value?.toFixed(2)}`}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="animate-in">
      <div className="page-header" style={{ marginBottom: 'var(--space-6)' }}>
        <h1>Trends & Analytics</h1>
        <p className="subtitle">Discover the best value and compare historical pricing</p>
      </div>

      <div style={{ display: 'flex', gap: 'var(--space-3)', marginBottom: 'var(--space-6)', overflowX: 'auto', paddingBottom: 'var(--space-2)' }}>
        <button 
          className={`btn ${activeTab === 'value-index' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setActiveTab('value-index')}
          style={{ whiteSpace: 'nowrap' }}
        >
          <BedDouble size={16} /> DVC Value Index
        </button>
        <button 
          className={`btn ${activeTab === 'dues' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setActiveTab('dues')}
          style={{ whiteSpace: 'nowrap' }}
        >
          <DollarSign size={16} /> Annual Dues Comparison
        </button>
      </div>

      {activeTab === 'value-index' && (
        <div className="card" style={{ padding: 'var(--space-5)' }}>
          <div style={{ marginBottom: 'var(--space-5)' }}>
            <h2 style={{ fontSize: 'var(--font-xl)', marginBottom: 'var(--space-2)' }}>The DVC Value Index</h2>
            <p style={{ color: 'var(--color-text-light)', maxWidth: '800px' }}>
              Comparing the absolute cheapest 1-week stay (5 weekdays, 2 weekends) in a Standard Studio across all resorts based on 2025 point charts.
            </p>
          </div>
          
          <div style={{ height: '400px', width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={valueIndexData} margin={{ top: 20, right: 30, left: 0, bottom: 40 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border)" />
                <XAxis 
                  dataKey="name" 
                  angle={-45} 
                  textAnchor="end"
                  height={60}
                  tick={{ fill: 'var(--color-text-light)', fontSize: 12 }}
                  stroke="var(--color-border)"
                />
                <YAxis 
                  tick={{ fill: 'var(--color-text-light)', fontSize: 12 }}
                  stroke="var(--color-border)"
                />
                <RechartsTooltip content={<CustomTooltip />} />
                <Bar dataKey="points" name="points" radius={[4, 4, 0, 0]}>
                  {valueIndexData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.location === 'walt-disney-world' ? 'var(--color-primary)' : 'var(--color-accent)'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div style={{ display: 'flex', gap: 'var(--space-4)', marginTop: 'var(--space-4)', fontSize: 'var(--font-sm)', color: 'var(--color-text-light)', justifyContent: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
              <div style={{ width: '12px', height: '12px', backgroundColor: 'var(--color-primary)', borderRadius: '2px' }}></div>
              Walt Disney World
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
              <div style={{ width: '12px', height: '12px', backgroundColor: 'var(--color-accent)', borderRadius: '2px' }}></div>
              Other Locations
            </div>
          </div>
        </div>
      )}

      {activeTab === 'dues' && (
        <div className="card" style={{ padding: 'var(--space-5)' }}>
          <div style={{ marginBottom: 'var(--space-5)' }}>
            <h2 style={{ fontSize: 'var(--font-xl)', marginBottom: 'var(--space-2)' }}>Annual Dues Inflation</h2>
            <p style={{ color: 'var(--color-text-light)', maxWidth: '800px' }}>
              Compare the cost of ownership (Annual Dues per point) across all DVC resorts for 2025 and 2026.
            </p>
          </div>
          
          <div style={{ height: '400px', width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={duesData} margin={{ top: 20, right: 30, left: 0, bottom: 40 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border)" />
                <XAxis 
                  dataKey="name" 
                  angle={-45} 
                  textAnchor="end"
                  height={60}
                  tick={{ fill: 'var(--color-text-light)', fontSize: 12 }}
                  stroke="var(--color-border)"
                />
                <YAxis 
                  tickFormatter={(val) => `$${val}`}
                  tick={{ fill: 'var(--color-text-light)', fontSize: 12 }}
                  stroke="var(--color-border)"
                />
                <RechartsTooltip content={<CustomTooltip />} />
                <Bar dataKey="dues2025" name="2025 Dues" fill="var(--color-primary-light)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="dues2026" name="2026 Dues" fill="var(--color-primary)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
      
      <div className="card" style={{ padding: 'var(--space-4)', marginTop: 'var(--space-6)', display: 'flex', gap: 'var(--space-3)', alignItems: 'flex-start', backgroundColor: 'rgba(255,255,255,0.02)' }}>
        <Info style={{ color: 'var(--color-accent)', flexShrink: 0, marginTop: '2px' }} size={20} />
        <div>
          <h4 style={{ fontWeight: '600', marginBottom: 'var(--space-1)' }}>Why isn't there a 10-year point inflation chart?</h4>
          <p style={{ color: 'var(--color-text-light)', fontSize: 'var(--font-sm)', lineHeight: '1.5' }}>
            DVC point requirements are legally constrained by timeshare regulations. The total number of points required to book a resort across an entire calendar year cannot increase. Instead of "inflating" points, Disney "reallocates" them—making highly popular weeks (like early December) more expensive, while making slower weeks cheaper to balance the scale.
          </p>
        </div>
      </div>
    </div>
  );
}
