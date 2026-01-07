import { NavLink, useLocation } from 'react-router-dom';
import { Home, Play, Trophy, User, Heart } from 'lucide-react';
import { motion } from 'framer-motion';

const navItems = [
  { to: '/', icon: Home, label: 'Home' },
  { to: '/run', icon: Play, label: 'Run' },
  { to: '/health', icon: Heart, label: 'Health' },
  { to: '/leaderboard', icon: Trophy, label: 'Rank' },
  { to: '/profile', icon: User, label: 'Profile' },
];

export function BottomNav() {
  const location = useLocation();

  return (
    <nav className="sticky bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-xl border-t border-gray-200">
      <div className="flex justify-around items-center h-16">
        {navItems.map((item) => {
          const isActive = location.pathname === item.to;
          const Icon = item.icon;

          return (
            <NavLink
              key={item.to}
              to={item.to}
              className="flex flex-col items-center justify-center w-14 h-full relative"
            >
              {isActive && (
                <motion.div
                  layoutId="nav-indicator"
                  className="absolute -top-0.5 w-8 h-1 bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-full"
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                />
              )}
              <Icon 
                className={`w-5 h-5 mb-1 transition-colors ${
                  isActive ? 'text-emerald-600' : 'text-gray-400'
                }`} 
              />
              <span 
                className={`text-xs transition-colors ${
                  isActive ? 'text-emerald-600 font-medium' : 'text-gray-400'
                }`}
              >
                {item.label}
              </span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}
