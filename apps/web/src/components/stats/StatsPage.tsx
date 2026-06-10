import React, { useMemo, useState } from 'react';
import { useAuth } from '@core/contexts/AuthContext';
import { useValidationsHistory, useDailyOverview, useQuests, useCategories } from '@core/hooks/useApi';

// ─── Level system ────────────────────────────────────────────────────────────
// XP needed to reach level n: 300 × n  (progressive ramp-up)
// Total XP to reach level n:  150 × n × (n-1)
function computeLevel(totalPoints: number) {
    let level = 1;
    let xpConsumed = 0;
    while (true) {
        const xpForNext = 300 * level;
        if (xpConsumed + xpForNext > totalPoints) break;
        xpConsumed += xpForNext;
        level++;
    }
    const xpInLevel = totalPoints - xpConsumed;
    const xpNeeded = 300 * level;
    const percent = Math.round((xpInLevel / xpNeeded) * 100);
    return { level, xpInLevel, xpNeeded, xpToNext: xpNeeded - xpInLevel, percent };
}

// ─── Day names ────────────────────────────────────────────────────────────────
const DAY_NAMES = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];

const MONTH_LABELS = ['jan.', 'fév.', 'mars', 'avr.', 'mai', 'juin',
    'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.'];

// ─── Helpers ──────────────────────────────────────────────────────────────────
function isSameDay(a: Date, b: Date) {
    return a.getFullYear() === b.getFullYear()
        && a.getMonth() === b.getMonth()
        && a.getDate() === b.getDate();
}

function toMonthKey(dateStr: string) {
    const d = new Date(dateStr);
    return `${d.getFullYear()}-${d.getMonth()}`;
}

// ─── Component ────────────────────────────────────────────────────────────────
export function StatsPage() {
    const { user } = useAuth();
    const { data: history = [] } = useValidationsHistory(365);
    const { data: dailyOverview } = useDailyOverview();
    const { data: quests = [] } = useQuests();
    const { data: categories = [] } = useCategories();

    const [showScrollHint, setShowScrollHint] = useState(true);

    // ── Level ────────────────────────────────────────────────────────────────
    const levelInfo = useMemo(
        () => computeLevel(user?.total_points ?? 0),
        [user?.total_points]
    );

    // ── XP today ─────────────────────────────────────────────────────────────
    const xpToday = useMemo(() => {
        const today = new Date();
        return history
            .filter(v => isSameDay(new Date(v.date), today))
            .reduce((sum: number, v: any) => sum + (v.points_earned ?? 0), 0);
    }, [history]);

    // ── Objectives today ──────────────────────────────────────────────────────
    const objectivesToday = dailyOverview?.validated_count ?? 0;
    const totalActiveQuests = quests.filter((q: any) => q.is_active).length;

    // ── Streak / bonus ────────────────────────────────────────────────────────
    const streakCurrent = user?.streak_current ?? 0;
    const streakRecord = user?.streak_record ?? 0;
    const bonusActive = streakCurrent >= 3; // Bonus ×1.5 à partir de 3 jours consécutifs

    // ── Monthly chart — last 6 months ─────────────────────────────────────────
    const monthlyData = useMemo(() => {
        const now = new Date();
        const months: { key: string; label: string; month: number; year: number; count: number; isCurrent: boolean }[] = [];

        for (let i = 5; i >= 0; i--) {
            const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
            months.push({
                key: `${d.getFullYear()}-${d.getMonth()}`,
                label: MONTH_LABELS[d.getMonth()],
                month: d.getMonth(),
                year: d.getFullYear(),
                count: 0,
                isCurrent: i === 0,
            });
        }

        history.forEach((v: any) => {
            const key = toMonthKey(v.date);
            const m = months.find(m => m.key === key);
            if (m) m.count++;
        });

        return months;
    }, [history]);

    const maxMonthCount = Math.max(...monthlyData.map(m => m.count), 1);

    // ── Category breakdown ────────────────────────────────────────────────────
    const categoryBreakdown = useMemo(() => {
        const totals: Record<string, { name: string; color: string; count: number }> = {};
        history.forEach((v: any) => {
            const key = v.category_name ?? 'Autre';
            const color = v.category_color ?? '#C8B7E8';
            if (!totals[key]) totals[key] = { name: key, color, count: 0 };
            totals[key].count++;
        });

        const total = history.length || 1;
        return Object.values(totals)
            .sort((a, b) => b.count - a.count)
            .map(c => ({ ...c, pct: Math.round((c.count / total) * 100) }));
    }, [history]);

    // ── Success rate ──────────────────────────────────────────────────────────
    // Count unique quest-days possible vs completed
    const successRate = useMemo(() => {
        if (history.length === 0) return 0;
        // Approximate: count unique (date, quest_id) validated vs days active * daily quests
        const dailyQuests = quests.filter((q: any) => q.is_active && q.frequency === 'Journalier');
        const start = user?.start_date ? new Date(user.start_date) : new Date(Date.now() - 30 * 86400000);
        const daysSinceStart = Math.max(1, Math.floor((Date.now() - start.getTime()) / 86400000));
        const possibleDailyValidations = dailyQuests.length * daysSinceStart;
        const completions = history.length;
        if (possibleDailyValidations === 0) return 100;
        return Math.min(100, Math.round((completions / possibleDailyValidations) * 100));
    }, [history, quests, user?.start_date]);

    // ── Preferred day ─────────────────────────────────────────────────────────
    const preferredDay = useMemo(() => {
        const counts = new Array(7).fill(0);
        history.forEach((v: any) => {
            counts[new Date(v.date).getDay()]++;
        });
        const maxIdx = counts.indexOf(Math.max(...counts));
        return DAY_NAMES[maxIdx];
    }, [history]);

    // ── Preferred category ────────────────────────────────────────────────────
    const preferredCategory = categoryBreakdown[0]?.name ?? '—';

    // ── Member since ──────────────────────────────────────────────────────────
    const memberSince = useMemo(() => {
        const start = user?.start_date;
        if (!start) return '—';
        const d = new Date(start);
        const days = Math.floor((Date.now() - d.getTime()) / 86400000);
        return `${days} jours`;
    }, [user?.start_date]);

    // ── Complete weeks (streak weeks) ─────────────────────────────────────────
    const completeWeeks = useMemo(() => {
        if (history.length === 0) return 0;
        // A complete week = 7 consecutive days with at least one validation
        const days = new Set(history.map((v: any) => v.date?.slice(0, 10)));
        let count = 0;
        const now = new Date();
        for (let w = 0; w < 52; w++) {
            const weekEnd = new Date(now);
            weekEnd.setDate(weekEnd.getDate() - w * 7);
            let allDays = true;
            for (let d = 0; d < 7; d++) {
                const day = new Date(weekEnd);
                day.setDate(day.getDate() - d);
                const key = day.toISOString().slice(0, 10);
                if (!days.has(key)) { allDays = false; break; }
            }
            if (allDays) count++;
            else if (count > 0) break; // stop at first gap
        }
        return count;
    }, [history]);

    // ── Consecutive months ────────────────────────────────────────────────────
    const consecutiveMonths = useMemo(() => {
        const months = new Set(history.map((v: any) => toMonthKey(v.date)));
        let count = 0;
        const now = new Date();
        for (let m = 0; m < 24; m++) {
            const key = `${new Date(now.getFullYear(), now.getMonth() - m, 1).getFullYear()}-${new Date(now.getFullYear(), now.getMonth() - m, 1).getMonth()}`;
            if (months.has(key)) count++;
            else break;
        }
        return count;
    }, [history]);

    // ─────────────────────────────────────────────────────────────────────────

    return (
        <div style={{ maxWidth: '1100px', margin: '0 auto', paddingBottom: '60px' }}>
            {/* ── Title ── */}
            <h1 style={{
                fontFamily: "'Plus Jakarta Sans', 'Agrandir', system-ui, sans-serif",
                fontSize: '28px',
                fontWeight: 800,
                color: '#1A1A1A',
                marginBottom: '28px',
                letterSpacing: '-0.5px',
            }}>
                📈 Statistiques
            </h1>

            {/* ── Row 1 : Progression + Séries ── */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>

                {/* Progression card */}
                <div style={cardStyle}>
                    <SectionTitle icon="☆" label="Progression" />

                    <div style={{ margin: '16px 0 6px' }}>
                        <span style={bigNumberStyle}>{(user?.total_points ?? 0).toLocaleString('fr-FR')}</span>
                        <span style={{ fontSize: '15px', color: '#6B6B6B', marginLeft: '10px' }}>
                            XP · niveau {levelInfo.level} dans {levelInfo.xpToNext} XP
                        </span>
                    </div>

                    {/* Progress bar */}
                    <div style={{ background: '#F0F0F0', borderRadius: '10px', height: '10px', overflow: 'hidden', marginBottom: '6px' }}>
                        <div style={{
                            width: `${levelInfo.percent}%`,
                            height: '100%',
                            background: 'linear-gradient(90deg, #79BEEE 0%, #5FA8DC 100%)',
                            borderRadius: '10px',
                            transition: 'width 0.5s ease',
                        }} />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#6B6B6B', marginBottom: '16px' }}>
                        <span>{levelInfo.percent}% vers le niveau suivant</span>
                        <span>Niv. {levelInfo.level} → {levelInfo.level + 1}</span>
                    </div>

                    {/* Badges */}
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                        {xpToday > 0 && (
                            <Pill color="#C8EAD3" textColor="#5BA073" icon="🔥" label={`+${xpToday} XP aujourd'hui`} />
                        )}
                        {bonusActive && (
                            <Pill color="#FFE8D0" textColor="#D87A3E" icon="⚡" label="Bonus ×1.5 actif" />
                        )}
                        {totalActiveQuests > 0 && (
                            <Pill color="#E8DFFA" textColor="#8F72C4" icon="✓" label={`${objectivesToday} / ${totalActiveQuests} objectifs`} />
                        )}
                    </div>
                </div>

                {/* Séries card */}
                <div style={cardStyle}>
                    <SectionTitle icon="🔥" label="Séries" color="#E8603C" />
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: '1fr 1fr',
                        gap: '12px',
                        marginTop: '16px',
                    }}>
                        <SerieCell value={streakCurrent} label="jours consécutifs" color="#E8603C" />
                        <SerieCell value={completeWeeks} label="semaines complètes" color="#79BEEE" />
                        <SerieCell value={consecutiveMonths} label="mois consécutifs" />
                        <SerieCell value={`${successRate}%`} label="taux de réussite" color="#D8A857" />
                    </div>
                </div>
            </div>

            {/* ── Row 2 : Chart + En détail ── */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>

                {/* Bar chart */}
                <div style={{ ...cardStyle, position: 'relative' }}>
                    <SectionTitle icon="📊" label="Objectifs réussis par mois" color="#5B9ACA" />

                    <div style={{ display: 'flex', alignItems: 'flex-end', gap: '8px', height: '160px', marginTop: '24px', marginBottom: '8px' }}>
                        {monthlyData.map(m => {
                            const heightPct = maxMonthCount > 0 ? (m.count / maxMonthCount) * 100 : 0;
                            return (
                                <div key={m.key} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', justifyContent: 'flex-end' }}>
                                    <span style={{ fontSize: '11px', color: '#6B6B6B', marginBottom: '4px', fontWeight: 600 }}>
                                        {m.count > 0 ? m.count : ''}
                                    </span>
                                    <div style={{
                                        width: '100%',
                                        height: `${heightPct}%`,
                                        minHeight: m.count > 0 ? '6px' : '0px',
                                        background: m.isCurrent ? '#79BEEE' : '#C8EAD3',
                                        borderRadius: '6px 6px 0 0',
                                        transition: 'height 0.4s ease',
                                    }} />
                                </div>
                            );
                        })}
                    </div>

                    {/* Month labels */}
                    <div style={{ display: 'flex', gap: '8px' }}>
                        {monthlyData.map(m => (
                            <div key={m.key} style={{ flex: 1, textAlign: 'center', fontSize: '12px', color: m.isCurrent ? '#5B9ACA' : '#999', fontWeight: m.isCurrent ? 600 : 400 }}>
                                {m.label}{m.isCurrent ? ' •' : ''}
                            </div>
                        ))}
                    </div>

                    {/* Scroll hint */}
                    {showScrollHint && (
                        <button
                            onClick={() => setShowScrollHint(false)}
                            style={{
                                position: 'absolute', bottom: '16px', left: '50%', transform: 'translateX(-50%)',
                                background: 'white', border: '1.5px solid #E5E5E5', borderRadius: '50%',
                                width: '36px', height: '36px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                boxShadow: '0 2px 8px rgba(0,0,0,0.08)', color: '#6B6B6B', fontSize: '16px',
                            }}
                            title="Masquer"
                        >
                            ↓
                        </button>
                    )}
                </div>

                {/* En détail */}
                <div style={cardStyle}>
                    <SectionTitle icon="≡" label="En détail" />
                    <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                        <DetailRow icon="🎯" iconBg="#DEF0FC" label="Objectifs créés" value={quests.length} />
                        <DetailRow icon="✓" iconBg="#E0F5E8" iconColor="#5BA073" label="Taux de réussite" value={`${successRate}%`} />
                        <DetailRow icon="🔥" iconBg="#FFE8D0" label="Meilleure série" value={`${streakRecord} jours`} />
                        <DetailRow icon="🏅" iconBg="#E8DFFA" label="Succès débloqués" value={computeAchievements(user, history.length, streakRecord)} />
                        <DetailRow icon="📅" iconBg="#E0F5E8" iconColor="#5BA073" label="Jour préféré" value={preferredDay} />
                        <DetailRow icon="☆" iconBg="#E8DFFA" label="Catégorie préférée" value={preferredCategory} />
                        <DetailRow icon="🕐" iconBg="#FFE8D0" label="Membre depuis" value={memberSince} />
                    </div>
                </div>
            </div>

            {/* ── Row 3 : Répartition par catégorie ── */}
            <div style={cardStyle}>
                <SectionTitle icon="🏷" label="Répartition par catégorie" color="#5B9ACA" />

                {categoryBreakdown.length === 0 ? (
                    <p style={{ color: '#999', marginTop: '16px', fontSize: '14px' }}>
                        Aucune validation enregistrée pour le moment.
                    </p>
                ) : (
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: '1fr 1fr',
                        gap: '14px 40px',
                        marginTop: '20px',
                    }}>
                        {categoryBreakdown.map(cat => (
                            <CategoryRow key={cat.name} name={cat.name} pct={cat.pct} color={cat.color} />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

// ─── Achievements helper ──────────────────────────────────────────────────────
function computeAchievements(user: any, totalValidations: number, streakRecord: number): string {
    let unlocked = 0;
    const total = 60;
    // Points milestones
    const points = user?.total_points ?? 0;
    if (points >= 100) unlocked++;
    if (points >= 500) unlocked++;
    if (points >= 1000) unlocked++;
    if (points >= 5000) unlocked++;
    if (points >= 10000) unlocked++;
    // Validation milestones
    if (totalValidations >= 1) unlocked++;
    if (totalValidations >= 10) unlocked++;
    if (totalValidations >= 50) unlocked++;
    if (totalValidations >= 100) unlocked++;
    if (totalValidations >= 500) unlocked++;
    // Streak milestones
    if (streakRecord >= 3) unlocked++;
    if (streakRecord >= 7) unlocked++;
    if (streakRecord >= 14) unlocked++;
    if (streakRecord >= 30) unlocked++;
    if (streakRecord >= 100) unlocked++;
    return `${Math.min(unlocked, total)} / ${total}`;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function SectionTitle({ icon, label, color = '#8F72C4' }: { icon: string; label: string; color?: string }) {
    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ color, fontSize: '15px' }}>{icon}</span>
            <span style={{ fontWeight: 600, fontSize: '15px', color: '#1A1A1A' }}>{label}</span>
        </div>
    );
}

function Pill({ color, textColor, icon, label }: { color: string; textColor: string; icon: string; label: string }) {
    return (
        <div style={{
            background: color, color: textColor,
            padding: '5px 12px', borderRadius: '20px',
            fontSize: '12px', fontWeight: 600,
            display: 'flex', alignItems: 'center', gap: '5px',
        }}>
            <span>{icon}</span>
            <span>{label}</span>
        </div>
    );
}

function SerieCell({ value, label, color = '#1A1A1A' }: { value: string | number; label: string; color?: string }) {
    return (
        <div style={{
            background: '#FAFAFA', borderRadius: '12px',
            padding: '16px', textAlign: 'center',
        }}>
            <div style={{
                fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
                fontSize: '28px', fontWeight: 800,
                color, lineHeight: 1.1, marginBottom: '4px',
            }}>
                {value}
            </div>
            <div style={{ fontSize: '12px', color: '#6B6B6B' }}>{label}</div>
        </div>
    );
}

function DetailRow({ icon, iconBg, iconColor = '#5B9ACA', label, value }: {
    icon: string; iconBg: string; iconColor?: string;
    label: string; value: string | number;
}) {
    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
                width: '34px', height: '34px', borderRadius: '10px',
                background: iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '16px', flexShrink: 0,
            }}>
                {icon}
            </div>
            <span style={{ flex: 1, fontSize: '14px', color: '#6B6B6B' }}>{label}</span>
            <span style={{ fontWeight: 700, fontSize: '15px', color: '#1A1A1A' }}>{value}</span>
        </div>
    );
}

function CategoryRow({ name, pct, color }: { name: string; pct: number; color: string }) {
    // Ensure decent contrast: lighten the color for background
    const dotColor = color && color.length === 7 ? color : '#C8B7E8';
    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
                width: '10px', height: '10px', borderRadius: '50%',
                background: dotColor, flexShrink: 0,
            }} />
            <span style={{ flex: 1, fontSize: '14px', color: '#1A1A1A', minWidth: '120px' }}>{name}</span>
            {/* Progress bar */}
            <div style={{ flex: 1, background: '#F0F0F0', borderRadius: '999px', height: '8px', overflow: 'hidden', minWidth: '60px' }}>
                <div style={{
                    width: `${pct}%`, height: '100%',
                    background: dotColor, borderRadius: '999px',
                    transition: 'width 0.4s ease',
                }} />
            </div>
            <span style={{ fontSize: '14px', fontWeight: 600, color: '#1A1A1A', minWidth: '36px', textAlign: 'right' }}>
                {pct}%
            </span>
        </div>
    );
}

// ─── Shared styles ────────────────────────────────────────────────────────────
const cardStyle: React.CSSProperties = {
    background: 'white',
    borderRadius: '20px',
    padding: '24px',
    boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
};

const bigNumberStyle: React.CSSProperties = {
    fontFamily: "'Plus Jakarta Sans', 'Agrandir', system-ui, sans-serif",
    fontSize: '36px',
    fontWeight: 800,
    color: '#1A1A1A',
    letterSpacing: '-0.5px',
};
