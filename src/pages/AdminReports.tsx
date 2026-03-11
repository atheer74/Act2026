import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Printer, Search, Download } from 'lucide-react';
import { exportToPDF, exportToDOCX } from '../utils/exportUtils';

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

export function AdminReports() {
  const { token } = useAuth();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchActivities();
  }, []);

  const fetchActivities = async () => {
    try {
      const res = await fetch('/api/activities/all', {
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

  const filteredActivities = activities.filter(a => 
    a.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    a.user_department?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    a.user_section?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    a.category_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 print:hidden">
        <div>
          <h2 className="text-xl font-bold text-slate-900">التقارير الشاملة</h2>
          <p className="text-slate-500">عرض وطباعة تقارير جميع الأنشطة في النظام</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
            <input 
              type="text" 
              placeholder="بحث في التقارير..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-64 pr-10 pl-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
            />
          </div>
          <div className="flex gap-2">
            <button onClick={() => exportToPDF('admin-report-container', 'تقرير_الأنشطة_الشامل')} className="flex items-center gap-2 text-white bg-red-600 hover:bg-red-700 px-4 py-2 rounded-lg font-medium transition-colors">
              <Download size={18} />
              PDF
            </button>
            <button onClick={() => exportToDOCX('admin-report-container', 'تقرير_الأنشطة_الشامل')} className="flex items-center gap-2 text-white bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg font-medium transition-colors">
              <Download size={18} />
              DOCX
            </button>
            <button onClick={() => window.print()} className="flex items-center gap-2 text-indigo-600 hover:text-indigo-800 bg-indigo-50 px-4 py-2 rounded-lg font-medium transition-colors">
              <Printer size={18} />
              طباعة
            </button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="p-8 text-center text-slate-500">جاري تحميل البيانات...</div>
      ) : (
        <div className="bg-white p-8 shadow-sm border border-slate-200 rounded-xl print:shadow-none print:border-none print:p-0">
          {/* A4 Container */}
          <div id="admin-report-container" className="w-full max-w-[297mm] mx-auto bg-white print:max-w-none">
            {/* Logo for Print/PDF */}
            <div className="text-center mb-6 hidden print:block">
              <img src="/logo.svg" alt="Logo" className="h-24 mx-auto" />
            </div>
            
            {/* Header */}
            <div className="border-b-2 border-black pb-4 mb-4 flex justify-between items-end">
              <div className="text-right">
                <h3 className="font-bold text-xl">تقرير الأنشطة الشامل</h3>
                <h3 className="font-bold text-lg text-slate-600">النظام المركزي لتوثيق الأنشطة</h3>
              </div>
              <div className="text-left">
                <p className="font-medium">تاريخ التقرير: {new Date().toLocaleDateString('ar-EG')}</p>
                <p className="font-medium">إجمالي الأنشطة: {filteredActivities.length}</p>
              </div>
            </div>

            {/* Table */}
            <table className="w-full border-collapse border border-black text-sm">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border border-black p-2 w-12 text-center">ت</th>
                  <th className="border border-black p-2 w-32 text-center">الدائرة / القسم</th>
                  <th className="border border-black p-2 w-32 text-center">اسم النشاط</th>
                  <th className="border border-black p-2 w-32 text-center">التبويب</th>
                  <th className="border border-black p-2 text-center">وصف النشاط</th>
                  <th className="border border-black p-2 w-24 text-center print:hidden">صورة</th>
                  <th className="border border-black p-2 w-24 text-center print:hidden">الدليل</th>
                </tr>
              </thead>
              <tbody>
                {filteredActivities.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="border border-black p-4 text-center text-slate-500">لا توجد بيانات مطابقة للبحث</td>
                  </tr>
                ) : (
                  filteredActivities.map((activity, index) => (
                    <tr key={activity.id} className="break-inside-avoid">
                      <td className="border border-black p-2 text-center">{index + 1}</td>
                      <td className="border border-black p-2 text-center">
                        <div className="font-bold">{activity.user_department || '-'}</div>
                        <div className="text-xs text-slate-600">{activity.user_section || '-'}</div>
                      </td>
                      <td className="border border-black p-2 font-bold">{activity.title}</td>
                      <td className="border border-black p-2 text-center">{activity.category_name}</td>
                      <td className="border border-black p-2 text-justify">{activity.description}</td>
                      <td className="border border-black p-2 text-center print:hidden">
                        {activity.image_path ? (
                          <img src={activity.image_path} alt="Activity" className="w-20 h-20 object-cover mx-auto border border-gray-300" />
                        ) : '-'}
                      </td>
                      <td className="border border-black p-2 text-center print:hidden">
                        {activity.evidence_path ? (
                          <a href={activity.evidence_path} target="_blank" rel="noreferrer" className="text-blue-600 underline">عرض الملف</a>
                        ) : '-'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
