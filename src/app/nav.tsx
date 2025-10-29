import { BarChart3, Target, Trophy, Users, Gift, TrendingUp, Settings } from "lucide-react"
import type { NavItem } from "../components/ui/TopNav"

export const NAV_ITEMS: NavItem[] = [
    { key: "dashboard",   label: "Dashboard",   icon: <BarChart3 className="w-5 h-5" /> },
    { key: "objectives",  label: "Objectifs",   icon: <Target className="w-5 h-5" /> },
    { key: "board",       label: "Plateau",     icon: <Trophy className="w-5 h-5" /> },
    { key: "competition", label: "Compétition", icon: <Users className="w-5 h-5" /> },
    { key: "rewards",     label: "Récompenses", icon: <Gift className="w-5 h-5" /> },
    { key: "stats",       label: "Statistiques",icon: <TrendingUp className="w-5 h-5" /> },
    { key: "settings",    label: "Paramètres",  icon: <Settings className="w-5 h-5" /> },
]