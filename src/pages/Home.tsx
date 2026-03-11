import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import * as LucideIcons from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface Category {
  id: number;
  name: string;
  icon: string;
}

interface Activity {
  id: number;
  title: string;
  category_name: string;
  image_path: string;
  date: string;
}

const getIcon = (iconName: string) => {
  const Icon = (LucideIcons as any)[iconName] || LucideIcons.HelpCircle;
  return <Icon size={18} className="text-white" />; // Reduced icon size further
};

export function Home() {
  const navigate = useNavigate();
  const { token } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [recentActivities, setRecentActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [catRes, actRes] = await Promise.all([
          fetch('/api/categories'),
          fetch('/api/activities/recent')
        ]);
        
        const catData = await catRes.json();
        setCategories(catData);

        if (actRes.ok) {
           const actData = await actRes.json();
           setRecentActivities(actData);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-16">
      {/* Hero Section */}
      <div className="text-center relative">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-indigo-500/10 blur-[100px] rounded-full -z-10 pointer-events-none"></div>
        <motion.h1 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-4xl md:text-5xl font-extrabold text-slate-900 mb-6 tracking-tight"
        >
          نظام توثيق <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-violet-500">النشاطات المؤسسية</span>
        </motion.h1>
        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-slate-500 text-lg md:text-xl max-w-2xl mx-auto leading-relaxed"
        >
          منصة مركزية متطورة لتوثيق، متابعة، وإدارة كافة الأنشطة والفعاليات بكفاءة واحترافية عالية.
        </motion.p>
      </div>

      {/* Categories Grid */}
      <div>
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <LucideIcons.LayoutGrid className="text-indigo-600" />
            تبويبات الأنشطة
          </h2>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {categories.map((category, index) => (
            <motion.div
              key={category.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              whileHover={{ y: -5, scale: 1.02 }}
              className="group relative overflow-hidden bg-white rounded-2xl p-5 flex flex-col items-center justify-center text-center shadow-sm border border-slate-100 hover:shadow-xl hover:border-indigo-100 transition-all duration-300 cursor-default"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-50 to-violet-50 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              
              <div className="relative z-10 bg-gradient-to-br from-indigo-500 to-violet-600 p-3 rounded-xl mb-3 shadow-md group-hover:shadow-lg transition-all duration-300 transform group-hover:-translate-y-1">
                {getIcon(category.icon)}
              </div>
              <h3 className="relative z-10 text-slate-700 font-bold text-sm group-hover:text-indigo-700 transition-colors">
                {category.name}
              </h3>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Recent Activities Section */}
      <div>
        <div className="flex items-center justify-between mb-8 border-b border-slate-200 pb-4">
          <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <LucideIcons.Clock className="text-indigo-600" />
            أحدث الأنشطة المضافة
          </h2>
        </div>
        
        {recentActivities.length === 0 ? (
          <div className="bg-slate-50 rounded-2xl border border-dashed border-slate-300 p-12 text-center">
            <LucideIcons.Inbox className="mx-auto text-slate-400 mb-4" size={48} />
            <p className="text-slate-500 text-lg font-medium">لا توجد أنشطة مضافة حديثاً.</p>
            <p className="text-slate-400 text-sm mt-2">سيتم عرض الأنشطة هنا فور إضافتها من قبل المستخدمين.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {recentActivities.map((activity, index) => (
              <motion.div 
                key={activity.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ y: -5 }}
                className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-xl transition-all duration-300 group"
              >
                <div className="h-48 bg-slate-100 relative overflow-hidden">
                  {activity.image_path ? (
                    <img 
                      src={activity.image_path} 
                      alt={activity.title} 
                      className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-500" 
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-300 bg-slate-50">
                      <LucideIcons.Image size={48} strokeWidth={1.5} />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm text-indigo-700 font-bold text-xs px-3 py-1.5 rounded-full shadow-sm">
                    {activity.category_name}
                  </div>
                </div>
                <div className="p-5">
                  <h3 className="font-bold text-slate-900 mb-2 line-clamp-2 group-hover:text-indigo-600 transition-colors" title={activity.title}>
                    {activity.title}
                  </h3>
                  <div className="flex items-center text-xs text-slate-500 gap-1.5 font-medium">
                    <LucideIcons.Calendar size={14} className="text-indigo-400" />
                    <span>{new Date(activity.date).toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
