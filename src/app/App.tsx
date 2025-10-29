import '../styles/App.css'
import React, { useState } from 'react';
import { TopNav } from "../components/ui/TopNav"
import {NAV_ITEMS} from "./nav"
import { useHealth, useQuests, useCategories, useRewards } from '../hooks/useApi';
import { useAuth } from '../contexts/AuthContext';
import { LoginForm } from '../components/auth/LoginForm';
import { QuestCard } from '../components/quests/QuestCard';
import { QuestSkeleton, RewardSkeleton, StatCardSkeleton } from '../components/ui/Skeleton';
import toast from 'react-hot-toast';

type View = typeof NAV_ITEMS[number]["key"]

function App() {
    const { user, isAuthenticated, isLoading: authLoading, logout } = useAuth();
    const [activeView, setActiveView] = useState<View>('dashboard');
    const { data: health, error: healthError } = useHealth();
    const { data: quests, isLoading: questsLoading, error: questsError } = useQuests();
    const { data: categories, isLoading: categoriesLoading, error: categoriesError } = useCategories();
    const { data: rewards, isLoading: rewardsLoading, error: rewardsError } = useRewards();

    // Show login form if not authenticated
    if (!isAuthenticated && !authLoading) {
        return <LoginForm />;
    }

    // Show loading while checking auth
    if (authLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-100 via-pink-100 to-blue-100">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading...</p>
                </div>
            </div>
        );
    }

    const handleLogout = () => {
        logout();
    };

    // Show errors via toast
    if (healthError) toast.error('Backend connection error');
    if (questsError) toast.error('Failed to load quests');
    if (categoriesError) toast.error('Failed to load categories');
    if (rewardsError) toast.error('Failed to load rewards');

    return (
        <div className="min-h-screen bg-gradient-to-br from-purple-100 via-pink-100 to-blue-100">
            <TopNav items={NAV_ITEMS} active={activeView} onChange={setActiveView}/>

            {/* User Profile Section */}
            <div className="fixed top-4 right-4 bg-white rounded-lg shadow-lg p-4 z-10">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-pink-600 rounded-full flex items-center justify-center text-white font-bold">
                        {user?.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1">
                        <p className="font-semibold text-sm">{user?.name}</p>
                        <p className="text-xs text-gray-600">{user?.total_points || 0} points</p>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="text-xs text-gray-600 hover:text-gray-800"
                        title="Logout"
                    >
                        🚪
                    </button>
                </div>
                {user && user.streak_current > 0 && (
                    <div className="mt-2 pt-2 border-t text-xs text-gray-600">
                        🔥 Streak: {user.streak_current} days (Record: {user.streak_record})
                    </div>
                )}
            </div>

            <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 pl-72 pr-64">
                {activeView === "dashboard" && (
                    <section className="text-gray-900">
                        <h2 className="text-2xl font-bold mb-4">Dashboard</h2>

                        <div className="bg-white rounded-lg shadow p-4 mb-4">
                            <h3 className="font-semibold mb-2">Backend Status</h3>
                            {health ? (
                                <div className="space-y-1 text-sm">
                                    <p>Service: {health.service}</p>
                                    <p>Database: {health.database}</p>
                                    <p className="text-green-600">✓ Connected</p>
                                </div>
                            ) : (
                                <p className="text-gray-500">Connecting...</p>
                            )}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {questsLoading || categoriesLoading || rewardsLoading ? (
                                <>
                                    <StatCardSkeleton />
                                    <StatCardSkeleton />
                                    <StatCardSkeleton />
                                </>
                            ) : (
                                <>
                                    <div className="bg-white rounded-lg shadow p-4">
                                        <h3 className="font-semibold mb-2">Quests</h3>
                                        <p className="text-3xl font-bold text-purple-600">{quests?.length || 0}</p>
                                    </div>

                                    <div className="bg-white rounded-lg shadow p-4">
                                        <h3 className="font-semibold mb-2">Categories</h3>
                                        <p className="text-3xl font-bold text-pink-600">{categories?.length || 0}</p>
                                    </div>

                                    <div className="bg-white rounded-lg shadow p-4">
                                        <h3 className="font-semibold mb-2">Rewards</h3>
                                        <p className="text-3xl font-bold text-blue-600">{rewards?.length || 0}</p>
                                    </div>
                                </>
                            )}
                        </div>
                    </section>
                )}
                {activeView === "objectives" && (
                    <section>
                        <h2 className="text-2xl font-bold mb-4">Objectifs</h2>
                        <div className="bg-white rounded-lg shadow p-4">
                            {questsLoading ? (
                                <div className="space-y-3">
                                    <QuestSkeleton />
                                    <QuestSkeleton />
                                    <QuestSkeleton />
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {quests?.map(quest => (
                                        <QuestCard key={quest.id} quest={quest} />
                                    ))}
                                    {!quests?.length && <p className="text-gray-500">No quests available</p>}
                                </div>
                            )}
                        </div>
                    </section>
                )}
                {activeView === "board" && (
                    <section>
                        <h2 className="text-2xl font-bold mb-4">Plateau</h2>
                        <div className="bg-white rounded-lg shadow p-8 text-center">
                            <p className="text-gray-500">Coming soon...</p>
                        </div>
                    </section>
                )}
                {activeView === "competition" && (
                    <section>
                        <h2 className="text-2xl font-bold mb-4">Compétition</h2>
                        <div className="bg-white rounded-lg shadow p-8 text-center">
                            <p className="text-gray-500">Coming soon...</p>
                        </div>
                    </section>
                )}
                {activeView === "rewards" && (
                    <section>
                        <h2 className="text-2xl font-bold mb-4">Récompenses</h2>
                        <div className="bg-white rounded-lg shadow p-4">
                            {rewardsLoading ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    <RewardSkeleton />
                                    <RewardSkeleton />
                                    <RewardSkeleton />
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {rewards?.map(reward => (
                                        <div key={reward.id} className="border rounded-lg p-4 hover:shadow-lg transition-shadow">
                                            <h3 className="font-semibold mb-2">{reward.title}</h3>
                                            {reward.description && (
                                                <p className="text-sm text-gray-600 mb-2">{reward.description}</p>
                                            )}
                                            <div className="flex justify-between items-center">
                                                <p className="text-lg font-bold text-purple-600">{reward.cost} points</p>
                                                <button
                                                    onClick={async () => {
                                                        if (!user) return;

                                                        if (user.total_points < reward.cost) {
                                                            toast.error('Not enough points!');
                                                            return;
                                                        }

                                                        try {
                                                            const { api } = await import('../services/api');
                                                            const result = await api.rewardPurchases.purchase(reward.id);

                                                            updateUser({
                                                                total_points: result.new_points_balance
                                                            });

                                                            toast.success(`Purchased ${reward.title}!`);
                                                        } catch (error: any) {
                                                            if (error.message.includes('already purchased')) {
                                                                toast.error('You already purchased this reward!');
                                                            } else {
                                                                toast.error('Failed to purchase reward');
                                                            }
                                                        }
                                                    }}
                                                    className="px-3 py-1 bg-purple-600 text-white text-sm rounded hover:bg-purple-700 transition-colors"
                                                >
                                                    Buy
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                    {!rewards?.length && <p className="text-gray-500">No rewards available</p>}
                                </div>
                            )}
                        </div>
                    </section>
                )}
                {activeView === "stats" && (
                    <section>
                        <h2 className="text-2xl font-bold mb-4">Statistiques</h2>
                        <div className="bg-white rounded-lg shadow p-4">
                            <div className="space-y-4">
                                <div>
                                    <p className="text-sm text-gray-600">Total Points</p>
                                    <p className="text-3xl font-bold text-purple-600">{user?.total_points || 0}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-600">Current Streak</p>
                                    <p className="text-3xl font-bold text-orange-600">{user?.streak_current || 0} days</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-600">Record Streak</p>
                                    <p className="text-3xl font-bold text-red-600">{user?.streak_record || 0} days</p>
                                </div>
                            </div>
                        </div>
                    </section>
                )}
                {activeView === "settings" && (
                    <section>
                        <h2 className="text-2xl font-bold mb-4">Paramètres</h2>
                        <div className="bg-white rounded-lg shadow p-4">
                            <div className="space-y-4">
                                <div>
                                    <h3 className="font-semibold mb-2">Profile</h3>
                                    <p className="text-sm text-gray-600">Name: {user?.name}</p>
                                    <p className="text-sm text-gray-600">Email: {user?.email}</p>
                                </div>
                                <div>
                                    <button
                                        onClick={handleLogout}
                                        className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                                    >
                                        Logout
                                    </button>
                                </div>
                            </div>
                        </div>
                    </section>
                )}
            </main>
        </div>
    )
}

export default App;
