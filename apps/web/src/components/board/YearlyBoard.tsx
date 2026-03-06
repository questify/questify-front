import React, { useMemo, useState } from 'react';
import { useYearlyBoardData } from '@core/hooks/useApi';

const MONTHS_FR = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'];

type DayStatus = 'completed' | 'partial' | 'missed' | 'future' | 'none';

interface DayData {
    date: string;
    status: DayStatus;
    validations: number;
    totalQuests: number;
    mood?: number;
}

function getCellColor(status: DayStatus): string {
    switch (status) {
        case 'completed': return '#C8EAD3';
        case 'partial':   return '#FFF4C1';
        case 'missed':    return '#FFD1C1';
        case 'future':    return '#F0F0F0';
        default:          return '#EFEFEF';
    }
}

function getCellBorder(date: string, today: string): string {
    return date === today ? '2px solid #9B7DC8' : '1px solid rgba(0,0,0,0.06)';
}

function moodEmoji(value: number): string {
    const map: Record<number, string> = { 5: '😍', 4: '😊', 3: '😐', 2: '😔', 1: '😢' };
    return map[value] || '';
}

export function YearlyBoard() {
    const { data, isLoading, error } = useYearlyBoardData();
    const [tooltip, setTooltip] = useState<{ x: number; y: number; day: DayData } | null>(null);

    const { weeks, monthLabels, today } = useMemo(() => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayStr = today.toISOString().split('T')[0];

        // Build validation map
        const validationsByDate: Record<string, number> = {};
        if (data?.validations) {
            data.validations.forEach((v: any) => {
                const d = (v.date || v.created_at || '').split('T')[0];
                if (d) validationsByDate[d] = (validationsByDate[d] || 0) + 1;
            });
        }

        // Build mood map
        const moodsByDate: Record<string, number> = {};
        if (data?.moods) {
            data.moods.forEach((m: any) => {
                const d = (m.date || '').split('T')[0];
                if (d) moodsByDate[d] = m.mood_value;
            });
        }

        // Count active daily quests as reference for "total"
        const dailyQuestCount = data?.quests?.filter((q: any) => q.is_active && q.frequency === 'daily').length || 0;
        const totalRef = Math.max(dailyQuestCount, 1);

        // Start from 365 days ago (Monday of that week)
        const startDate = new Date(today);
        startDate.setDate(startDate.getDate() - 364);
        // Rewind to the Monday of that week
        const dayOfWeek = startDate.getDay(); // 0=Sun, 1=Mon...
        const daysBack = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
        startDate.setDate(startDate.getDate() - daysBack);

        const weeks: DayData[][] = [];
        const monthLabels: { month: number; colIndex: number }[] = [];

        let currentDate = new Date(startDate);
        let colIndex = 0;

        while (currentDate <= today) {
            const week: DayData[] = [];
            const weekStart = new Date(currentDate);

            for (let d = 0; d < 7; d++) {
                const dateStr = currentDate.toISOString().split('T')[0];
                const isFuture = currentDate > today;

                let status: DayStatus = 'none';
                if (!isFuture) {
                    const count = validationsByDate[dateStr] || 0;
                    if (count === 0) {
                        status = 'missed';
                    } else if (count >= totalRef) {
                        status = 'completed';
                    } else {
                        status = 'partial';
                    }
                } else {
                    status = 'future';
                }

                week.push({
                    date: dateStr,
                    status,
                    validations: validationsByDate[dateStr] || 0,
                    totalQuests: totalRef,
                    mood: moodsByDate[dateStr],
                });

                currentDate.setDate(currentDate.getDate() + 1);
            }

            // Track month label: if Monday of this week is a new month
            const mondayMonth = weekStart.getMonth();
            const prevWeekMonday = new Date(weekStart);
            prevWeekMonday.setDate(prevWeekMonday.getDate() - 7);
            if (colIndex === 0 || prevWeekMonday.getMonth() !== mondayMonth) {
                monthLabels.push({ month: mondayMonth, colIndex });
            }

            weeks.push(week);
            colIndex++;
        }

        return { weeks, monthLabels, today: todayStr };
    }, [data]);

    if (isLoading) {
        return (
            <div style={{ textAlign: 'center', padding: '40px', color: '#6B6B6B' }}>
                Chargement du tableau annuel...
            </div>
        );
    }

    if (error) {
        return (
            <div style={{ textAlign: 'center', padding: '20px', color: '#FF6B6B' }}>
                Impossible de charger les données annuelles.
            </div>
        );
    }

    const CELL_SIZE = 13;
    const CELL_GAP = 3;
    const DAY_LABELS = ['Lun', '', 'Mer', '', 'Ven', '', 'Dim'];

    return (
        <div style={{ overflowX: 'auto' }}>
            {/* Month labels */}
            <div style={{
                display: 'flex',
                paddingLeft: '32px',
                marginBottom: '4px',
                position: 'relative',
                height: '18px',
            }}>
                {monthLabels.map(({ month, colIndex }) => (
                    <span
                        key={`${month}-${colIndex}`}
                        style={{
                            position: 'absolute',
                            left: `${32 + colIndex * (CELL_SIZE + CELL_GAP)}px`,
                            fontSize: '11px',
                            color: '#6B6B6B',
                            fontWeight: 500,
                            whiteSpace: 'nowrap',
                        }}
                    >
                        {MONTHS_FR[month]}
                    </span>
                ))}
            </div>

            {/* Grid */}
            <div style={{ display: 'flex', gap: `${CELL_GAP}px` }}>
                {/* Day labels column */}
                <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: `${CELL_GAP}px`,
                    width: '28px',
                    flexShrink: 0,
                }}>
                    {DAY_LABELS.map((label, i) => (
                        <div
                            key={i}
                            style={{
                                height: `${CELL_SIZE}px`,
                                fontSize: '9px',
                                color: '#9B9B9B',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'flex-end',
                                paddingRight: '4px',
                            }}
                        >
                            {label}
                        </div>
                    ))}
                </div>

                {/* Weeks */}
                {weeks.map((week, wi) => (
                    <div
                        key={wi}
                        style={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: `${CELL_GAP}px`,
                            flexShrink: 0,
                        }}
                    >
                        {week.map((day, di) => (
                            <div
                                key={di}
                                style={{
                                    width: `${CELL_SIZE}px`,
                                    height: `${CELL_SIZE}px`,
                                    borderRadius: '2px',
                                    backgroundColor: getCellColor(day.status),
                                    border: getCellBorder(day.date, today),
                                    cursor: day.status !== 'future' && day.status !== 'none' ? 'pointer' : 'default',
                                    position: 'relative',
                                }}
                                onMouseEnter={(e) => {
                                    if (day.status === 'future') return;
                                    const rect = (e.target as HTMLElement).getBoundingClientRect();
                                    setTooltip({ x: rect.left, y: rect.top, day });
                                }}
                                onMouseLeave={() => setTooltip(null)}
                            />
                        ))}
                    </div>
                ))}
            </div>

            {/* Legend */}
            <div style={{
                display: 'flex',
                gap: '16px',
                marginTop: '16px',
                fontSize: '11px',
                color: '#6B6B6B',
                flexWrap: 'wrap',
                alignItems: 'center',
            }}>
                <span>Moins</span>
                {(['missed', 'partial', 'completed'] as DayStatus[]).map(s => (
                    <div key={s} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <div style={{
                            width: '12px',
                            height: '12px',
                            borderRadius: '2px',
                            backgroundColor: getCellColor(s),
                            border: '1px solid rgba(0,0,0,0.06)',
                        }} />
                        <span>
                            {s === 'missed' ? 'Aucune quête' : s === 'partial' ? 'Partiel' : 'Complet'}
                        </span>
                    </div>
                ))}
                <span>Plus</span>
            </div>

            {/* Tooltip */}
            {tooltip && (
                <div
                    style={{
                        position: 'fixed',
                        left: `${tooltip.x + 18}px`,
                        top: `${tooltip.y - 8}px`,
                        backgroundColor: '#1A1A1A',
                        color: 'white',
                        padding: '8px 12px',
                        borderRadius: '8px',
                        fontSize: '12px',
                        pointerEvents: 'none',
                        zIndex: 9999,
                        whiteSpace: 'nowrap',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                    }}
                >
                    <div style={{ fontWeight: 600, marginBottom: '2px' }}>
                        {new Date(tooltip.day.date + 'T12:00:00').toLocaleDateString('fr-FR', {
                            weekday: 'long',
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric',
                        })}
                    </div>
                    <div>{tooltip.day.validations} / {tooltip.day.totalQuests} quêtes</div>
                    {tooltip.day.mood && (
                        <div>Humeur : {moodEmoji(tooltip.day.mood)}</div>
                    )}
                </div>
            )}
        </div>
    );
}
