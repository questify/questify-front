import React, { useState, useMemo, useEffect } from 'react';
import {useAuth} from '@core/contexts/AuthContext';
import {useDailyMoodHistory, usePositiveThingsHistory, useValidationsHistory} from '@core/hooks/useApi';

interface StatisticsTabProps {
    dailyLoading: boolean;
    weeklyLoading: boolean;
    totalDaily: number;
    completedDaily: number;
    progressDailyPercentage: number;
    totalWeekly: number;
    completedWeekly: number;
    progressWeeklyPercentage: number;
}

type HistoryItem = {
    type: 'mood' | 'positiveThings' | 'validation';
    date: string;
    data: any;
};

const moodEmojis: Record<number, string> = {
    5: '😍',
    4: '😊',
    3: '😐',
    2: '😔',
    1: '😢',
};

const moodLabels: Record<number, string> = {
    5: 'Excellent',
    4: 'Bien',
    3: 'Correct',
    2: 'Pas bien',
    1: 'Très mal',
};

export function StatisticsTab({
    dailyLoading,
    weeklyLoading,
    totalDaily,
    completedDaily,
    progressDailyPercentage,
    totalWeekly,
    completedWeekly,
    progressWeeklyPercentage,
}: StatisticsTabProps) {
    const {user} = useAuth();
    const [isDailyExpanded, setIsDailyExpanded] = useState(false);
    const [isWeeklyExpanded, setIsWeeklyExpanded] = useState(false);
    const [isHistoryExpanded, setIsHistoryExpanded] = useState(true);
    const [daysToFetch, setDaysToFetch] = useState(1);

    const today = new Date().toISOString().split('T')[0];

    // Fetch history data
    const {data: moodHistory} = useDailyMoodHistory(daysToFetch);
    const {data: positiveThingsHistory} = usePositiveThingsHistory(daysToFetch);
    const {data: validationsHistory, isError: validationsError} = useValidationsHistory(daysToFetch);

    // Check if today has no data, then fetch yesterday's data
    useEffect(() => {
        if (daysToFetch === 1 && moodHistory !== undefined && positiveThingsHistory !== undefined) {
            const todayMood = moodHistory?.filter((m: any) => m.date === today);
            const todayPositive = positiveThingsHistory?.filter((p: any) => p.date === today);
            const todayValidations = validationsHistory?.filter((v: any) =>
                (v.created_at || v.date || '').startsWith(today)
            );

            const hasTodayData = (todayMood && todayMood.length > 0) ||
                                (todayPositive && todayPositive.length > 0) ||
                                (todayValidations && todayValidations.length > 0);

            if (!hasTodayData) {
                // No data for today, fetch last 2 days to get yesterday
                setDaysToFetch(2);
            }
        }
    }, [moodHistory, positiveThingsHistory, validationsHistory, daysToFetch, today]);
    // Merge and sort history items chronologically, filtering for today or yesterday
    const { sortedHistory, displayDate, isShowingYesterday } = useMemo(() => {
        const items: HistoryItem[] = [];
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().split('T')[0];

        // Add mood entries
        if (moodHistory) {
            moodHistory.forEach((mood: any) => {
                items.push({
                    type: 'mood',
                    date: mood.created_at || mood.date,
                    data: mood,
                });
            });
        }
        // Add positive things entries
        if (positiveThingsHistory) {
            positiveThingsHistory.forEach((things: any) => {
                items.push({
                    type: 'positiveThings',
                    date: things.created_at || things.date,
                    data: things,
                });
            });
        }
        // Add validation entries
        if (validationsHistory) {
            validationsHistory.forEach((validation: any) => {
                items.push({
                    type: 'validation',
                    date: validation.created_at || validation.date,
                    data: validation,
                });
            });
        }

        // Check if we have data for today
        const todayItems = items.filter(item => item.date.startsWith(today));
        const yesterdayItems = items.filter(item => item.date.startsWith(yesterdayStr));
        // Use today's data if available, otherwise yesterday's
        const isShowingYesterday = todayItems.length === 0;
        const filteredItems = !isShowingYesterday ? todayItems : yesterdayItems;
        const dateToDisplay = !isShowingYesterday ? today : yesterdayStr;

        // Format the display date
        const displayDate = new Date(dateToDisplay + 'T12:00:00').toLocaleDateString('fr-FR', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });

        // Sort by date descending (most recent first)
        return {
            sortedHistory: filteredItems.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
            displayDate,
            isShowingYesterday,
        };
    }, [moodHistory, positiveThingsHistory, validationsHistory, validationsError, today]);

    return (
        <>
            <div className="stats-row">
                <div className="stat-card">
                    <h3>{user?.streak_current}</h3>
                    <p style={{ color: '#6B6B6B' }}>jours de suite 🔥</p>
                </div>
                <div className="stat-card">
                    <h3>{user?.total_points}</h3>
                    <p style={{ color: '#6B6B6B' }}>Points XP ⭐</p>
                </div>
                <div className="stat-card">
                    <h3>{dailyLoading ? '...' : `${completedDaily} / ${totalDaily}`}</h3>
                    <p style={{ color: '#6B6B6B' }}>✅ Validations / Quêtes quotidiennes</p>
                </div>
                <div className="stat-card">
                    <h3>{weeklyLoading ? '...' : `${completedWeekly} / ${totalWeekly}`}</h3>
                    <p style={{ color: '#6B6B6B' }}>✅ Validations / Quêtes hebdomadaires</p>
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
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
                            <div style={{ textAlign: 'center' }}>
                                <div style={{ fontSize: '28px', fontWeight: 700, color: '#C8EAD3' }}>
                                    {dailyLoading ? '...' : completedDaily}
                                </div>
                                <div style={{ fontSize: '13px', color: '#6B6B6B' }}>✅ Réussis</div>
                            </div>
                            <div style={{ textAlign: 'center' }}>
                                <div style={{ fontSize: '28px', fontWeight: 700, color: '#C8B7E8' }}>
                                    {dailyLoading ? '...' : `${progressDailyPercentage}%`}
                                </div>
                                <div style={{ fontSize: '13px', color: '#6B6B6B' }}>Taux d'avancement</div>
                            </div>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', fontSize: '14px' }}>
                            <span style={{ color: '#6B6B6B' }}>Progression</span>
                            <span style={{ fontWeight: 700, color: '#C8B7E8' }}>
                                {dailyLoading ? '...' : `${completedDaily}/${totalDaily} quêtes`}
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
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
                            <div style={{ textAlign: 'center' }}>
                                <div style={{ fontSize: '28px', fontWeight: 700, color: '#C8EAD3' }}>
                                    {weeklyLoading ? '...' : completedWeekly}
                                </div>
                                <div style={{ fontSize: '13px', color: '#6B6B6B' }}>✅ Réussis</div>
                            </div>
                            <div style={{ textAlign: 'center' }}>
                                <div style={{ fontSize: '28px', fontWeight: 700, color: '#C8B7E8' }}>
                                    {weeklyLoading ? '...' : `${progressWeeklyPercentage}%`}
                                </div>
                                <div style={{ fontSize: '13px', color: '#6B6B6B' }}>Taux d'avancement</div>
                            </div>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', fontSize: '14px' }}>
                            <span style={{ color: '#6B6B6B' }}>Progression</span>
                            <span style={{ fontWeight: 700, color: '#C8B7E8' }}>
                                {weeklyLoading ? '...' : `${completedWeekly}/${totalWeekly} quêtes`}
                            </span>
                        </div>
                        <div className="progress-bar">
                            <div className="progress-fill lilas" style={{ width: `${progressWeeklyPercentage}%` }}></div>
                        </div>
                    </>
                )}
            </div>

            {/* History Section */}
            <div className="card" style={{ marginTop: '20px' }}>
                <div
                    style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: isHistoryExpanded ? '20px' : '0',
                        cursor: 'pointer'
                    }}
                    onClick={() => setIsHistoryExpanded(!isHistoryExpanded)}
                >
                    <h3 style={{ margin: 0 }}>
                        {isShowingYesterday ? `Historique - ${displayDate}` : `Historique du jour - ${displayDate}`}
                    </h3>
                    <span style={{ fontSize: '20px', transition: 'transform 0.3s', transform: isHistoryExpanded ? 'rotate(180deg)' : 'rotate(0deg)' }}>
                        ▼
                    </span>
                </div>
                {isHistoryExpanded && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {sortedHistory.length === 0 ? (
                            <p style={{ color: '#6B6B6B', textAlign: 'center', padding: '20px' }}>
                                Aucune activité enregistrée pour le moment
                            </p>
                        ) : (
                            sortedHistory.map((item, index) => {
                                const date = new Date(item.date);
                                const time = date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

                                if (item.type === 'mood') {
                                    const moodValue = item.data.mood_value;
                                    return (
                                        <div
                                            key={`mood-${item.date}-${index}`}
                                            style={{
                                                padding: '16px',
                                                borderRadius: '12px',
                                                backgroundColor: '#F8F8F8',
                                                border: '1px solid #E0E0E0',
                                            }}
                                        >
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                                                <span style={{ fontSize: '32px' }}>{moodEmojis[moodValue]}</span>
                                                <div style={{ flex: 1 }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                                                        <span style={{ fontWeight: 600, fontSize: '16px', color: '#1A1A1A' }}>
                                                            Humeur du jour
                                                        </span>
                                                        <span style={{ fontSize: '14px', color: '#6B6B6B' }}>
                                                            {time}
                                                        </span>
                                                    </div>
                                                </div>
                                                <div
                                                    style={{
                                                        padding: '6px 12px',
                                                        borderRadius: '8px',
                                                        backgroundColor: '#C8B7E8',
                                                        fontSize: '13px',
                                                        fontWeight: 600,
                                                        color: '#1A1A1A',
                                                    }}
                                                >
                                                    {moodLabels[moodValue]}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                }

                                if (item.type === 'positiveThings') {
                                    const things = [
                                        item.data.thing_1,
                                        item.data.thing_2,
                                        item.data.thing_3,
                                    ].filter(Boolean);

                                    return (
                                        <div
                                            key={`positive-${item.date}-${index}`}
                                            style={{
                                                padding: '16px',
                                                borderRadius: '12px',
                                                backgroundColor: '#F8F8F8',
                                                border: '1px solid #E0E0E0',
                                            }}
                                        >
                                            <div style={{ display: 'flex', alignItems: 'start', gap: '12px' }}>
                                                <span style={{ fontSize: '24px' }}>✨</span>
                                                <div style={{ flex: 1 }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '12px' }}>
                                                        <span style={{ fontWeight: 600, fontSize: '16px', color: '#1A1A1A' }}>
                                                            3 choses positives
                                                        </span>
                                                        <span style={{ fontSize: '14px', color: '#6B6B6B' }}>
                                                            {time}
                                                        </span>
                                                    </div>
                                                    <ul style={{ margin: 0, paddingLeft: '20px', listStyle: 'disc' }}>
                                                        {things.map((thing, i) => (
                                                            <li key={i} style={{ fontSize: '14px', color: '#4A4A4A', marginBottom: '6px' }}>
                                                                {thing}
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                }

                                if (item.type === 'validation') {
                                    const validation = item.data;
                                    const isSuccess = validation.type === 'completion' || validation.type === 'success';

                                    return (
                                        <div
                                            key={`validation-${item.date}-${index}`}
                                            style={{
                                                padding: '16px',
                                                borderRadius: '12px',
                                                backgroundColor: '#F8F8F8',
                                                border: '1px solid #E0E0E0',
                                            }}
                                        >
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                <span style={{ fontSize: '32px' }}>
                                                    {isSuccess ? '✅' : '❌'}
                                                </span>
                                                <div style={{ flex: 1 }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                                                        <span style={{ fontWeight: 600, fontSize: '16px', color: '#1A1A1A' }}>
                                                            {validation.quest_title || validation.quest?.title || 'Objectif validé'}
                                                        </span>
                                                        <span style={{ fontSize: '14px', color: '#6B6B6B' }}>
                                                            {time}
                                                        </span>
                                                    </div>
                                                </div>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                    {validation.points_earned > 0 && (
                                                        <div
                                                            style={{
                                                                padding: '6px 12px',
                                                                borderRadius: '8px',
                                                                backgroundColor: '#FFE4C8',
                                                                fontSize: '13px',
                                                                fontWeight: 600,
                                                                color: '#1A1A1A',
                                                            }}
                                                        >
                                                            +{validation.points_earned} pts
                                                        </div>
                                                    )}
                                                    <div
                                                        style={{
                                                            padding: '6px 12px',
                                                            borderRadius: '8px',
                                                            backgroundColor: isSuccess ? '#C8EAD3' : '#FFD1C1',
                                                            fontSize: '13px',
                                                            fontWeight: 600,
                                                            color: '#1A1A1A',
                                                        }}
                                                    >
                                                        {isSuccess ? 'Réussi' : 'Échoué'}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                }

                                return null;
                            })
                        )}
                    </div>
                )}
            </div>
        </>
    );
}
