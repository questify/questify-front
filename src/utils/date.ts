export function getCurrentWeekFromStartDate(startDate: string): number {
    const today = new Date()
    const start = new Date(startDate)
    // On ignore les heures pour ne pas fausser le diff
    today.setHours(0, 0, 0, 0)
    start.setHours(0, 0, 0, 0)
    const diffMs = today.getTime() - start.getTime()
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
    const diffWeeks = Math.floor(diffDays / 7) + 1
    // borne entre 1 et 52
    return Math.max(1, Math.min(diffWeeks, 52))
}

export const dayIndexFromToday = () => {
    const d = new Date().getDay()
    return d === 0 ? 6 : d - 1  // Lundi=0
}

export function getCurrentDayOfWeek(){
    const today = new Date();
    const day = today.getDay();
    return day === 0 ? 6 : day - 1;
}

export function getDateForDayOfWeek (dayIndex: number) {
    const today = new Date();
    const currentDay = getCurrentDayOfWeek();
    const diff = dayIndex - currentDay;
    const targetDate = new Date(today);
    targetDate.setDate(today.getDate() + diff);
    return targetDate.toISOString().split('T')[0];
}

export function getCurrentPeriod(f: 'weekly'|'monthly'|'quarterly') {
    const today = new Date()
    const y = today.getFullYear()
    if (f === 'weekly') {
        const w = getCurrentWeekFromStartDate( // tu passeras la vraie startDate via sélecteur
            new Date(today.getFullYear(), 0, 1).toISOString().slice(0,10)
        )
        return `${y}-W${String(w).padStart(2,'0')}`
    }
    if (f === 'monthly') {
        const m = String(today.getMonth() + 1).padStart(2,'0')
        return `${y}-${m}`
    }
    const q = Math.floor(today.getMonth()/3) + 1
    return `${y}-Q${q}`
}