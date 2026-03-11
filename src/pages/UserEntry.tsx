import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Login } from './Login';
import { Save, Upload, FileText, Printer, LayoutList, FileBarChart, Server, Link as LinkIcon, Download } from 'lucide-react';
import { RecentActivities } from '../components/RecentActivities';
import { exportToPDF, exportToDOCX } from '../utils/exportUtils';

interface Category {
  id: number;
  name: string;
}

interface Activity {
  id: number;
  title: string;
  section: string;
  category_name: string;
  description: string;
  date: string;
  image_path: string;
  evidence_path: string;
  user_department: string;
  user_section: string;
}

export function UserEntry() {
  const { user, token } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [activeTab, setActiveTab] = useState<'entry' | 'reports'>('entry');
  
  // Form State
  const [title, setTitle] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [description, setDescription] = useState('');
  const [evidenceFiles, setEvidenceFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (token) {
      fetchCategories();
      fetchActivities();
    }
  }, [token]);

  const fetchCategories = async () => {
    const res = await fetch('/api/categories');
    const data = await res.json();
    setCategories(data);
  };

  const fetchActivities = async () => {
    const res = await fetch('/api/activities', {
      headers: { Authorization: `Bearer ${token}` }
    });
    const data = await res.json();
    setActivities(data);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setLoading(true);

    const formData = new FormData();
    formData.append('title', title);
    formData.append('category_id', categoryId);
    formData.append('description', description);
    formData.append('date', new Date().toISOString());
    
    evidenceFiles.forEach(file => {
      formData.append('evidence', file);
    });

    try {
      const res = await fetch('/api/activities', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      if (res.ok) {
        // Reset form
        setTitle('');
        setCategoryId('');
        setDescription('');
        setEvidenceFiles([]);
        fetchActivities();
        alert('تم حفظ النشاط بنجاح');
      } else {
        alert('حدث خطأ أثناء الحفظ');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return <Login />;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
      
      <div className="bg-gradient-to-r from-emerald-600 to-teal-500 p-8 rounded-2xl shadow-lg text-white relative overflow-hidden">
        <div className="relative z-10">
          <h1 className="text-3xl font-bold mb-2">لوحة إدخال الأنشطة</h1>
          <p className="text-emerald-100 mb-6">إدخال وتوثيق الأنشطة الخاصة بالدائرة أو القسم</p>
        </div>
        
        {/* Decorative background elements */}
        <div className="absolute top-0 left-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-teal-400/20 rounded-full blur-3xl translate-x-1/3 translate-y-1/3"></div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 bg-white rounded-t-2xl px-4 pt-2 shadow-sm print:hidden">
        <button
          onClick={() => setActiveTab('entry')}
          className={`flex items-center gap-2 px-6 py-4 font-medium text-sm transition-all relative ${
            activeTab === 'entry' 
              ? 'text-emerald-600' 
              : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50 rounded-t-lg'
          }`}
        >
          <LayoutList size={16} className={activeTab === 'entry' ? 'text-emerald-600' : 'text-slate-400'} />
          إدخال بيانات النشاط
          {activeTab === 'entry' && (
            <span className="absolute bottom-0 left-0 w-full h-0.5 bg-emerald-600 rounded-t-full"></span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('reports')}
          className={`flex items-center gap-2 px-6 py-4 font-medium text-sm transition-all relative ${
            activeTab === 'reports' 
              ? 'text-emerald-600' 
              : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50 rounded-t-lg'
          }`}
        >
          <FileBarChart size={16} className={activeTab === 'reports' ? 'text-emerald-600' : 'text-slate-400'} />
          التقارير
          {activeTab === 'reports' && (
            <span className="absolute bottom-0 left-0 w-full h-0.5 bg-emerald-600 rounded-t-full"></span>
          )}
        </button>
      </div>

      {/* Entry Form */}
      {activeTab === 'entry' && (
        <div className="bg-white p-8 rounded-b-2xl shadow-sm border border-slate-200 border-t-0 print:hidden">
          <h2 className="text-2xl font-bold text-slate-900 mb-6 flex items-center gap-2">
            <FileText className="text-indigo-600" />
            إدخال نشاط جديد
          </h2>
          
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="col-span-2 md:col-span-1">
              <label className="block text-sm font-medium text-slate-700 mb-2">اسم النشاط</label>
              <input 
                type="text" 
                required
                value={title}
                onChange={e => setTitle(e.target.value)}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>

            <div className="col-span-2 md:col-span-1">
              <label className="block text-sm font-medium text-slate-700 mb-2">التبويب</label>
              <select 
                required
                value={categoryId}
                onChange={e => setCategoryId(e.target.value)}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
              >
                <option value="">اختر التبويب...</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>

            <div className="col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-2">وصف النشاط</label>
              <textarea 
                required
                rows={4}
                value={description}
                onChange={e => setDescription(e.target.value)}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>

            <div className="col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-2">الدليل (يمكن اختيار أكثر من ملف)</label>
              <div className="border-2 border-dashed border-slate-300 rounded-lg p-4 text-center hover:bg-slate-50 transition-colors cursor-pointer relative">
                <input 
                  type="file" 
                  multiple
                  onChange={e => {
                    if (e.target.files) {
                      setEvidenceFiles(Array.from(e.target.files));
                    }
                  }}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                />
                <Upload className="mx-auto text-slate-400 mb-2" />
                <p className="text-sm text-slate-500">
                  {evidenceFiles.length > 0 
                    ? `تم اختيار ${evidenceFiles.length} ملفات` 
                    : 'اضغط لرفع ملفات الدليل'}
                </p>
              </div>
            </div>

            <div className="col-span-2 flex justify-end">
              <button 
                type="submit" 
                disabled={loading}
                className="bg-indigo-600 text-white px-8 py-3 rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2 font-bold disabled:opacity-50"
              >
                <Save size={20} />
                {loading ? 'جاري الحفظ...' : 'حفظ النشاط'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Report View (A4 Landscape Table) */}
      {activeTab === 'reports' && (
        <div className="bg-white p-8 shadow-sm border border-slate-200 rounded-b-2xl print:shadow-none print:border-none print:p-0">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 print:hidden">
            <h2 className="text-xl font-bold text-slate-900">سجل الأنشطة (معاينة الطباعة)</h2>
            <div className="flex gap-2">
              <button onClick={() => exportToPDF('user-report-container', 'تقرير_الأنشطة')} className="flex items-center gap-2 text-white bg-red-600 hover:bg-red-700 px-4 py-2 rounded-lg font-medium transition-colors">
                <Download size={18} />
                PDF
              </button>
              <button onClick={() => exportToDOCX('user-report-container', 'تقرير_الأنشطة')} className="flex items-center gap-2 text-white bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg font-medium transition-colors">
                <Download size={18} />
                DOCX
              </button>
              <button onClick={() => window.print()} className="flex items-center gap-2 text-emerald-600 hover:text-emerald-800 bg-emerald-50 px-4 py-2 rounded-lg font-medium transition-colors">
                <Printer size={18} />
                طباعة
              </button>
            </div>
          </div>

          {/* A4 Container */}
          <div id="user-report-container" className="w-full max-w-[297mm] mx-auto bg-white print:max-w-none">
            {/* Logo for Print/PDF */}
            <div className="text-center mb-6 hidden print:block">
              <img src="/logo.svg" alt="Logo" className="h-24 mx-auto" />
            </div>
            
            {/* Header */}
            <div className="border-b-2 border-black pb-4 mb-4 flex justify-between items-end">
              <div className="text-right">
                <h3 className="font-bold text-lg">الدائرة: {user.department || 'غير محدد'}</h3>
                <h3 className="font-bold text-lg">القسم: {user.section || 'غير محدد'}</h3>
              </div>
              <div className="text-left">
                <p className="font-medium">تاريخ التقرير: {new Date().toLocaleDateString('ar-EG')}</p>
              </div>
            </div>

            {/* Table */}
            <table className="w-full border-collapse border border-black text-sm">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border border-black p-2 w-12 text-center">ت</th>
                  <th className="border border-black p-2 w-32 text-center">اسم النشاط</th>
                  <th className="border border-black p-2 w-32 text-center">التبويب</th>
                  <th className="border border-black p-2 text-center">وصف النشاط</th>
                  <th className="border border-black p-2 w-24 text-center print:hidden">الدليل</th>
                </tr>
              </thead>
              <tbody>
                {activities.map((activity, index) => {
                  let evidences: string[] = [];
                  try {
                    if (activity.evidence_path) {
                      evidences = JSON.parse(activity.evidence_path);
                    }
                  } catch (e) {
                    if (activity.evidence_path) evidences = [activity.evidence_path];
                  }

                  return (
                    <tr key={activity.id} className="break-inside-avoid">
                      <td className="border border-black p-2 text-center">{index + 1}</td>
                      <td className="border border-black p-2 font-bold">{activity.title}</td>
                      <td className="border border-black p-2">{activity.category_name}</td>
                      <td className="border border-black p-2 text-justify">{activity.description}</td>
                      <td className="border border-black p-2 text-center print:hidden">
                        {evidences.length > 0 ? (
                          <div className="flex flex-col gap-1">
                            {evidences.map((ev, i) => (
                              <a key={i} href={ev} target="_blank" rel="noreferrer" className="text-blue-600 underline text-xs">
                                ملف {i + 1}
                              </a>
                            ))}
                          </div>
                        ) : '-'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <RecentActivities />
    </div>
  );
}
