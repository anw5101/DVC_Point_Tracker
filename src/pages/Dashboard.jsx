import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Castle, TableProperties, CalendarDays, DollarSign, Calculator, Wallet, TrendingUp, ArrowRight, Clock, AlertTriangle, Plane
} from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { getAllResorts, getResortsWithCharts, getResortById } from '../data/dataLoader';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { getBankingDeadline } from '../utils/dvcMath';
import { getCurrentUseYear, calculateYearBalance } from '../utils/fefoEngine';

const COLORS = ['var(--color-primary)', 'var(--color-red)', 'var(--color-accent)']; // Available, Expiring, Used

export default function Dashboard() {
  const { currentUser } = useAuth();
  
  // Base state
  const resorts = getAllResorts();
  const chartsCount = getResortsWithCharts().length;
  const avgDues = (resorts.reduce((sum, r) => sum + (r.dues?.['2025'] || 0), 0) / resorts.length).toFixed(2);

  // Auth state
  const [contracts, setContracts] = useState([]);
  const [trips, setTrips] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      if (!currentUser) {
        setLoading(false);
        return;
      }
      const [contractsSnap, tripsSnap, txSnap] = await Promise.all([
        getDocs(query(collection(db, 'contracts'), where('userId', '==', currentUser.uid))),
        getDocs(query(collection(db, 'trips'), where('userId', '==', currentUser.uid))),
        getDocs(query(collection(db, 'transactions'), where('userId', '==', currentUser.uid)))
      ]);
      setContracts(contractsSnap.docs.map(d => ({ id: d.id, ...d.data() })));
      setTrips(tripsSnap.docs.map(d => ({ id: d.id, ...d.data() })));
      setTransactions(txSnap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    }
    fetchData();
  }, [currentUser]);

  // Aggregate Data for Logged In View
  const dashboardData = useMemo(() => {
    if (contracts.length === 0) return null;
    
    let totalBase = 0;
    let totalAvailable = 0;
    let totalUsed = 0;
    let totalExpiring = 0;
    let bankingDeadlines = [];

    const today = new Date();

    contracts.forEach(contract => {
      const currentYear = getCurrentUseYear(contract.useYear);
      const balance = calculateYearBalance(contract, currentYear, trips, transactions);
      
      totalBase += balance.basePoints;
      totalAvailable += balance.totalAvailable;
      totalUsed += balance.used;
      totalExpiring += balance.expiringAvailable;

      // Calculate Deadline
      const deadlineStr = getBankingDeadline(contract.useYear);
      const deadlineDate = new Date(`${deadlineStr}, ${currentYear}`);
      if (deadlineDate < today) deadlineDate.setFullYear(currentYear + 1); // Next year's deadline if passed
      
      const diffTime = deadlineDate - today;
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      bankingDeadlines.push({
        contractId: contract.id,
        resortName: getResortById(contract.resortId)?.name || 'Resort',
        useYear: contract.useYear,
        dateStr: deadlineStr,
        daysRemaining: diffDays,
        urgent: diffDays <= 30 && balance.currentAvailable > 0
      });
    });

    bankingDeadlines.sort((a, b) => a.daysRemaining - b.daysRemaining);

    // Upcoming Trips
    const upcomingTrips = trips
      .map(trip => {
        const checkInDate = new Date(trip.checkInDate);
        const diffTime = checkInDate - today;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return {
          ...trip,
          resortName: getResortById(trip.resortId)?.name || 'Resort',
          daysUntil: diffDays
        };
      })
      .filter(trip => trip.daysUntil >= 0)
      .sort((a, b) => a.daysUntil - b.daysUntil);

    const chartData = [
      { name: 'Available', value: totalAvailable },
      { name: 'Expiring Soon', value: totalExpiring },
      { name: 'Used', value: totalUsed },
    ].filter(d => d.value > 0);

    return { totalBase, totalAvailable, totalUsed, totalExpiring, bankingDeadlines, upcomingTrips, chartData };
  }, [contracts, trips, transactions]);


  if (loading) {
    return <div className="animate-in">Loading dashboard...</div>;
  }

  return (
    <div className="animate-in">
      {currentUser && dashboardData ? (
        // ==========================================
        // LOGGED IN DASHBOARD
        // ==========================================
        <div>
          <div className="page-header">
            <h1>Command Center ✨</h1>
            <p className="subtitle">Your real-time DVC portfolio and upcoming vacations.</p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 'var(--space-6)', marginBottom: 'var(--space-8)' }}>
            
            {/* Point Utilization Widget */}
            <div className="card" style={{ padding: 'var(--space-5)' }}>
              <h3 style={{ fontSize: 'var(--font-lg)', marginBottom: 'var(--space-4)', display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                <Wallet size={20} className="gold" /> Point Utilization
              </h3>
              <div style={{ height: 200 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={dashboardData.chartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {dashboardData.chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ backgroundColor: 'var(--color-bg)', border: '1px solid var(--color-border)', borderRadius: '0.5rem' }}
                      itemStyle={{ color: 'var(--color-text-primary)' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-around', fontSize: 'var(--font-sm)', color: 'var(--color-text-light)', marginTop: 'var(--space-2)' }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontWeight: '600', color: 'var(--color-text-primary)' }}>{dashboardData.totalBase}</div>
                  Base Points
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontWeight: '600', color: 'var(--color-primary)' }}>{dashboardData.totalAvailable}</div>
                  Available
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontWeight: '600', color: 'var(--color-accent)' }}>{dashboardData.totalUsed}</div>
                  Used
                </div>
              </div>
            </div>

            {/* Upcoming Trips Widget */}
            <div className="card" style={{ padding: 'var(--space-5)' }}>
              <h3 style={{ fontSize: 'var(--font-lg)', marginBottom: 'var(--space-4)', display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                <Plane size={20} className="blue" /> Upcoming Trips
              </h3>
              {dashboardData.upcomingTrips.length === 0 ? (
                <div style={{ color: 'var(--color-text-light)', fontStyle: 'italic', display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center' }}>
                  No upcoming trips booked.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                  {dashboardData.upcomingTrips.slice(0, 3).map(trip => (
                    <div key={trip.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 'var(--space-3)', backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: '0.5rem' }}>
                      <div>
                        <div style={{ fontWeight: '600' }}>{trip.resortName}</div>
                        <div style={{ fontSize: 'var(--font-xs)', color: 'var(--color-text-light)' }}>{trip.checkInDate}</div>
                      </div>
                      <div className="badge badge-blue">
                        In {trip.daysUntil} days
                      </div>
                    </div>
                  ))}
                  {dashboardData.upcomingTrips.length > 3 && (
                    <Link to="/contracts" style={{ fontSize: 'var(--font-sm)', color: 'var(--color-primary)', textAlign: 'center', marginTop: 'var(--space-2)', display: 'block' }}>View all trips →</Link>
                  )}
                </div>
              )}
            </div>

            {/* Banking Deadlines Widget */}
            <div className="card" style={{ padding: 'var(--space-5)' }}>
              <h3 style={{ fontSize: 'var(--font-lg)', marginBottom: 'var(--space-4)', display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                <Clock size={20} className="teal" /> Banking Deadlines
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                {dashboardData.bankingDeadlines.map((deadline, idx) => (
                  <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 'var(--space-3)', backgroundColor: deadline.urgent ? 'rgba(239, 68, 68, 0.1)' : 'rgba(255,255,255,0.02)', borderRadius: '0.5rem', border: deadline.urgent ? '1px solid var(--color-red)' : '1px solid transparent' }}>
                    <div>
                      <div style={{ fontWeight: '600', display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                        {deadline.resortName}
                        {deadline.urgent && <AlertTriangle size={14} color="var(--color-red)" />}
                      </div>
                      <div style={{ fontSize: 'var(--font-xs)', color: 'var(--color-text-light)' }}>{deadline.dateStr}</div>
                    </div>
                    <div className={deadline.urgent ? "badge badge-red" : "badge"} style={{ fontWeight: '600' }}>
                      {deadline.daysRemaining} days left
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          
          <h2 style={{ fontSize: 'var(--font-xl)', marginBottom: 'var(--space-4)', marginTop: 'var(--space-8)' }}>Quick Actions</h2>
          <div className="quick-links">
            <Link to="/calculator" className="quick-link-card">
              <div className="quick-link-icon blue"><Calculator size={24} /></div>
              <div className="quick-link-text">
                <h4>Book a Trip</h4>
                <p>Calculate point costs and auto-deduct points using FEFO logic</p>
              </div>
            </Link>
            <Link to="/contracts" className="quick-link-card">
              <div className="quick-link-icon purple"><Wallet size={24} /></div>
              <div className="quick-link-text">
                <h4>Manage Portfolio</h4>
                <p>Track your contracts, cancel trips, and manually bank points</p>
              </div>
            </Link>
            <Link to="/charts" className="quick-link-card">
              <div className="quick-link-icon gold"><TableProperties size={24} /></div>
              <div className="quick-link-text">
                <h4>Point Charts</h4>
                <p>Browse and compare point values across all DVC resorts</p>
              </div>
            </Link>
            <Link to="/trends" className="quick-link-card">
              <div className="quick-link-icon teal"><TrendingUp size={24} /></div>
              <div className="quick-link-text">
                <h4>Trends & Analytics</h4>
                <p>Analyze historical point changes and predict future costs</p>
              </div>
            </Link>
          </div>
        </div>
      ) : (
        // ==========================================
        // LOGGED OUT DASHBOARD (Static/Marketing)
        // ==========================================
        <>
          <section className="dashboard-hero">
            <h1>DVC Point Tracker ✨</h1>
            <p className="subtitle">
              Your intelligent Disney Vacation Club points management dashboard. Track contracts,
              calculate trip costs, and discover the best value stays.
            </p>
            <div className="hero-actions">
              <Link to="/charts" className="btn btn-primary btn-lg">
                Browse Point Charts <ArrowRight size={18} />
              </Link>
              <Link to="/calculator" className="btn btn-secondary btn-lg">
                Calculate Trip
              </Link>
            </div>
          </section>

          <section className="stats-row animate-in animate-in-delay-1">
            <div className="stat-card">
              <div className="stat-card-icon gold"><Castle size={18} /></div>
              <div className="stat-card-value">{resorts.length}</div>
              <div className="stat-card-label">Resorts Available</div>
            </div>
            <div className="stat-card">
              <div className="stat-card-icon blue"><TableProperties size={18} /></div>
              <div className="stat-card-value">{chartsCount}</div>
              <div className="stat-card-label">Charts Loaded</div>
            </div>
            <div className="stat-card">
              <div className="stat-card-icon teal"><CalendarDays size={18} /></div>
              <div className="stat-card-value">2025</div>
              <div className="stat-card-label">Data Year</div>
            </div>
            <div className="stat-card">
              <div className="stat-card-icon purple"><DollarSign size={18} /></div>
              <div className="stat-card-value">${avgDues}</div>
              <div className="stat-card-label">Avg Dues/Point</div>
            </div>
          </section>

          <section className="animate-in animate-in-delay-2" style={{ marginTop: 'var(--space-8)' }}>
            <h3 style={{ marginBottom: 'var(--space-5)' }}>Quick Actions</h3>
            <div className="quick-links">
              <Link to="/charts" className="quick-link-card">
                <div className="quick-link-icon gold"><TableProperties size={24} /></div>
                <div className="quick-link-text">
                  <h4>Point Charts</h4>
                  <p>Browse and compare point values across all DVC resorts</p>
                </div>
              </Link>
              <Link to="/calculator" className="quick-link-card">
                <div className="quick-link-icon blue"><Calculator size={24} /></div>
                <div className="quick-link-text">
                  <h4>Trip Calculator</h4>
                  <p>Calculate exact point costs for your vacation dates</p>
                </div>
              </Link>
              <Link to="/contracts" className="quick-link-card">
                <div className="quick-link-icon purple"><Wallet size={24} /></div>
                <div className="quick-link-text">
                  <h4>My Contracts</h4>
                  <p>{currentUser ? "Add your first contract to unlock your personalized command center" : "Log in to track your DVC ownership and point balances"}</p>
                </div>
              </Link>
              <Link to="/trends" className="quick-link-card">
                <div className="quick-link-icon teal"><TrendingUp size={24} /></div>
                <div className="quick-link-text">
                  <h4>Trends & Analytics</h4>
                  <p>Analyze historical point changes and predict future costs</p>
                </div>
              </Link>
            </div>
          </section>
        </>
      )}
    </div>
  );
}
