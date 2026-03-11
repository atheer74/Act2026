import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Navigate } from 'react-router-dom';
import { Users } from './Users';
import { Settings } from './Settings';
import { AdminReports } from './AdminReports';
import { Users as UsersIcon, Settings as SettingsIcon, FileBarChart, Server, Link as LinkIcon } from 'lucide-react';
import { RecentActivities } from '../components/RecentActivities';

export function AdminDashboard() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'users' | 'settings' | 'reports'>('users');
  const [serverInfo, setServerInfo] = useState<{ip?: string, port?: number, isCloud?: boolean} | null>(null);

  useEffect(() => {
    fetch('/api/server-info')
      .then(res => res.json())
      .then(data => setServerInfo(data))
      .catch(err => console.error('Failed to fetch server info', err));
  }, []);

  if (!user || user.role !== 'admin') {
    return <div className="p-10 text-center text-red-600 font-bold">عذراً، هذه الصفحة مخصصة لمدير النظام فقط.</div>;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
      <div className="bg-gradient-to-r from-indigo-600 to-blue-500 p-8 rounded-2xl shadow-lg text-white relative overflow-hidden">
        <div className="relative z-10">
          <h1 className="text-3xl font-bold mb-2">لوحة تحكم مدير النظام</h1>
          <p className="text-indigo-100 mb-6">إدارة المستخدمين وإعدادات النظام والتقارير الشاملة</p>
          
          {serverInfo && (
            <div className="inline-flex items-center gap-3 bg-white/10 backdrop-blur-sm border border-white/20 px-4 py-3 rounded-xl">
              <div className="bg-white/20 p-2 rounded-lg">
                <Server size={20} className="text-white" />
              </div>
              <div>
                <p className="text-xs text-indigo-100 mb-1">
                  {serverInfo.isCloud ? 'رابط الوصول من الأجهزة الأخرى:' : 'رابط الوصول من الأجهزة الأخرى (الشبكة المحلية):'}
                </p>
                <div className="flex items-center gap-2 font-mono text-sm bg-black/20 px-3 py-1 rounded-md">
                  <LinkIcon size={14} />
                  {serverInfo.isCloud ? (
                    <span>استخدم الرابط العام (Shared URL) الخاص بالمنصة</span>
                  ) : (
                    <span>http://{serverInfo.ip}:{serverInfo.port}</span>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
        
        {/* Decorative background elements */}
        <div className="absolute top-0 left-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-blue-400/20 rounded-full blur-3xl translate-x-1/3 translate-y-1/3"></div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 bg-white rounded-t-2xl px-4 pt-2 shadow-sm">
        <button
          onClick={() => setActiveTab('users')}
          className={`flex items-center gap-2 px-6 py-4 font-medium text-sm transition-all relative ${
            activeTab === 'users' 
              ? 'text-indigo-600' 
              : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50 rounded-t-lg'
          }`}
        >
          <UsersIcon size={16} className={activeTab === 'users' ? 'text-indigo-600' : 'text-slate-400'} />
          إدارة المستخدمين
          {activeTab === 'users' && (
            <span className="absolute bottom-0 left-0 w-full h-0.5 bg-indigo-600 rounded-t-full"></span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('reports')}
          className={`flex items-center gap-2 px-6 py-4 font-medium text-sm transition-all relative ${
            activeTab === 'reports' 
              ? 'text-indigo-600' 
              : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50 rounded-t-lg'
          }`}
        >
          <FileBarChart size={16} className={activeTab === 'reports' ? 'text-indigo-600' : 'text-slate-400'} />
          التقارير الشاملة
          {activeTab === 'reports' && (
            <span className="absolute bottom-0 left-0 w-full h-0.5 bg-indigo-600 rounded-t-full"></span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('settings')}
          className={`flex items-center gap-2 px-6 py-4 font-medium text-sm transition-all relative ${
            activeTab === 'settings' 
              ? 'text-indigo-600' 
              : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50 rounded-t-lg'
          }`}
        >
          <SettingsIcon size={16} className={activeTab === 'settings' ? 'text-indigo-600' : 'text-slate-400'} />
          إعدادات النظام
          {activeTab === 'settings' && (
            <span className="absolute bottom-0 left-0 w-full h-0.5 bg-indigo-600 rounded-t-full"></span>
          )}
        </button>
      </div>

      <div className="bg-white p-6 rounded-b-2xl shadow-sm border border-slate-200 border-t-0">
        {activeTab === 'users' && <Users />}
        {activeTab === 'reports' && <AdminReports />}
        {activeTab === 'settings' && <Settings />}
      </div>

      <RecentActivities />
    </div>
  );
}
