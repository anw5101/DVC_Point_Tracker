import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, signup } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isSignUp) {
        await signup(email, password);
      } else {
        await login(email, password);
      }
      navigate('/contracts');
    } catch (err) {
      setError(err.message || 'Failed to authenticate');
    }

    setLoading(false);
  }

  return (
    <div className="animate-in" style={{ maxWidth: '400px', margin: '40px auto' }}>
      <div className="page-header" style={{ textAlign: 'center' }}>
        <h1>{isSignUp ? 'Create Account' : 'Welcome Back'}</h1>
        <p className="subtitle">Sign in to track your DVC contracts across devices</p>
      </div>

      <div className="card" style={{ padding: 'var(--space-6)' }}>
        {error && <div style={{ color: 'var(--color-danger)', marginBottom: 'var(--space-4)', padding: 'var(--space-3)', backgroundColor: 'var(--color-danger-bg)', borderRadius: 'var(--radius-md)' }}>{error}</div>}
        
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <div>
            <label style={{ display: 'block', marginBottom: 'var(--space-2)' }}>Email</label>
            <input 
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input-field" 
              required 
            />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: 'var(--space-2)' }}>Password</label>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input-field" 
              required 
            />
          </div>
          <button type="submit" className="btn btn-primary" disabled={loading} style={{ marginTop: 'var(--space-2)' }}>
            {isSignUp ? 'Sign Up' : 'Log In'}
          </button>
        </form>

        <div style={{ marginTop: 'var(--space-5)', textAlign: 'center' }}>
          <button 
            type="button" 
            onClick={() => setIsSignUp(!isSignUp)}
            style={{ background: 'none', border: 'none', color: 'var(--color-primary)', cursor: 'pointer', fontSize: 'var(--font-sm)' }}
          >
            {isSignUp ? 'Already have an account? Log In' : 'Need an account? Sign Up'}
          </button>
        </div>
      </div>
    </div>
  );
}
