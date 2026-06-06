import React, { useState } from 'react';
import { useAuth } from '@core/contexts/AuthContext';

export function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showRegister, setShowRegister] = useState(false);
  const [name, setName] = useState('');
  const { login, register, isLoading } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (showRegister) {
        await register(name, email, password);
      } else {
        await login(email, password);
      }
    } catch {
      // Error is handled by AuthContext (toast)
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #F5F2FA 0%, #E8DFFA 50%, #DEF0FC 100%)',
    }}>
      <div style={{
        background: '#fff',
        borderRadius: '24px',
        boxShadow: '0 20px 40px rgba(0,0,0,0.08)',
        padding: '40px 36px',
        width: '100%',
        maxWidth: '420px',
      }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{ fontSize: '48px', marginBottom: '12px' }}>🏆</div>
          <h1 style={{
            fontFamily: "'Plus Jakarta Sans', 'Arial Black', system-ui, sans-serif",
            fontSize: '36px',
            fontWeight: 800,
            letterSpacing: '-1px',
            color: '#1A1A1A',
            margin: 0,
          }}>Questify</h1>
          <p style={{ color: '#6B6B6B', marginTop: '8px', fontSize: '15px' }}>
            {showRegister ? 'Crée ton compte' : 'Bienvenue !'}
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {showRegister && (
            <div>
              <label style={labelStyle}>Nom</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required={showRegister}
                placeholder="Ton prénom"
                style={inputStyle}
                onFocus={e => { e.currentTarget.style.borderColor = '#C8B7E8'; }}
                onBlur={e => { e.currentTarget.style.borderColor = '#E5E5E5'; }}
              />
            </div>
          )}

          <div>
            <label style={labelStyle}>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="ton@email.com"
              style={inputStyle}
              onFocus={e => { e.currentTarget.style.borderColor = '#C8B7E8'; }}
              onBlur={e => { e.currentTarget.style.borderColor = '#E5E5E5'; }}
            />
          </div>

          <div>
            <label style={labelStyle}>Mot de passe</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="••••••••"
              style={inputStyle}
              onFocus={e => { e.currentTarget.style.borderColor = '#C8B7E8'; }}
              onBlur={e => { e.currentTarget.style.borderColor = '#E5E5E5'; }}
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            style={{
              width: '100%',
              padding: '14px',
              borderRadius: '12px',
              border: 'none',
              background: isLoading ? '#E0E0E0' : '#C8B7E8',
              color: isLoading ? '#A0A0A0' : '#1A1A1A',
              fontWeight: 700,
              fontSize: '15px',
              cursor: isLoading ? 'not-allowed' : 'pointer',
              fontFamily: 'inherit',
              transition: 'background 0.2s',
              marginTop: '4px',
            }}
            onMouseEnter={e => { if (!isLoading) e.currentTarget.style.background = '#B8A5D8'; }}
            onMouseLeave={e => { if (!isLoading) e.currentTarget.style.background = '#C8B7E8'; }}
          >
            {isLoading ? 'Chargement…' : showRegister ? 'Créer mon compte' : 'Se connecter'}
          </button>
        </form>

        {/* Toggle */}
        <div style={{ textAlign: 'center', marginTop: '20px' }}>
          <button
            onClick={() => setShowRegister(!showRegister)}
            style={{
              background: 'none',
              border: 'none',
              color: '#8F72C4',
              fontSize: '14px',
              cursor: 'pointer',
              fontFamily: 'inherit',
            }}
          >
            {showRegister
              ? 'Déjà un compte ? Se connecter'
              : "Pas encore de compte ? Créer un compte"}
          </button>
        </div>
      </div>
    </div>
  );
}

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: '13px',
  fontWeight: 600,
  color: '#374151',
  marginBottom: '6px',
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '12px 14px',
  border: '2px solid #E5E5E5',
  borderRadius: '12px',
  fontSize: '14px',
  fontFamily: 'inherit',
  background: '#fff',
  color: '#1A1A1A',
  outline: 'none',
  boxSizing: 'border-box',
  transition: 'border-color 0.2s',
};
