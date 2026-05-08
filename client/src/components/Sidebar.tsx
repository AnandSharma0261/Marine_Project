import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Wrench,
  ShieldAlert,
  Ship,
  Users,
  ListChecks,
  Anchor,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';

const adminNav = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/maintenance', label: 'Maintenance', icon: Wrench },
  { to: '/drills', label: 'Drills', icon: ShieldAlert },
  { to: '/ships', label: 'Ships', icon: Ship },
  { to: '/users', label: 'Crew & Users', icon: Users },
];

const crewNav = [
  { to: '/', label: 'My Dashboard', icon: LayoutDashboard },
  { to: '/my-tasks', label: 'My Tasks', icon: ListChecks },
  { to: '/my-drills', label: 'My Drills', icon: ShieldAlert },
];

export const Sidebar = () => {
  const { user } = useAuth();
  const links = user?.role === 'admin' ? adminNav : crewNav;

  return (
    <aside className="w-64 shrink-0 border-r bg-white">
      <div className="flex h-16 items-center gap-2 border-b px-6 font-semibold">
        <Anchor className="h-5 w-5 text-primary" />
        <span>Marine Ops</span>
      </div>
      <nav className="flex flex-col gap-1 p-3">
        {links.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors',
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
              )
            }
          >
            <Icon className="h-4 w-4" />
            {label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
};
