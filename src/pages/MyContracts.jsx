import { useState, useEffect } from 'react';
import { Wallet, Plus, Trash2, ArrowRight, PlaneTakeoff, Info, Calendar } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../firebase';
import { collection, query, where, getDocs, addDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';
import { validUseYears, getBankingDeadline } from '../utils/dvcMath';
import { getAllResorts } from '../data/dataLoader';
import { getCurrentUseYear, calculateYearBalance } from '../utils/fefoEngine';

export default function MyContracts() {
  const { currentUser } = useAuth();
  const [contracts, setContracts] = useState([]);
  const [trips, setTrips] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [isContractModalOpen, setIsContractModalOpen] = useState(false);
  
  const resorts = getAllResorts();

  useEffect(() => {
    async function fetchData() {
      if (!currentUser) return;
      
      const contractsQ = query(collection(db, 'contracts'), where('userId', '==', currentUser.uid));
      const tripsQ = query(collection(db, 'trips'), where('userId', '==', currentUser.uid));
      const txQ = query(collection(db, 'transactions'), where('userId', '==', currentUser.uid));

      const [contractsSnap, tripsSnap, txSnap] = await Promise.all([
        getDocs(contractsQ),
        getDocs(tripsQ),
        getDocs(txQ)
      ]);

      setContracts(contractsSnap.docs.map(d => ({ id: d.id, ...d.data() })));
      setTrips(tripsSnap.docs.map(d => ({ id: d.id, ...d.data() })));
      setTransactions(txSnap.docs.map(d => ({ id: d.id, ...d.data() })));
      
      setLoading(false);
    }
    fetchData();
  }, [currentUser]);

  const totalPoints = contracts.reduce((acc, curr) => acc + curr.points, 0);

  async function handleDeleteContract(id) {
    if (!window.confirm("Are you sure you want to delete this contract? This will not delete its associated trips.")) return;
    await deleteDoc(doc(db, 'contracts', id));
    setContracts(contracts.filter(c => c.id !== id));
  }

  async function handleCancelTrip(id) {
    if (!window.confirm("Are you sure you want to cancel this trip? The points will be automatically refunded to your contracts.")) return;
    try {
      await deleteDoc(doc(db, 'trips', id));
      setTrips(trips.filter(t => t.id !== id));
    } catch (err) {
      console.error("Error canceling trip:", err);
      alert("Failed to cancel trip.");
    }
  }

  async function handleBankPoints(contractId, fromYear, toYear, amount) {
    const amountNum = Number(amount);
    if (!amountNum || amountNum <= 0) return;
    
    if (!window.confirm(`Bank ${amountNum} points from ${fromYear} to ${toYear}?`)) return;

    try {
      const txData = {
        contractId,
        fromYear,
        toYear,
        amount: amountNum,
        type: 'BANK',
        userId: currentUser.uid,
        createdAt: serverTimestamp()
      };
      const docRef = await addDoc(collection(db, 'transactions'), txData);
      setTransactions([...transactions, { id: docRef.id, ...txData }]);
    } catch (error) {
      console.error("Error banking points:", error);
      alert("Failed to bank points.");
    }
  }

  function getResortName(resortId) {
    const resort = resorts.find(r => r.id === resortId);
    return resort ? resort.name : resortId;
  }

  return (
    <div className="animate-in">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 'var(--space-4)' }}>
        <div>
          <h1>My Contracts</h1>
          <p className="subtitle">Track your DVC portfolio and point allocations</p>
        </div>
        <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
          <a href="/calculator" className="btn btn-secondary" style={{ textDecoration: 'none' }}>
            <PlaneTakeoff size={16} /> Book Trip
          </a>
          <button className="btn btn-primary" onClick={() => setIsContractModalOpen(true)}>
            <Plus size={16} /> Add Contract
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 'var(--space-4)', marginBottom: 'var(--space-6)' }}>
        <div className="card" style={{ padding: 'var(--space-5)' }}>
          <div style={{ fontSize: 'var(--font-sm)', color: 'var(--color-text-light)', marginBottom: 'var(--space-2)' }}>Total Contract Points</div>
          <div style={{ fontSize: '2.5rem', fontWeight: '700', color: 'var(--color-primary)' }}>{totalPoints}</div>
        </div>
        <div className="card" style={{ padding: 'var(--space-5)' }}>
          <div style={{ fontSize: 'var(--font-sm)', color: 'var(--color-text-light)', marginBottom: 'var(--space-2)' }}>Total Contracts</div>
          <div style={{ fontSize: '2.5rem', fontWeight: '700' }}>{contracts.length}</div>
        </div>
      </div>

      {loading ? (
        <div>Loading portfolio...</div>
      ) : contracts.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">
            <Wallet size={28} />
          </div>
          <div className="empty-state-title">No Contracts Yet</div>
          <div className="empty-state-text">
            Add your first DVC contract to start tracking your point balances and banking deadlines.
          </div>
          <div style={{ marginTop: 'var(--space-6)' }}>
            <button className="btn btn-primary" onClick={() => setIsContractModalOpen(true)}>
              <Plus size={14} /> Add Contract
            </button>
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
          {contracts.map(contract => {
            const currentYear = getCurrentUseYear(contract.useYear);
            const currentBalance = calculateYearBalance(contract, currentYear, trips, transactions);
            const nextBalance = calculateYearBalance(contract, currentYear + 1, trips, transactions);

            return (
              <div key={contract.id} className="card" style={{ position: 'relative' }}>
                <div style={{ padding: 'var(--space-5)', borderBottom: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <h3 style={{ fontSize: 'var(--font-xl)', marginBottom: 'var(--space-1)' }}>{getResortName(contract.resortId)}</h3>
                    <div style={{ display: 'flex', gap: 'var(--space-4)', color: 'var(--color-text-light)', fontSize: 'var(--font-sm)' }}>
                      <span>{contract.points} Points</span>
                      <span>•</span>
                      <span>{contract.useYear} Use Year</span>
                      <span>•</span>
                      <span>Banking Deadline: {getBankingDeadline(contract.useYear)}</span>
                    </div>
                  </div>
                  <button 
                    onClick={() => handleDeleteContract(contract.id)}
                    style={{ background: 'none', border: 'none', color: 'var(--color-text-light)', cursor: 'pointer' }}
                    title="Delete Contract"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>

                <div style={{ padding: 'var(--space-5)', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 'var(--space-6)' }}>
                  
                  {/* Current Year Panel */}
                  <div style={{ backgroundColor: 'var(--color-bg)', padding: 'var(--space-4)', borderRadius: '0.5rem', border: '1px solid var(--color-border)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--space-3)' }}>
                      <h4 style={{ fontSize: 'var(--font-sm)', fontWeight: '600', color: 'var(--color-text-light)' }}>CURRENT USE YEAR ({currentYear})</h4>
                      <span className="badge badge-blue">Available: {currentBalance.totalAvailable}</span>
                    </div>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)', fontSize: 'var(--font-sm)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>Base Points</span>
                        <span>{currentBalance.basePoints}</span>
                      </div>
                      {(currentBalance.bankedIn > 0 || currentBalance.borrowedIn > 0) && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--color-green)' }}>
                          <span>Banked/Borrowed In</span>
                          <span>+{currentBalance.bankedIn + currentBalance.borrowedIn}</span>
                        </div>
                      )}
                      {(currentBalance.bankedOut > 0 || currentBalance.borrowedOut > 0) && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--color-red)' }}>
                          <span>Banked/Borrowed Out</span>
                          <span>-{currentBalance.bankedOut + currentBalance.borrowedOut}</span>
                        </div>
                      )}
                      {currentBalance.used > 0 && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--color-red)' }}>
                          <span>Trip Usage (FEFO)</span>
                          <span>-{currentBalance.used}</span>
                        </div>
                      )}
                    </div>

                    <div style={{ marginTop: 'var(--space-4)', paddingTop: 'var(--space-3)', borderTop: '1px solid var(--color-border)' }}>
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--space-2)', color: currentBalance.expiringAvailable > 0 ? 'var(--color-red)' : 'var(--color-text-light)', fontSize: 'var(--font-xs)', marginBottom: 'var(--space-3)' }}>
                        <Info size={14} style={{ flexShrink: 0, marginTop: '2px' }} />
                        <span>You have <strong>{currentBalance.expiringAvailable} expiring points</strong> that must be used by the end of {currentYear}.</span>
                      </div>
                      
                      {currentBalance.currentAvailable > 0 && (
                        <button 
                          className="btn btn-secondary" 
                          style={{ width: '100%', fontSize: 'var(--font-xs)', padding: 'var(--space-1) var(--space-2)' }}
                          onClick={() => {
                            const maxBank = currentBalance.currentAvailable;
                            const amt = window.prompt(`How many points to bank to ${currentYear + 1}? (Max: ${maxBank})`, maxBank);
                            if (amt && Number(amt) <= maxBank) {
                              handleBankPoints(contract.id, currentYear, currentYear + 1, amt);
                            } else if (amt && Number(amt) > maxBank) {
                              alert("You cannot bank more than your current available base points.");
                            }
                          }}
                        >
                          Bank Points to {currentYear + 1}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Next Year Panel */}
                  <div style={{ backgroundColor: 'var(--color-bg)', padding: 'var(--space-4)', borderRadius: '0.5rem', border: '1px solid var(--color-border)', opacity: 0.8 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--space-3)' }}>
                      <h4 style={{ fontSize: 'var(--font-sm)', fontWeight: '600', color: 'var(--color-text-light)' }}>NEXT USE YEAR ({currentYear + 1})</h4>
                      <span className="badge">Available: {nextBalance.totalAvailable}</span>
                    </div>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)', fontSize: 'var(--font-sm)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>Base Points</span>
                        <span>{nextBalance.basePoints}</span>
                      </div>
                      {(nextBalance.bankedIn > 0 || nextBalance.borrowedIn > 0) && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--color-green)' }}>
                          <span>Banked/Borrowed In</span>
                          <span>+{nextBalance.bankedIn + nextBalance.borrowedIn}</span>
                        </div>
                      )}
                      {(nextBalance.bankedOut > 0 || nextBalance.borrowedOut > 0) && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--color-red)' }}>
                          <span>Banked/Borrowed Out</span>
                          <span>-{nextBalance.bankedOut + nextBalance.borrowedOut}</span>
                        </div>
                      )}
                      {nextBalance.used > 0 && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--color-red)' }}>
                          <span>Trip Usage</span>
                          <span>-{nextBalance.used}</span>
                        </div>
                      )}
                    </div>
                  </div>

                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Trip History Section */}
      {trips.length > 0 && (
        <div style={{ marginTop: 'var(--space-8)' }}>
          <h2 style={{ fontSize: 'var(--font-xl)', marginBottom: 'var(--space-4)' }}>Trip History</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            {trips.sort((a, b) => new Date(a.checkInDate) - new Date(b.checkInDate)).map(trip => (
              <div key={trip.id} className="card" style={{ padding: 'var(--space-4)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
                  <div style={{ backgroundColor: 'rgba(255,255,255,0.05)', padding: 'var(--space-3)', borderRadius: '0.5rem' }}>
                    <Calendar size={24} color="var(--color-primary)" />
                  </div>
                  <div>
                    <h4 style={{ fontSize: 'var(--font-md)', fontWeight: '600' }}>{getResortName(trip.resortId)}</h4>
                    <div style={{ color: 'var(--color-text-light)', fontSize: 'var(--font-sm)', marginTop: '2px' }}>
                      Check-in: {trip.checkInDate} • {trip.totalPointsUsed || trip.pointsUsed} Points Total
                    </div>
                    {trip.allocations && trip.allocations.length > 0 && (
                      <div style={{ color: 'var(--color-accent)', fontSize: 'var(--font-xs)', marginTop: '4px' }}>
                        Funded by: {trip.allocations.map(a => `${a.amount} pts (${a.useYear})`).join(', ')}
                      </div>
                    )}
                  </div>
                </div>
                <button 
                  onClick={() => handleCancelTrip(trip.id)}
                  style={{ background: 'none', border: 'none', color: 'var(--color-text-light)', cursor: 'pointer', padding: 'var(--space-2)' }}
                  title="Cancel Trip & Refund Points"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {isContractModalOpen && (
        <AddContractModal 
          onClose={() => setIsContractModalOpen(false)} 
          resorts={resorts} 
          onAdd={(newContract) => setContracts([...contracts, newContract])} 
        />
      )}
    </div>
  );
}



function AddContractModal({ onClose, resorts, onAdd }) {
  const { currentUser } = useAuth();
  const [resortId, setResortId] = useState(resorts[0]?.id || '');
  const [points, setPoints] = useState('');
  const [useYear, setUseYear] = useState('February');
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    const contractData = {
      resortId,
      points: Number(points),
      useYear,
      userId: currentUser.uid,
      createdAt: serverTimestamp()
    };
    try {
      const docRef = await addDoc(collection(db, 'contracts'), contractData);
      onAdd({ id: docRef.id, ...contractData });
      onClose();
    } catch (error) {
      console.error("Error adding contract: ", error);
      alert("Failed to save contract.");
      setSaving(false);
    }
  }

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 'var(--space-4)' }}>
      <div className="card" style={{ width: '100%', maxWidth: '500px', maxHeight: '90vh', overflowY: 'auto' }}>
        <div style={{ padding: 'var(--space-5)', borderBottom: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ fontSize: 'var(--font-xl)' }}>Add Contract</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: 'var(--color-text-light)' }}>&times;</button>
        </div>
        <form onSubmit={handleSubmit} style={{ padding: 'var(--space-5)', display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <div>
            <label style={{ display: 'block', marginBottom: 'var(--space-2)', fontWeight: '500' }}>Home Resort</label>
            <select className="input-field" value={resortId} onChange={e => setResortId(e.target.value)} required>
              {resorts.map(r => (
                <option key={r.id} value={r.id}>{r.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: 'var(--space-2)', fontWeight: '500' }}>Number of Points</label>
            <input type="number" className="input-field" value={points} onChange={e => setPoints(e.target.value)} min="25" max="2000" required placeholder="e.g. 160" />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: 'var(--space-2)', fontWeight: '500' }}>Use Year</label>
            <select className="input-field" value={useYear} onChange={e => setUseYear(e.target.value)} required>
              {validUseYears.map(month => (
                <option key={month} value={month}>{month}</option>
              ))}
            </select>
            <p style={{ fontSize: 'var(--font-xs)', color: 'var(--color-text-light)', marginTop: 'var(--space-2)' }}>
              Banking deadline: <strong>{getBankingDeadline(useYear)}</strong>
            </p>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-3)', marginTop: 'var(--space-4)' }}>
            <button type="button" className="btn btn-secondary" onClick={onClose} disabled={saving}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Saving...' : 'Save Contract'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}


