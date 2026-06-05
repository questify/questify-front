import '../styles/App.css'
import React, {useState} from 'react';
import {useAuth} from '@core/contexts/AuthContext';
import {getAvatarUrl, getAvatarBg, isAvatarImage} from '@core/utils/avatar';
import {LoginForm} from '../components/auth/LoginForm';
import {DashboardPage} from '../components/dashboard/DashboardPage';
import {QuestsPage} from '../components/quests/QuestsPage';
import {BoardPage} from '../components/board/BoardPage';
import {SettingsPage} from '../components/settings/SettingsPage';
import {RewardsPage} from '../components/rewards/RewardsPage';
import {CompetitionPage} from '../components/competition/CompetitionPage';
import {StatsPage} from '../components/stats/StatsPage';

function App() {
    const {user, isAuthenticated, isAuthReady, isUserReady, logout} = useAuth();
    const [activePage, setActivePage] = useState<string>('dashboard');
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

    const isLoading = !isAuthReady || !isUserReady;

    // Show loading while checking auth
    if (isLoading) {
        return (
            <div
                className="min-h-screen flex items-center justify-center"
                style={{ background: 'linear-gradient(135deg, #F5F2FA 0%, #E8DFFA 50%, #DEF0FC 100%)' }}>
                <div className="text-center">
                    <div
                        className="animate-spin rounded-full h-12 w-12 mx-auto mb-4"
                        style={{ borderBottom: '2px solid #8F72C4' }}></div>
                    <p style={{ color: '#6B6B6B' }}>Chargement…</p>
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

    const nav = isSidebarCollapsed ? 'sidebar collapsed' : 'sidebar';
    const topBarClass = isSidebarCollapsed ? 'top-bar sidebar-collapsed' : 'top-bar';
    const contentClass = isSidebarCollapsed ? 'content sidebar-collapsed' : 'content';

    const navItem = (page: string, icon: string, label: string) => (
        <div className={`nav-item ${activePage === page ? 'active' : ''}`} onClick={() => showPage(page)} title={isSidebarCollapsed ? label : undefined}>
            <span className="nav-icon">{icon}</span>
            <span className="nav-label">{label}</span>
        </div>
    );

    return (
        <div className="container flex">
            <div className={nav}>
                <div className="logo">{isSidebarCollapsed ? '🏆' : 'QUESTIFY'}</div>
                {navItem('dashboard', '📊', 'Dashboard')}
                {navItem('quests', '🎯', 'Quêtes')}
                {navItem('plateau', '🎲', 'Plateau')}
                {navItem('competition', '👥', 'Compétition')}
                {navItem('rewards', '🎁', 'Récompenses')}
                {navItem('stats', '📈', 'Statistiques')}
                {navItem('settings', '⚙️', 'Paramètres')}
                <button className="sidebar-toggle" onClick={() => setIsSidebarCollapsed(prev => !prev)} title={isSidebarCollapsed ? 'Déplier le menu' : 'Replier le menu'}>
                    {isSidebarCollapsed ? '›' : '‹'}
                </button>
            </div>

            <div className={topBarClass}>
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
                            <div
                                className="avatar-small"
                                style={getAvatarBg(user?.avatar_url) ? {
                                    background: getAvatarBg(user?.avatar_url),
                                } : undefined}
                            >
                                {getAvatarUrl(user?.avatar_url) || '👤'}
                            </div>
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

            <div className={contentClass}>
                {activePage === 'dashboard' && <DashboardPage onNavigateTo={showPage} />}
                {activePage === 'quests' && <QuestsPage />}
                {activePage === 'plateau' && <BoardPage />}
                {activePage === 'competition' && <CompetitionPage />}
                {activePage === 'settings' && <SettingsPage />}
                {activePage === 'rewards' && <RewardsPage />}
                {activePage === 'stats' && <StatsPage />}
            </div>
        </div>
    )
}

export default App;
