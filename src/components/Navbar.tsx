import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { Home, User, LogOut, ShieldCheck } from 'lucide-react';
import { clsx } from 'clsx';
import { useAuth } from '../context/AuthContext';

export function Navbar() {
  const location = useLocation();
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const dashboardPath = user?.role === 'admin' ? '/admin' : '/user-login';

  const tabs = [
    { name: 'الرئيسية', path: '/', icon: Home },
    ...(user ? [
      { name: user.role === 'admin' ? 'لوحة الإدارة' : 'لوحة المستخدم', path: dashboardPath, icon: user.role === 'admin' ? ShieldCheck : User }
    ] : [
      { name: 'دخول المستخدمين', path: '/user-login', icon: User }
    ])
  ];

  return (
    <nav className="bg-white shadow-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <h1 className="text-xl font-bold text-indigo-600 ml-4">نظام الأنشطة</h1>
          </div>
          <div className="flex items-center space-x-8 space-x-reverse">
            <div className="flex space-x-8 space-x-reverse">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = location.pathname === tab.path || (tab.path !== '/' && location.pathname.startsWith(tab.path));
                
                return (
                  <NavLink
                    key={tab.path}
                    to={tab.path}
                    className={clsx(
                      "inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-colors duration-200",
                      isActive
                        ? "border-indigo-500 text-indigo-600"
                        : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"
                    )}
                  >
                    <Icon className="ml-2 h-5 w-5" />
                    {tab.name}
                  </NavLink>
                );
              })}
            </div>
            
            {user && (
              <div className="flex items-center gap-4 mr-8 border-r border-slate-200 pr-8">
                <div className="text-sm">
                  <span className="block font-bold text-slate-700">{user.username}</span>
                  <span className="block text-xs text-slate-500">{user.role === 'admin' ? 'مدير النظام' : 'مستخدم'}</span>
                </div>
                <button
                  onClick={handleLogout}
                  className="text-red-500 hover:text-red-700 transition-colors flex items-center gap-1 text-sm font-medium"
                  title="تسجيل الخروج"
                >
                  <LogOut size={18} />
                  خروج
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
