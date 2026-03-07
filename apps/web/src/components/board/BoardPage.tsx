import React, { useState } from 'react';
import { useYearlyBoardData } from '@core/hooks/useApi';
import { useAuth } from '@core/contexts/AuthContext';
import { YearlyBoard } from './YearlyBoard';

interface DayCell {
    date: string;
    dayName: string;
    dayNumber: number;
    status: 'completed' | 'partial' | 'missed' | 'today' | 'future';
    isToday: boolean;
    mood?: string;
    validations?: number;
    totalQuests?: number;
    details?: string;
}

// Helper function to convert mood value to emoji
function moodValueToEmoji(moodValue: number | null): string {
    if (!moodValue) return '';
    const moodMap: Record<number, string> = {
        5: '😍',
        4: '😊',
        3: '😐',
        2: '😔',
        1: '😢',
    };
    return moodMap[moodValue] || '';
}

export function BoardPage() {
    const { user } = useAuth();
    const { data, isLoading, error } = useYearlyBoardData();
    const [currentWeekOffset, setCurrentWeekOffset] = useState(0); // 0 = current week, -1 = last week, +1 = next week

    // Get Monday of the week for a given date
    const getWeekStart = (date: Date): Date => {
        const d = new Date(date);
        const day = d.getDay();
        const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
        return new Date(d.setDate(diff));
    };

    // Get the week to display based on offset
    const getCurrentWeek = (): Date => {
        const today = new Date();
        const monday = getWeekStart(today);
        monday.setDate(monday.getDate() + (currentWeekOffset * 7));
        return monday;
    };

    // Generate 7 days for the current week
    const generateWeekDays = (): DayCell[] => {
        const days: DayCell[] = [];
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const weekStart = getCurrentWeek();

        const dayNames = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];

        // Get active quests
        const activeQuests = data?.quests?.filter((q: any) => q.is_active) || [];
        const dailyQuests = activeQuests.filter((q: any) => q.frequency === 'daily');

        // Build a map of validations by date
        const validationsByDate: Record<string, any[]> = {};
        if (data?.validations) {
            data.validations.forEach((validation: any) => {
                const date = (validation.date || validation.created_at).split('T')[0];
                if (!validationsByDate[date]) {
                    validationsByDate[date] = [];
                }
                validationsByDate[date].push(validation);
            });
        }

        // Build a map of moods by date
        const moodsByDate: Record<string, any> = {};
        if (data?.moods) {
            data.moods.forEach((mood: any) => {
                const date = mood.date.split('T')[0];
                moodsByDate[date] = mood;
            });
        }

        for (let i = 0; i < 7; i++) {
            const currentDate = new Date(weekStart);
            currentDate.setDate(weekStart.getDate() + i);
            const dateStr = currentDate.toISOString().split('T')[0];
            const dayValidations = validationsByDate[dateStr] || [];
            const dayMood = moodsByDate[dateStr];

            const isFuture = currentDate > today;
            const isToday = currentDate.getTime() === today.getTime();

            let status: DayCell['status'];
            let mood: string | undefined;
            let validationCount = dayValidations.length;
            let totalQuests = dailyQuests.length;
            let details: string | undefined;

            if (isFuture) {
                status = 'future';
            } else if (isToday) {
                // Today always stays 'today' for purple highlight
                status = 'today';
            } else {
                // Past day
                if (validationCount === totalQuests && totalQuests > 0) {
                    status = 'completed';
                } else if (validationCount > 0) {
                    status = 'partial';
                } else {
                    status = 'missed';
                }
            }

            // Add mood emoji
            if (dayMood) {
                mood = moodValueToEmoji(dayMood.mood_value);
            }

            // Build details string
            if (!isFuture) {
                details = `${validationCount}/${totalQuests} quêtes complétées`;
                if (dayMood) {
                    const moodLabels: Record<number, string> = {
                        5: 'Excellent',
                        4: 'Bien',
                        3: 'Moyen',
                        2: 'Difficile',
                        1: 'Très difficile',
                    };
                    details += ` • Humeur: ${moodLabels[dayMood.mood_value]}`;
                }
            }

            days.push({
                date: dateStr,
                dayName: dayNames[i],
                dayNumber: currentDate.getDate(),
                status,
                isToday,
                mood,
                validations: validationCount,
                totalQuests,
                details,
            });
        }

        return days;
    };

    // Calculate week stats
    const getWeekStats = (days: DayCell[]) => {
        const pastDays = days.filter(d => d.status !== 'future');
        // Count today as completed if all quests done, partial if some done
        const completedDays = pastDays.filter(d => {
            if (d.status === 'completed') return true;
            if (d.isToday && d.validations === d.totalQuests && (d.totalQuests || 0) > 0) return true;
            return false;
        }).length;
        const totalValidations = pastDays.reduce((sum, d) => sum + (d.validations || 0), 0);
        const totalPossible = pastDays.reduce((sum, d) => sum + (d.totalQuests || 0), 0);
        const successRate = totalPossible > 0 ? Math.round((totalValidations / totalPossible) * 100) : 0;

        // Average mood
        const moodValues = pastDays.filter(d => d.mood).length;

        return {
            completedDays,
            totalDays: pastDays.length,
            totalValidations,
            successRate,
            moodDays: moodValues,
        };
    };

    // Week navigation
    const goToPreviousWeek = () => setCurrentWeekOffset(currentWeekOffset - 1);
    const goToNextWeek = () => setCurrentWeekOffset(currentWeekOffset + 1);
    const goToCurrentWeek = () => setCurrentWeekOffset(0);

    if (isLoading) {
        return (
            <div style={{
                minHeight: '100vh',
                padding: '40px',
                backgroundColor: '#FAFAFA'
            }}>
                <h1 style={{ fontSize: '36px', marginBottom: '8px' }}>Le Tableau Hebdomadaire 📅</h1>
                <p style={{ color: '#6B6B6B', marginBottom: '40px' }}>
                    Visualise ta progression jour par jour
                </p>
                <div className="card" style={{ textAlign: 'center', padding: '40px' }}>
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"
                         style={{
                             width: '48px',
                             height: '48px',
                             border: '2px solid transparent',
                             borderBottomColor: '#C8B7E8',
                             borderRadius: '50%',
                             animation: 'spin 1s linear infinite',
                             margin: '0 auto 16px'
                         }}></div>
                    <p style={{ color: '#6B6B6B' }}>Chargement...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div style={{
                minHeight: '100vh',
                padding: '40px',
                backgroundColor: '#FAFAFA'
            }}>
                <h1 style={{ fontSize: '36px', marginBottom: '8px' }}>Le Tableau Hebdomadaire 📅</h1>
                <p style={{ color: '#6B6B6B', marginBottom: '40px' }}>
                    Visualise ta progression jour par jour
                </p>
                <div className="card" style={{ textAlign: 'center', padding: '40px' }}>
                    <p style={{ color: '#FF6B6B' }}>Erreur lors du chargement des données</p>
                </div>
            </div>
        );
    }

    const days = generateWeekDays();
    const stats = getWeekStats(days);
    const weekStart = getCurrentWeek();
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);

    const formatDate = (date: Date) => {
        return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' });
    };

    return (
        <div style={{
            minHeight: '100vh',
            padding: '40px',
            backgroundColor: '#FAFAFA'
        }}>
            <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
                <h1 style={{ fontSize: '36px', marginBottom: '8px' }}>Le Plateau 📅</h1>
                <p style={{ color: '#6B6B6B', marginBottom: '40px' }}>
                    Visualise ta progression jour par jour
                </p>

                {/* Week Navigation */}
                <div className="card" style={{ marginBottom: '20px' }}>
                    <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                    }}>
                        <button
                            onClick={goToPreviousWeek}
                            style={{
                                padding: '12px 24px',
                                borderRadius: '8px',
                                border: '2px solid #E5E5E5',
                                backgroundColor: 'white',
                                color: '#1A1A1A',
                                fontWeight: 600,
                                cursor: 'pointer',
                                fontSize: '16px',
                            }}
                        >
                            ← Semaine précédente
                        </button>

                        <div style={{ textAlign: 'center' }}>
                            <h2 style={{ fontSize: '24px', marginBottom: '4px' }}>
                                {formatDate(weekStart)} - {formatDate(weekEnd)}
                            </h2>
                            {currentWeekOffset !== 0 && (
                                <button
                                    onClick={goToCurrentWeek}
                                    style={{
                                        padding: '6px 16px',
                                        borderRadius: '20px',
                                        border: 'none',
                                        backgroundColor: '#C8B7E8',
                                        color: 'white',
                                        fontWeight: 600,
                                        cursor: 'pointer',
                                        fontSize: '12px',
                                        marginTop: '8px',
                                    }}
                                >
                                    Retour à cette semaine
                                </button>
                            )}
                        </div>

                        <button
                            onClick={goToNextWeek}
                            disabled={currentWeekOffset >= 0}
                            style={{
                                padding: '12px 24px',
                                borderRadius: '8px',
                                border: '2px solid #E5E5E5',
                                backgroundColor: currentWeekOffset >= 0 ? '#F0F0F0' : 'white',
                                color: currentWeekOffset >= 0 ? '#AAAAAA' : '#1A1A1A',
                                fontWeight: 600,
                                cursor: currentWeekOffset >= 0 ? 'not-allowed' : 'pointer',
                                fontSize: '16px',
                            }}
                        >
                            Semaine suivante →
                        </button>
                    </div>
                </div>

                {/* Days Grid */}
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(7, 1fr)',
                    gap: '16px',
                    marginBottom: '30px',
                }}>
                    {days.map((day) => (
                        <div
                            key={day.date}
                            className="card"
                            style={{
                                padding: '24px',
                                textAlign: 'center',
                                backgroundColor:
                                    day.isToday ? '#C8B7E8' :
                                    day.status === 'completed' ? '#C8EAD3' :
                                    day.status === 'partial' ? '#FFF4C1' :
                                    day.status === 'missed' ? '#FFD1C1' :
                                    '#F9FAFB',
                                border: day.isToday ? '3px solid #9B7DC8' : undefined,
                                position: 'relative',
                                minHeight: '180px',
                                display: 'flex',
                                flexDirection: 'column',
                                justifyContent: 'space-between',
                            }}
                            title={day.details}
                        >
                            <div>
                                <div style={{
                                    fontSize: '14px',
                                    fontWeight: 600,
                                    color: day.isToday ? '#5C3D8A' : '#6B6B6B',
                                    marginBottom: '8px',
                                }}>
                                    {day.dayName}
                                </div>
                                <div style={{
                                    fontSize: '32px',
                                    fontWeight: 700,
                                    marginBottom: '12px',
                                    color: day.isToday ? '#3D2060' : '#1A1A1A',
                                }}>
                                    {day.dayNumber}
                                </div>
                            </div>

                            {day.mood && (
                                <div style={{ fontSize: '32px', marginBottom: '8px' }}>
                                    {day.mood}
                                </div>
                            )}

                            {day.status !== 'future' && (
                                <div style={{
                                    fontSize: '14px',
                                    fontWeight: 600,
                                    marginTop: 'auto',
                                    color: day.isToday ? '#5C3D8A' : '#1A1A1A',
                                }}>
                                    {day.validations}/{day.totalQuests}
                                    <div style={{ fontSize: '11px', fontWeight: 400, color: day.isToday ? '#7B5CAA' : '#6B6B6B', marginTop: '4px' }}>
                                        quêtes
                                    </div>
                                </div>
                            )}

                            {day.isToday && (
                                <div style={{
                                    position: 'absolute',
                                    top: '8px',
                                    right: '8px',
                                    backgroundColor: '#9B7DC8',
                                    color: 'white',
                                    padding: '4px 8px',
                                    borderRadius: '4px',
                                    fontSize: '10px',
                                    fontWeight: 700,
                                }}>
                                    AUJOURD'HUI
                                </div>
                            )}
                        </div>
                    ))}
                </div>

                {/* Week Stats */}
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(4, 1fr)',
                    gap: '20px',
                    marginBottom: '30px',
                }}>
                    <div className="stat-card">
                        <h3>{stats.completedDays}/{stats.totalDays}</h3>
                        <p style={{ color: '#6B6B6B' }}>Jours complétés ✅</p>
                    </div>
                    <div className="stat-card">
                        <h3>{stats.totalValidations}</h3>
                        <p style={{ color: '#6B6B6B' }}>Validations totales 🎯</p>
                    </div>
                    <div className="stat-card">
                        <h3>{stats.successRate}%</h3>
                        <p style={{ color: '#6B6B6B' }}>Taux de réussite 📊</p>
                    </div>
                    <div className="stat-card">
                        <h3>{stats.moodDays}/{stats.totalDays}</h3>
                        <p style={{ color: '#6B6B6B' }}>Humeurs enregistrées 😊</p>
                    </div>
                </div>

                {/* Yearly Board */}
                <div className="card" style={{ marginBottom: '30px' }}>
                    <h3 style={{ marginBottom: '16px' }}>Vue annuelle 📊</h3>
                    <YearlyBoard />
                </div>

                {/* Legend */}
                <div className="card">
                    <h3 style={{ marginBottom: '16px' }}>Légende</h3>
                    <div style={{
                        display: 'flex',
                        gap: '24px',
                        fontSize: '13px',
                        flexWrap: 'wrap',
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <div style={{
                                width: '24px',
                                height: '24px',
                                background: '#C8EAD3',
                                borderRadius: '4px',
                            }} />
                            <span>Jour complet (toutes les quêtes)</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <div style={{
                                width: '24px',
                                height: '24px',
                                background: '#FFF4C1',
                                borderRadius: '4px',
                            }} />
                            <span>Jour partiel (quelques quêtes)</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <div style={{
                                width: '24px',
                                height: '24px',
                                background: '#C8B7E8',
                                borderRadius: '4px',
                                border: '3px solid #9B7DC8',
                            }} />
                            <span>Aujourd'hui</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <div style={{
                                width: '24px',
                                height: '24px',
                                background: '#FFD1C1',
                                borderRadius: '4px',
                            }} />
                            <span>Jour raté</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <div style={{
                                width: '24px',
                                height: '24px',
                                background: '#F9FAFB',
                                borderRadius: '4px',
                            }} />
                            <span>À venir</span>
                        </div>
                    </div>

                    <div style={{
                        marginTop: '24px',
                        padding: '16px',
                        background: '#F9FAFB',
                        borderRadius: '12px',
                    }}>
                        <div style={{ fontSize: '14px', fontWeight: 600, marginBottom: '8px', color: '#6B6B6B' }}>
                            💡 Astuce
                        </div>
                        <div style={{ fontSize: '13px', color: '#6B6B6B' }}>
                            Les emojis affichent ton humeur du jour si tu l'as renseignée. Survole une case pour voir plus de détails !
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
