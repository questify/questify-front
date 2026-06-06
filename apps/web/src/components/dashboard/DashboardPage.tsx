import React, {useState} from 'react';
import {useAuth} from '@core/contexts/AuthContext';
import {useWeeklyOverview, useDailyOverview} from '@core/hooks/useApi';
import {DailyQuests} from './DailyQuests';
import {StatisticsTab} from './StatisticsTab';
import {getAvatarUrl, getAvatarBg, isAvatarImage, isSvgKitAvatar} from '@core/utils/avatar';

interface DashboardPageProps {
    onNavigateTo?: (page: string) => void;
}

// Circular SVG progress ring
function ProgressRing({ pct, caption }: { pct: number; caption: string }) {
    const r = 22, c = 2 * Math.PI * r;
    const offset = c * (1 - pct / 100);
    return (
        <div style={{
            background: 'rgba(255,255,255,0.18)',
            borderRadius: '16px',
            padding: '12px 20px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
        }}>
            <svg width="56" height="56" viewBox="0 0 56 56">
                <circle cx="28" cy="28" r={r} fill="none" stroke="rgba(255,255,255,0.35)" strokeWidth="6" />
                <circle cx="28" cy="28" r={r} fill="none" stroke="#fff" strokeWidth="6" strokeLinecap="round"
                    strokeDasharray={c} strokeDashoffset={offset} transform="rotate(-90 28 28)" />
                <text x="28" y="33" textAnchor="middle" fontSize="13" fontWeight="800" fill="#fff"
                    fontFamily="'Plus Jakarta Sans',system-ui,sans-serif">{pct}%</text>
            </svg>
            <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.9)', fontWeight: 600, maxWidth: '70px', lineHeight: 1.3 }}>
                {caption}
            </div>
        </div>
    );
}

function HeroStat({ icon, value, label }: { icon: string; value: string; label: string }) {
    return (
        <div style={{
            background: 'rgba(255,255,255,0.18)',
            borderRadius: '16px',
            padding: '14px 20px',
            minWidth: '90px',
            textAlign: 'center',
        }}>
            <div style={{ fontSize: '20px', marginBottom: '2px' }}>{icon}</div>
            <div style={{ fontFamily: "'Plus Jakarta Sans',system-ui,sans-serif", fontWeight: 800, fontSize: '22px', lineHeight: 1.1, color: '#fff' }}>{value}</div>
            <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.85)', fontWeight: 600 }}>{label}</div>
        </div>
    );
}

export function DashboardPage({ onNavigateTo }: DashboardPageProps) {
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

    // Avatar rendering
    const avatarUrl = user?.avatar_url;
    const avatarIsImage = isAvatarImage(avatarUrl);
    const avatarIsSvgKit = isSvgKitAvatar(avatarUrl);
    const avatarEmoji = !avatarIsImage && !avatarIsSvgKit ? getAvatarUrl(avatarUrl) : null;
    const avatarBg = getAvatarBg(avatarUrl);
    const initials = user?.name
        ? user.name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)
        : 'U';

    return (
        <div id="dashboard" className="page active">

            {/* ── Gradient hero band ── */}
            <div style={{
                background: 'linear-gradient(120deg, #C8B7E8 0%, #A78BD0 55%, #9B7DC8 100%)',
                borderRadius: '24px',
                padding: '28px 32px',
                marginBottom: '28px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '24px',
                flexWrap: 'wrap',
                boxShadow: '0 10px 30px rgba(155,125,200,0.30)',
            }}>
                {/* Left: avatar + greeting */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '18px' }}>
                    {avatarIsSvgKit ? (
                        <img
                            src={getAvatarUrl(avatarUrl)!}
                            alt="avatar"
                            style={{ width: '64px', height: '64px', borderRadius: '20px', boxShadow: '0 4px 14px rgba(0,0,0,.15)' }}
                        />
                    ) : avatarIsImage ? (
                        <img
                            src={getAvatarUrl(avatarUrl)!}
                            alt="avatar"
                            style={{ width: '64px', height: '64px', borderRadius: '20px', objectFit: 'cover', boxShadow: '0 4px 14px rgba(0,0,0,.15)' }}
                        />
                    ) : avatarEmoji && avatarEmoji !== '👤' ? (
                        <div style={{
                            width: '64px', height: '64px', borderRadius: '20px',
                            background: avatarBg || 'rgba(255,255,255,0.3)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: '32px', boxShadow: '0 4px 14px rgba(0,0,0,.15)',
                        }}>{avatarEmoji}</div>
                    ) : (
                        <div style={{
                            width: '64px', height: '64px', borderRadius: '20px',
                            background: 'rgba(255,255,255,0.25)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontWeight: 800, fontSize: '24px', color: '#fff',
                            boxShadow: '0 4px 14px rgba(0,0,0,.15)',
                        }}>{initials}</div>
                    )}
                    <div>
                        <h1 style={{ fontSize: '30px', color: '#fff', margin: 0, marginBottom: '4px' }}>
                            Bonjour {user?.name} 👋
                        </h1>
                        <p style={{ color: 'rgba(255,255,255,0.85)', fontSize: '15px', margin: 0 }}>
                            Continue ton aventure wellness
                        </p>
                    </div>
                </div>

                {/* Right: stats pills */}
                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
                    <HeroStat icon="⭐" value={(user?.total_points ?? 0).toLocaleString('fr-FR')} label="Points" />
                    <HeroStat icon="🔥" value={`${user?.streak_current ?? 0} j`} label="Série" />
                    <ProgressRing pct={progressDailyPercentage} caption={`${completedDaily}/${totalDaily} aujourd'hui`} />
                </div>
            </div>

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
                        borderBottom: activeTab === 'objectives' ? '3px solid #C8B7E8' : '3px solid transparent',
                        color: activeTab === 'objectives' ? '#1A1A1A' : '#6B6B6B',
                        transition: 'all 0.3s',
                        marginBottom: '-2px',
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
                        borderBottom: activeTab === 'stats' ? '3px solid #C8B7E8' : '3px solid transparent',
                        color: activeTab === 'stats' ? '#1A1A1A' : '#6B6B6B',
                        transition: 'all 0.3s',
                        marginBottom: '-2px',
                    }}
                >
                    Avancement
                </button>
            </div>

            {/* Tab Content */}
            {activeTab === 'objectives' ? (
                <DailyQuests
                    isLoading={dailyLoading}
                    onNavigateToQuests={() => onNavigateTo?.('quests')}
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
