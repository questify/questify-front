import React, {useState} from 'react';
import {useAuth} from '@core/contexts/AuthContext';
import {useWeeklyOverview, useDailyOverview} from '@core/hooks/useApi';
import {DailyQuests} from './DailyQuests';
import {StatisticsTab} from './StatisticsTab';

export function DashboardPage() {
    const {user} = useAuth();
    const {data: dailyOverview, isLoading: dailyLoading, error: dailyError} = useDailyOverview();
    const {data: weeklyOverview, isLoading: weeklyLoading, error: weeklyError} = useWeeklyOverview();

    const [activeTab, setActiveTab] = useState<'objectives' | 'stats'>('objectives');

    // Calculate daily stats
    const totalDaily = dailyOverview?.quests?.length || 0;
    const completedDaily = dailyOverview?.validated_count || 0;

    const progressDailyPercentage = totalDaily > 0 ? Math.round((completedDaily / totalDaily) * 100) : 0;

    // Calculate weekly stats
    const totalWeekly = weeklyOverview?.quests?.length || 0;
    const completedWeekly = weeklyOverview?.validated_count || 0;
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
                    Ma journée
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
                    Avancement
                </button>
            </div>

            {/* Tab Content */}
            {activeTab === 'objectives' ? (
                <DailyQuests
                    isLoading={dailyLoading}
                />
            ) : (
                <StatisticsTab
                    dailyLoading={dailyLoading}
                    weeklyLoading={weeklyLoading}
                    totalDaily={totalDaily}
                    completedDaily={completedDaily}
                    progressDailyPercentage={progressDailyPercentage}
                    totalWeekly={totalWeekly}
                    completedWeekly={completedWeekly}
                    progressWeeklyPercentage={progressWeeklyPercentage}
                />
            )}
        </div>
    )
}