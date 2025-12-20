import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, Users, Trophy, Gift, Crown } from 'lucide-react';
import { useGame } from '../context/GameContext';

interface NavItemProps {
  to: string;
  icon: React.ReactNode;
  label: string;
  badge?: number;
}

const NavItem: React.FC<NavItemProps> = ({ to, icon, label, badge }) => (
  <NavLink
    to={to}
    className={({ isActive }) =>
      `flex flex-col items-center justify-center py-2 px-3 rounded-2xl transition-all duration-250 relative ${
        isActive 
          ? 'text-coral-500' 
          : 'text-white/70'
      }`
    }
  >
    <div className="relative">
      {React.cloneElement(icon as React.ReactElement, { size: 22 })}
      {badge !== undefined && badge > 0 && (
        <span className="absolute -top-1 -right-1.5 w-4 h-4 bg-coral-500 rounded-full text-[10px] font-bold flex items-center justify-center text-white shadow-lg">
          {badge > 9 ? '9+' : badge}
        </span>
      )}
    </div>
    <span className="text-[10px] mt-1 font-medium leading-tight">{label}</span>
  </NavLink>
);

export const BottomNav: React.FC = () => {
  const { user, proveInVerifica } = useGame();
  
  // Count pending verifications (exclude user's own proofs)
  const pendingVerifications = proveInVerifica.filter(
    p => p.stato === 'in_verifica' && p.user_id !== user?.id
  ).length;

  return (
    <nav className="bottom-nav">
      <div className="flex items-center justify-around py-1">
        <NavItem 
          to="/home" 
          icon={<Home size={22} />} 
          label="Home" 
          badge={pendingVerifications}
        />
        <NavItem 
          to="/squadra" 
          icon={<Users size={22} />} 
          label="Squadra" 
        />
        <NavItem 
          to="/leaderboard" 
          icon={<Trophy size={22} />} 
          label="Classifica" 
        />
        <NavItem 
          to="/premi" 
          icon={<Gift size={22} />} 
          label="Premi" 
        />
        {user?.is_admin && (
          <NavItem 
            to="/admin" 
            icon={<Crown size={22} />} 
            label="Admin" 
          />
        )}
      </div>
    </nav>
  );
};
