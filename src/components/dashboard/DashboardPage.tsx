import React, {useState} from 'react';
import {useAuth} from '../../contexts/AuthContext';
import {useQuests, useWeeklyOverview, useDailyOverview} from "../../hooks/useApi";
import {DailyObjectives} from './DailyObjectives';

export function DashboardPage() {
    const {user, isAuthenticated, isLoading: authLoading, logout} = useAuth();
    const {data: quests, isLoading: questsLoading, error: questsError} = useQuests();
    const {data: dailyOverview, isLoading: dailyLoading, error: dailyError} = useDailyOverview();
    const {data: weeklyOverview, isLoading: weeklyLoading, error: weeklyError} = useWeeklyOverview();

    const [isDailyExpanded, setIsDailyExpanded] = useState(false);
    const [isWeeklyExpanded, setIsWeeklyExpanded] = useState(false);
    const [activeTab, setActiveTab] = useState<'objectives' | 'stats'>('objectives');

    // Calculate daily stats
    const totalDaily = dailyOverview?.objectives?.length || 0;
    const completedDaily = dailyOverview?.validated_count || 0;
    const failedDaily = dailyOverview?.objectives?.filter(obj =>
        obj.validations_today?.some(v => v.type === 'failure')
    ).length || 0;

    // Calculate weekly stats
    const totalWeekly = weeklyOverview?.objectives?.length || 0;
    const completedWeekly = weeklyOverview?.validated_count || 0;
    const failedWeekly = weeklyOverview?.objectives?.filter(obj =>
        obj.validations_this_week?.some(v => v.type === 'failure')
    ).length || 0;

    const totalDailyAttempts = completedDaily + failedDaily;
    const dailySuccessRate = totalDailyAttempts > 0 ? Math.round((completedDaily / totalDailyAttempts) * 100) : 0;
    const progressDailyPercentage = totalWeekly > 0 ? Math.round((completedDaily / totalDaily) * 100) : 0;

    const totalWeeklyAttempts = completedWeekly + failedWeekly;
    const weeklySuccessRate = totalWeeklyAttempts > 0 ? Math.round((completedWeekly / totalWeeklyAttempts) * 100) : 0;
    const progressWeeklyPercentage = totalWeekly > 0 ? Math.round((completedWeekly / totalWeekly) * 100) : 0;

    return (
        <div id="dashboard" className="page active">
            <h1 style={{fontSize: '36px', marginBottom: '8px'}}>Bienvenue {user?.name} ! 👋</h1>
            <p style={{color: '#6B6B6B', marginBottom: '20px'}}>Continue ton aventure wellness</p>

            {/* Tabs Navigation */}
            <div style={{
                display: 'flex',
                gap: '8px',
                marginBottom: '30px',
                borderBottom: '2px solid #E0E0E0'
            }}>
                <button
                    onClick={() => setActiveTab('objectives')}
                    style={{
                        padding: '12px 24px',
                        fontSize: '16px',
                        fontWeight: 600,
                        border: 'none',
                        background: 'none',
                        cursor: 'pointer',
                        borderBottom: activeTab === 'objectives' ? '3px solid #C8B7E8' : 'none',
                        color: activeTab === 'objectives' ? '#1A1A1A' : '#6B6B6B',
                        transition: 'all 0.3s'
                    }}
                >
                    Mes objectifs du jour
                </button>
                <button
                    onClick={() => setActiveTab('stats')}
                    style={{
                        padding: '12px 24px',
                        fontSize: '16px',
                        fontWeight: 600,
                        border: 'none',
                        background: 'none',
                        cursor: 'pointer',
                        borderBottom: activeTab === 'stats' ? '3px solid #C8B7E8' : 'none',
                        color: activeTab === 'stats' ? '#1A1A1A' : '#6B6B6B',
                        transition: 'all 0.3s'
                    }}
                >
                    Statistiques
                </button>
            </div>

            {/* Tab Content */}
            {activeTab === 'objectives' ? (
                <DailyObjectives
                    objectives={dailyOverview?.objectives}
                    isLoading={dailyLoading}
                />
            ) : (
                <>
                    <div className="stats-row">
                        <div className="stat-card">
                            <h3>{user?.streak_current}</h3>
                            <p style={{color: '#6B6B6B'}}>jours de suite 🔥</p>
                        </div>
                        <div className="stat-card">
                            <h3>{user?.total_points}</h3>
                            <p style={{color: '#6B6B6B'}}>Points XP ⭐</p>
                        </div>
                        <div className="stat-card">
                            <h3>{dailyLoading ? '...' : `${completedDaily} / ${totalDaily}`}</h3>
                            <p style={{color: '#6B6B6B'}}>✅ Validations / Quêtes quotidiennes</p>
                        </div>
                        <div className="stat-card">
                            <h3>{weeklyLoading ? '...' : `${completedWeekly} / ${totalWeekly}`}</h3>
                            <p style={{color: '#6B6B6B'}}>✅ Validations / Quêtes hebdomadaires</p>
                        </div>
                    </div>

                    <div className="card">
                <div
                    style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: isDailyExpanded ? '20px' : '0',
                        cursor: 'pointer'
                    }}
                    onClick={() => setIsDailyExpanded(!isDailyExpanded)}
                >
                    <h3 style={{ margin: 0 }}>Aujourd'hui</h3>
                    <span style={{ fontSize: '20px', transition: 'transform 0.3s', transform: isDailyExpanded ? 'rotate(180deg)' : 'rotate(0deg)' }}>
                        ▼
                    </span>
                </div>
                {isDailyExpanded && (
                    <>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px', marginBottom: '20px' }}>
                            <div style={{ textAlign: 'center' }}>
                                <div style={{ fontSize: '28px', fontWeight: 700, color: '#C8EAD3' }}>
                                    {dailyLoading ? '...' : completedDaily}
                                </div>
                                <div style={{ fontSize: '13px', color: '#6B6B6B' }}>✅ Réussis</div>
                            </div>
                            <div style={{ textAlign: 'center' }}>
                                <div style={{ fontSize: '28px', fontWeight: 700, color: '#FFD1C1' }}>
                                    {dailyLoading ? '...' : failedDaily}
                                </div>
                                <div style={{ fontSize: '13px', color: '#6B6B6B' }}>❌ Ratés</div>
                            </div>
                            <div style={{ textAlign: 'center' }}>
                                <div style={{ fontSize: '28px', fontWeight: 700, color: '#C8B7E8' }}>
                                    {dailyLoading ? '...' : `${dailySuccessRate}%`}
                                </div>
                                <div style={{ fontSize: '13px', color: '#6B6B6B' }}>Taux réussite</div>
                            </div>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', fontSize: '14px' }}>
                            <span style={{ color: '#6B6B6B' }}>Progression</span>
                            <span style={{ fontWeight: 700, color: '#C8B7E8' }}>
                                {dailyLoading ? '...' : `${completedDaily}/${totalDaily} objectifs`}
                            </span>
                        </div>
                        <div className="progress-bar">
                            <div className="progress-fill lilas" style={{ width: `${progressDailyPercentage}%` }}></div>
                        </div>
                    </>
                )}
            </div>

            <div className="card">
                <div
                    style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: isWeeklyExpanded ? '20px' : '0',
                        cursor: 'pointer'
                    }}
                    onClick={() => setIsWeeklyExpanded(!isWeeklyExpanded)}
                >
                    <h3 style={{ margin: 0 }}>Cette semaine</h3>
                    <span style={{ fontSize: '20px', transition: 'transform 0.3s', transform: isWeeklyExpanded ? 'rotate(180deg)' : 'rotate(0deg)' }}>
                        ▼
                    </span>
                </div>
                {isWeeklyExpanded && (
                    <>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px', marginBottom: '20px' }}>
                            <div style={{ textAlign: 'center' }}>
                                <div style={{ fontSize: '28px', fontWeight: 700, color: '#C8EAD3' }}>
                                    {weeklyLoading ? '...' : completedWeekly}
                                </div>
                                <div style={{ fontSize: '13px', color: '#6B6B6B' }}>✅ Réussis</div>
                            </div>
                            <div style={{ textAlign: 'center' }}>
                                <div style={{ fontSize: '28px', fontWeight: 700, color: '#FFD1C1' }}>
                                    {weeklyLoading ? '...' : failedWeekly}
                                </div>
                                <div style={{ fontSize: '13px', color: '#6B6B6B' }}>❌ Ratés</div>
                            </div>
                            <div style={{ textAlign: 'center' }}>
                                <div style={{ fontSize: '28px', fontWeight: 700, color: '#C8B7E8' }}>
                                    {weeklyLoading ? '...' : `${weeklySuccessRate}%`}
                                </div>
                                <div style={{ fontSize: '13px', color: '#6B6B6B' }}>Taux réussite</div>
                            </div>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', fontSize: '14px' }}>
                            <span style={{ color: '#6B6B6B' }}>Progression</span>
                            <span style={{ fontWeight: 700, color: '#C8B7E8' }}>
                                {weeklyLoading ? '...' : `${completedWeekly}/${totalWeekly} objectifs`}
                            </span>
                        </div>
                        <div className="progress-bar">
                            <div className="progress-fill lilas" style={{ width: `${progressWeeklyPercentage}%` }}></div>
                        </div>
                    </>
                )}
            </div>
                </>
            )}
        </div>
    )
}