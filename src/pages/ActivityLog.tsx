import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Plus, Search, Edit2, Trash2, X, Save } from 'lucide-react';
import { format } from 'date-fns';

interface Activity {
  id: number;
  category_id: number;
  title: string;
  description: string;
  date: string;
  beneficiaries: number;
  cost: number;
  notes: string;
}

interface Category {
  id: number;
  name: string;
  description: string;
}

export function ActivityLog() {
  const { categoryId } = useParams();
  const { token } = useAuth();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [category, setCategory] = useState<Category | null>(null);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentActivity, setCurrentActivity] = useState<Partial<Activity>>({});
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (categoryId) {
      fetchData();
      fetchCategory();
    }
  }, [categoryId]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/activities?category_id=${categoryId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      setActivities(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategory = async () => {
    try {
      const res = await fetch('/api/categories', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      const cat = data.find((c: Category) => c.id === Number(categoryId));
      setCategory(cat);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('هل أنت متأكد من حذف هذا النشاط؟')) return;
    try {
      await fetch(`/api/activities/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      setActivities(activities.filter(a => a.id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const method = currentActivity.id ? 'PUT' : 'POST';
    const url = currentActivity.id ? `/api/activities/${currentActivity.id}` : '/api/activities';

    try {
      const res = await fetch(url, {
        method,
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({ ...currentActivity, category_id: categoryId }),
      });
      
      if (res.ok) {
        setIsModalOpen(false);
        fetchData();
        setCurrentActivity({});
      }
    } catch (err) {
      console.error(err);
    }
  };

  const filteredActivities = activities.filter(a => 
    a.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    a.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{category?.name || 'الأنشطة'}</h1>
          <p className="text-slate-500">{category?.description || 'إدارة الأنشطة لهذا القسم'}</p>
        </div>
        <button 
          onClick={() => { setCurrentActivity({}); setIsModalOpen(true); }}
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 flex items-center gap-2 transition-colors"
        >
          <Plus size={20} />
          إضافة نشاط
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex items-center gap-4">
          <div className="relative flex-1">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
            <input 
              type="text" 
              placeholder="بحث في الأنشطة..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pr-10 pl-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-right text-sm text-slate-600">
            <thead className="bg-slate-50 text-slate-900 font-semibold">
              <tr>
                <th className="p-4">التاريخ</th>
                <th className="p-4">العنوان</th>
                <th className="p-4">الوصف</th>
                <th className="p-4">المستفيدين</th>
                <th className="p-4">التكلفة</th>
                <th className="p-4 text-left">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {loading ? (
                <tr><td colSpan={6} className="p-8 text-center">جاري التحميل...</td></tr>
              ) : filteredActivities.length === 0 ? (
                <tr><td colSpan={6} className="p-8 text-center text-slate-500">لا توجد أنشطة.</td></tr>
              ) : (
                filteredActivities.map(activity => (
                  <tr key={activity.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-4 whitespace-nowrap">{format(new Date(activity.date), 'yyyy/MM/dd')}</td>
                    <td className="p-4 font-medium text-slate-900">{activity.title}</td>
                    <td className="p-4 max-w-xs truncate">{activity.description}</td>
                    <td className="p-4">{activity.beneficiaries}</td>
                    <td className="p-4">{activity.cost.toLocaleString()}</td>
                    <td className="p-4 text-left space-x-2 space-x-reverse">
                      <button 
                        onClick={() => { setCurrentActivity(activity); setIsModalOpen(true); }}
                        className="text-indigo-600 hover:text-indigo-900 p-1"
                      >
                        <Edit2 size={18} />
                      </button>
                      <button 
                        onClick={() => handleDelete(activity.id)}
                        className="text-red-600 hover:text-red-900 p-1"
                      >
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-200 flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-900">
                {currentActivity.id ? 'تعديل نشاط' : 'نشاط جديد'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X size={24} />
              </button>
            </div>
            
            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">العنوان</label>
                <input 
                  type="text" 
                  required
                  value={currentActivity.title || ''}
                  onChange={e => setCurrentActivity({...currentActivity, title: e.target.value})}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">التاريخ</label>
                  <input 
                    type="date" 
                    required
                    value={currentActivity.date || new Date().toISOString().split('T')[0]}
                    onChange={e => setCurrentActivity({...currentActivity, date: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">التكلفة</label>
                  <input 
                    type="number" 
                    min="0"
                    step="0.01"
                    value={currentActivity.cost || ''}
                    onChange={e => setCurrentActivity({...currentActivity, cost: parseFloat(e.target.value)})}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">عدد المستفيدين</label>
                <input 
                  type="number" 
                  min="0"
                  value={currentActivity.beneficiaries || ''}
                  onChange={e => setCurrentActivity({...currentActivity, beneficiaries: parseInt(e.target.value)})}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">الوصف</label>
                <textarea 
                  rows={3}
                  value={currentActivity.description || ''}
                  onChange={e => setCurrentActivity({...currentActivity, description: e.target.value})}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">ملاحظات</label>
                <textarea 
                  rows={2}
                  value={currentActivity.notes || ''}
                  onChange={e => setCurrentActivity({...currentActivity, notes: e.target.value})}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>

              <div className="pt-4 flex justify-end gap-3">
                <button 
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  إلغاء
                </button>
                <button 
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2"
                >
                  <Save size={18} />
                  حفظ
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
