import { useState, useMemo, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Calendar, BedDouble, MapPin, ArrowRight, Calculator as CalcIcon, PlusCircle } from 'lucide-react';
import { getAllResorts, getResortsWithCharts, getPointChart, getResortById, locationNames, formatCurrency } from '../data/dataLoader';
import { calculateTripCost, calculateCashEquivalent, getSeasonColor, parseDate } from '../utils/pointCalculator';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../firebase';
import { collection, query, where, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';
import { allocateTripPoints } from '../utils/fefoEngine';

export default function TripCalculator() {
  const resorts = getAllResorts();
  const resortsWithCharts = getResortsWithCharts();
  const availableResorts = resorts.filter(r => resortsWithCharts.includes(r.id));

  const [selectedResortId, setSelectedResortId] = useState(availableResorts[0]?.id || '');
  const [selectedRoomTypeId, setSelectedRoomTypeId] = useState('');
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');

  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [contracts, setContracts] = useState([]);
  const [trips, setTrips] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [booking, setBooking] = useState(false);

  useEffect(() => {
    async function fetchData() {
      if (!currentUser) return;
      const [contractsSnap, tripsSnap, txSnap] = await Promise.all([
        getDocs(query(collection(db, 'contracts'), where('userId', '==', currentUser.uid))),
        getDocs(query(collection(db, 'trips'), where('userId', '==', currentUser.uid))),
        getDocs(query(collection(db, 'transactions'), where('userId', '==', currentUser.uid)))
      ]);
      setContracts(contractsSnap.docs.map(d => ({ id: d.id, ...d.data() })));
      setTrips(tripsSnap.docs.map(d => ({ id: d.id, ...d.data() })));
      setTransactions(txSnap.docs.map(d => ({ id: d.id, ...d.data() })));
    }
    fetchData();
  }, [currentUser]);

  async function handleBookTrip() {
    if (!currentUser) {
      alert("Please log in to book a trip.");
      return;
    }
    if (contracts.length === 0) {
      alert("You need to add a contract in 'My Contracts' first before booking a trip.");
      return;
    }

    try {
      setBooking(true);
      // Run FEFO algorithm
      const allocations = allocateTripPoints(contracts, trips, transactions, checkIn, tripResult.totalPoints);
      
      const tripData = {
        resortId: selectedResortId,
        roomTypeId: activeRoomTypeId,
        checkInDate: checkIn,
        checkOutDate: checkOut,
        totalPointsUsed: tripResult.totalPoints,
        allocations,
        userId: currentUser.uid,
        createdAt: serverTimestamp()
      };

      await addDoc(collection(db, 'trips'), tripData);
      
      alert("Trip successfully booked! Points have been deducted automatically via FEFO.");
      navigate('/my-contracts');
    } catch (err) {
      console.error(err);
      alert(err.message || "Failed to book trip.");
    } finally {
      setBooking(false);
    }
  }

  const selectedResort = getResortById(selectedResortId);
  const checkInYear = checkIn ? parseInt(checkIn.split('-')[0]) : 2025;
  const pointChart = selectedResortId ? getPointChart(selectedResortId, checkInYear) : null;

  // Update room type when resort changes
  const roomTypes = selectedResort?.roomTypes || [];
  const activeRoomTypeId = selectedRoomTypeId && roomTypes.find(rt => rt.id === selectedRoomTypeId)
    ? selectedRoomTypeId
    : roomTypes[0]?.id || '';

  // Calculate trip cost
  const tripResult = useMemo(() => {
    if (!checkIn || !checkOut || !activeRoomTypeId || !pointChart) return null;
    const checkInDate = parseDate(checkIn);
    const checkOutDate = parseDate(checkOut);
    if (checkOutDate <= checkInDate) return null;
    return calculateTripCost(checkInDate, checkOutDate, activeRoomTypeId, pointChart.pointChart, pointChart.travelPeriods);
  }, [checkIn, checkOut, activeRoomTypeId, pointChart]);

  const cashEquivalent = useMemo(() => {
    if (!tripResult || !selectedResort) return null;
    const duesPerPoint = selectedResort.dues?.['2025'] || 0;
    return calculateCashEquivalent(tripResult.totalPoints, duesPerPoint);
  }, [tripResult, selectedResort]);

  // Get current room type info
  const currentRoom = roomTypes.find(rt => rt.id === activeRoomTypeId);

  return (
    <div className="animate-in">
      <div className="page-header">
        <h1>Trip Calculator</h1>
        <p className="subtitle">Calculate exact point costs for your vacation dates</p>
      </div>

      {/* Input Form */}
      <div className="glass-card-static animate-in animate-in-delay-1" style={{ marginBottom: 'var(--space-8)' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 'var(--space-4)' }}>
          {/* Resort Selector */}
          <div>
            <label style={{ display: 'block', fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 'var(--space-2)', fontWeight: 'var(--font-semibold)' }}>
              Resort
            </label>
            <select
              className="input-field"
              value={selectedResortId}
              onChange={(e) => {
                setSelectedResortId(e.target.value);
                setSelectedRoomTypeId('');
              }}
            >
              {availableResorts.map(resort => (
                <option key={resort.id} value={resort.id}>{resort.name}</option>
              ))}
            </select>
          </div>

          {/* Room Type Selector */}
          <div>
            <label style={{ display: 'block', fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 'var(--space-2)', fontWeight: 'var(--font-semibold)' }}>
              Room Type
            </label>
            <select
              className="input-field"
              value={activeRoomTypeId}
              onChange={(e) => setSelectedRoomTypeId(e.target.value)}
            >
              {roomTypes.map(rt => (
                <option key={rt.id} value={rt.id}>{rt.name} — {rt.view}</option>
              ))}
            </select>
          </div>

          {/* Check-in Date */}
          <div>
            <label style={{ display: 'block', fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 'var(--space-2)', fontWeight: 'var(--font-semibold)' }}>
              Check-in
            </label>
            <input
              type="date"
              className="input-field"
              value={checkIn}
              onChange={(e) => setCheckIn(e.target.value)}
              min="2025-01-01"
              max={selectedResort ? `${selectedResort.expirationYear}-12-31` : undefined}
            />
          </div>

          {/* Check-out Date */}
          <div>
            <label style={{ display: 'block', fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 'var(--space-2)', fontWeight: 'var(--font-semibold)' }}>
              Check-out
            </label>
            <input
              type="date"
              className="input-field"
              value={checkOut}
              onChange={(e) => setCheckOut(e.target.value)}
              min={checkIn || '2025-01-01'}
              max={selectedResort ? `${selectedResort.expirationYear}-12-31` : undefined}
            />
          </div>
        </div>

        {/* Room info */}
        {currentRoom && (
          <div style={{ marginTop: 'var(--space-4)', display: 'flex', gap: 'var(--space-4)', flexWrap: 'wrap' }}>
            <span className="badge badge-blue">
              <BedDouble size={12} />
              Sleeps {currentRoom.sleeps}
            </span>
            <span className="badge badge-purple">
              {currentRoom.bedConfig}
            </span>
          </div>
        )}
      </div>

      {/* Results */}
      {tripResult && tripResult.nights.length > 0 && (
        <div className="animate-in animate-in-delay-2">
          {/* Summary Stats */}
          <div className="stats-row">
            <div className="stat-card">
              <div className="stat-card-icon gold">
                <CalcIcon size={18} />
              </div>
              <div className="stat-card-value">{tripResult.totalPoints}</div>
              <div className="stat-card-label">Total Points</div>
            </div>
            <div className="stat-card">
              <div className="stat-card-icon blue">
                <Calendar size={18} />
              </div>
              <div className="stat-card-value">{tripResult.nightCount}</div>
              <div className="stat-card-label">Nights</div>
            </div>
            <div className="stat-card">
              <div className="stat-card-icon teal">
                <ArrowRight size={18} />
              </div>
              <div className="stat-card-value">{tripResult.avgPerNight}</div>
              <div className="stat-card-label">Avg Points/Night</div>
            </div>
            {cashEquivalent && (
              <div className="stat-card">
                <div className="stat-card-icon purple">
                  <MapPin size={18} />
                </div>
                <div className="stat-card-value">{formatCurrency(cashEquivalent.rentalValue)}</div>
                <div className="stat-card-label">Rental Value (~$19.50/pt)</div>
              </div>
            )}
          </div>

          {/* Cash Equivalents */}
          {cashEquivalent && (
            <div className="glass-card-static" style={{ marginBottom: 'var(--space-6)', display: 'flex', gap: 'var(--space-8)', flexWrap: 'wrap' }}>
              <div>
                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 'var(--space-1)' }}>
                  Maintenance Dues Cost
                </div>
                <div style={{ fontSize: 'var(--text-xl)', fontFamily: 'var(--font-heading)', fontWeight: 'var(--font-bold)', color: 'var(--color-accent-gold)' }}>
                  {formatCurrency(cashEquivalent.duesCost)}
                </div>
                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>
                  Based on {selectedResort.name} 2025 dues
                </div>
              </div>
              <div>
                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 'var(--space-1)' }}>
                  Rental Market Value
                </div>
                <div style={{ fontSize: 'var(--text-xl)', fontFamily: 'var(--font-heading)', fontWeight: 'var(--font-bold)', color: 'var(--color-accent-blue)' }}>
                  {formatCurrency(cashEquivalent.rentalValue)}
                </div>
                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>
                  At ~$19.50 per point rental rate
                </div>
              </div>
            </div>
          )}

          {/* Night-by-Night Breakdown */}
          <div className="point-chart-container">
            <table className="point-chart-table">
              <thead>
                <tr>
                  <th style={{ textAlign: 'left' }}>Night</th>
                  <th>Day</th>
                  <th>Season</th>
                  <th>Day Type</th>
                  <th>Points</th>
                </tr>
              </thead>
              <tbody>
                {tripResult.nights.map((night, idx) => (
                  <tr key={idx}>
                    <td style={{ textAlign: 'left', fontWeight: 'var(--font-medium)', color: 'var(--color-text-primary)' }}>
                      {night.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </td>
                    <td style={{ color: 'var(--color-text-secondary)' }}>
                      {night.dayOfWeek}
                    </td>
                    <td>
                      {night.season && (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                          <span
                            className="season-dot"
                            style={{
                              backgroundColor: getSeasonColor(
                                pointChart.travelPeriods.findIndex(p => p.id === night.season.id)
                              ),
                            }}
                          />
                          <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>
                            {night.season.name}
                          </span>
                        </span>
                      )}
                    </td>
                    <td>
                      <span className={`badge ${night.dayType === 'weekend' ? 'badge-gold' : 'badge-teal'}`}>
                        {night.dayType === 'weekend' ? 'Weekend' : 'Weekday'}
                      </span>
                    </td>
                    <td style={{ fontWeight: 'var(--font-semibold)', color: 'var(--color-text-primary)', fontVariantNumeric: 'tabular-nums' }}>
                      {night.points || '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr style={{ borderTop: '2px solid var(--color-border)' }}>
                  <td colSpan={4} style={{ textAlign: 'right', fontWeight: 'var(--font-bold)', color: 'var(--color-accent-gold)', fontFamily: 'var(--font-heading)', fontSize: 'var(--text-base)' }}>
                    Total
                  </td>
                  <td style={{ fontWeight: 'var(--font-bold)', color: 'var(--color-accent-gold)', fontFamily: 'var(--font-heading)', fontSize: 'var(--text-lg)', fontVariantNumeric: 'tabular-nums' }}>
                    {tripResult.totalPoints}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Book Trip Action */}
          <div style={{ marginTop: 'var(--space-6)', display: 'flex', justifyContent: 'center', gap: 'var(--space-4)' }}>
            <button 
              className="btn btn-primary" 
              onClick={handleBookTrip} 
              disabled={booking || !currentUser}
              style={{ fontSize: 'var(--text-lg)', padding: 'var(--space-3) var(--space-6)' }}
            >
              <PlusCircle size={20} />
              {booking ? 'Booking...' : (currentUser ? 'Book Trip (FEFO Auto-Deduct)' : 'Log In to Book')}
            </button>
          </div>

          {/* View Chart Link */}
          <div style={{ marginTop: 'var(--space-6)', textAlign: 'center' }}>
            <Link to={`/charts/${selectedResortId}`} className="btn btn-secondary">
              View Full {selectedResort?.name} Point Chart <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      )}

      {/* Empty state when no dates selected */}
      {(!checkIn || !checkOut) && (
        <div className="empty-state animate-in animate-in-delay-2">
          <div className="empty-state-icon">
            <Calendar size={28} />
          </div>
          <div className="empty-state-title">Select your travel dates</div>
          <div className="empty-state-text">
            Choose a resort, room type, and your check-in/check-out dates to see a detailed point cost breakdown.
          </div>
        </div>
      )}
    </div>
  );
}
