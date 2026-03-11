import { Outlet, Navigate } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { useAuth } from '../context/AuthContext';

export function Layout() {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="flex h-screen print:h-auto bg-slate-100 print:bg-white">
      <Sidebar />
      <main className="flex-1 overflow-auto print:overflow-visible p-4 md:p-8 pt-16 md:pt-8 print:p-0">
        <Outlet />
      </main>
    </div>
  );
}
