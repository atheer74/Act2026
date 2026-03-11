import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Calendar, Image as ImageIcon, Clock } from 'lucide-react';
import { motion } from 'motion/react';

interface Activity {
  id: number;
  title: string;
  date: string;
  evidence_path: string;
  category_name: string;
}

export function RecentActivities() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchActivities();
  }, []);

  const fetchActivities = async () => {
    try {
      const res = await fetch('/api/activities/recent');
      const data = await res.json();
      setActivities(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="p-8 text-center text-slate-500">جاري تحميل الأنشطة...</div>;
  if (activities.length === 0) return null;

  return (
    <div className="mt-12 print:hidden">
      <div className="flex items-center justify-between mb-6 border-b border-slate-200 pb-4">
        <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
          <Clock className="text-indigo-600" />
          أحدث الأنشطة المضافة
        </h2>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {activities.map((activity, index) => {
          let firstImage = null;
          try {
            if (activity.evidence_path) {
              const evidences = JSON.parse(activity.evidence_path);
              if (evidences.length > 0) {
                // Just use the first one, assuming it might be an image
                firstImage = evidences[0];
              }
            }
          } catch (e) {
            firstImage = activity.evidence_path;
          }

          return (
          <motion.div 
            key={activity.id}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.1 }}
            whileHover={{ y: -5 }}
            className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-xl transition-all duration-300 group"
          >
            <div className="h-40 bg-slate-100 relative overflow-hidden">
              {firstImage && firstImage.match(/\.(jpeg|jpg|gif|png)$/i) ? (
                <img 
                  src={firstImage} 
                  alt={activity.title} 
                  className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-500" 
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-slate-300 bg-slate-50">
                  <ImageIcon size={40} strokeWidth={1.5} />
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm text-indigo-700 font-bold text-xs px-3 py-1.5 rounded-full shadow-sm">
                {activity.category_name}
              </div>
            </div>
            <div className="p-4">
              <h3 className="font-bold text-slate-900 mb-2 line-clamp-2 group-hover:text-indigo-600 transition-colors" title={activity.title}>
                {activity.title}
              </h3>
              <div className="flex items-center text-xs text-slate-500 gap-1.5 font-medium">
                <Calendar size={14} className="text-indigo-400" />
                <span>{new Date(activity.date).toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
              </div>
            </div>
          </motion.div>
          );
        })}
      </div>
    </div>
  );
}
