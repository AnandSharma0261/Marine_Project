import { Outlet } from 'react-router-dom';
import { LogOut } from 'lucide-react';
import { Sidebar } from './Sidebar';
import { NotificationBell } from './NotificationBell';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/context/AuthContext';

export const Layout = () => {
  const { user, logout } = useAuth();
  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="flex h-16 items-center justify-end gap-3 border-b bg-white px-6">
          <NotificationBell />
          <div className="flex items-center gap-3 border-l pl-3">
            <div className="text-right text-sm">
              <p className="font-medium leading-none">{user?.name}</p>
              <p className="text-xs text-muted-foreground">{user?.email}</p>
            </div>
            <Badge variant={user?.role === 'admin' ? 'default' : 'secondary'}>
              {user?.role}
            </Badge>
            <Button variant="ghost" size="icon" onClick={logout} title="Logout">
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
