import '../styles/App.css'
import React, {useState} from 'react';
import {useAuth} from '@core/contexts/AuthContext';
import {getAvatarUrl, isAvatarImage} from '@core/utils/avatar';
import {LoginForm} from '../components/auth/LoginForm';
import {DashboardPage} from '../components/dashboard/DashboardPage';
import {QuestsPage} from '../components/quests/QuestsPage';
import {BoardPage} from '../components/board/BoardPage';
import {SettingsPage} from '../components/settings/SettingsPage';
import {RewardsPage} from '../components/rewards/RewardsPage';
import {CompetitionPage} from '../components/competition/CompetitionPage';

function App() {
    const {user, isAuthenticated, isAuthReady, isUserReady, logout} = useAuth();
    const [activePage, setActivePage] = useState<string>('dashboard');
    const [isProfileOpen, setIsProfileOpen] = useState(false);

    const isLoading = !isAuthReady || !isUserReady;

    // Show loading while checking auth
    if (isLoading) {
        return (
            <div
                className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-100 via-pink-100 to-blue-100">
                <div className="text-center">
                    <div
                        className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading...</p>
                </div>
            </div>
        );
    }

    // Show a login form if not authenticated
    if (!isAuthenticated) {
        return <LoginForm/>;
    }

    const handleLogout = () => {
        setIsProfileOpen(false);
        logout();
    };

    const showPage = (pageName: string) => {
        setActivePage(pageName);
    };

    const toggleProfileMenu = () => {
        setIsProfileOpen(prev => !prev);
    };

    return (
        <div className="container flex">
            <div className="sidebar">
                <div className="logo">QUESTIFY</div>
                <div className={`nav-item ${activePage === 'dashboard' ? 'active' : ''}`} onClick={() => showPage('dashboard')}>📊 Dashboard</div>
                <div className={`nav-item ${activePage === 'quests' ? 'active' : ''}`} onClick={() => showPage('quests')}>🎯 Quêtes</div>
                <div className={`nav-item ${activePage === 'plateau' ? 'active' : ''}`} onClick={() => showPage('plateau')}>🎲 Plateau</div>
                <div className={`nav-item ${activePage === 'competition' ? 'active' : ''}`} onClick={() => showPage('competition')}>👥 Compétition</div>
                <div className={`nav-item ${activePage === 'rewards' ? 'active' : ''}`} onClick={() => showPage('rewards')}>🎁 Récompenses</div>
                <div className={`nav-item ${activePage === 'stats' ? 'active' : ''}`} onClick={() => showPage('stats')}>📈 Statistiques</div>
                <div className={`nav-item ${activePage === 'settings' ? 'active' : ''}`} onClick={() => showPage('settings')}>⚙️ Paramètres</div>
            </div>

            <div className="top-bar">
                <div className="profile-menu">
                    <div className="profile-trigger" onClick={() => toggleProfileMenu()}>
                        {isAvatarImage(user?.avatar_url) ? (
                            <img
                                src={getAvatarUrl(user?.avatar_url)}
                                alt={user?.name || 'Avatar'}
                                className="avatar-small"
                                style={{
                                    width: '40px',
                                    height: '40px',
                                    borderRadius: '50%',
                                    objectFit: 'cover',
                                }}
                            />
                        ) : (
                            <div className="avatar-small">{user?.avatar_url || '👤'}</div>
                        )}
                        <div>
                            <div style={{fontWeight: 600, fontSize: '14px'}}>{user?.name}</div>
                            <div style={{fontSize: '12px', color: '#6B6B6B'}}>{user?.total_points} points</div>
                        </div>
                        <svg style={{width: '16px', height: '16px', color: '#6B6B6B'}} fill="none"
                             stroke=" currentColor"
                             viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"/>
                        </svg>
                    </div>

                    <div id="profileDropdown"
                         className={`dropdown ${isProfileOpen ? "active profile-dropdown" : "profile-dropdown"}`} >
                        <div className="dropdown-item" onClick={() => showPage('stats')}>
                            <span style={{fontSize: '18px'}}>👤</span>
                            <span>Mon profil</span>
                        </div>
                        <div className="dropdown-divider"></div>
                        <div className="dropdown-item" onClick={() => showPage('settings')}>
                            <span style={{fontSize: '18px'}}>⚙️</span>
                            <span>Paramètres</span>
                        </div>
                        <div className="dropdown-item" onClick={() => handleLogout()}>
                            <span style={{fontSize: '18px'}}>🚪</span>
                            <span>Déconnexion</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="content">
                {activePage === 'dashboard' && <DashboardPage />}
                {activePage === 'quests' && <QuestsPage />}
                {activePage === 'plateau' && <BoardPage />}
                {activePage === 'competition' && <CompetitionPage />}
                {activePage === 'settings' && <SettingsPage />}
                {activePage === 'rewards' && <RewardsPage />}
            </div>
        </div>
    )
}

export default App;
