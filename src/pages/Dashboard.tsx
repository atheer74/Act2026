import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import * as LucideIcons from 'lucide-react';
import { Send, MessageSquare } from 'lucide-react';

interface Category {
  id: number;
  name: string;
  icon: string;
}

interface Message {
  id: number;
  user_id: number;
  username: string;
  department: string;
  content: string;
  created_at: string;
}

// Helper to dynamically get icon component
const getIcon = (iconName: string) => {
  const Icon = (LucideIcons as any)[iconName] || LucideIcons.HelpCircle;
  return <Icon size={32} className="text-white" />;
};

export function Dashboard() {
  const { token, user } = useAuth();
  const navigate = useNavigate();
  const [categories, setCategories] = useState<Category[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [catsRes, msgsRes] = await Promise.all([
          fetch('/api/categories', { headers: { Authorization: `Bearer ${token}` } }),
          fetch('/api/messages', { headers: { Authorization: `Bearer ${token}` } })
        ]);
        
        const catsData = await catsRes.json();
        const msgsData = await msgsRes.json();

        setCategories(catsData);
        setMessages(msgsData);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    
    // Poll for new messages every 10 seconds
    const interval = setInterval(async () => {
      try {
        const res = await fetch('/api/messages', { headers: { Authorization: `Bearer ${token}` } });
        const data = await res.json();
        setMessages(data);
      } catch (err) {
        console.error(err);
      }
    }, 10000);

    return () => clearInterval(interval);
  }, [token]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    try {
      const res = await fetch('/api/messages', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({ content: newMessage }),
      });
      
      const message = await res.json();
      setMessages([message, ...messages]);
      setNewMessage('');
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-slate-500">جاري تحميل البيانات...</div>;
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center mb-10">
        <motion.h1 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-4xl font-bold text-slate-900 mb-2"
        >
          نظام توثيق النشاطات المؤسسية
        </motion.h1>
        <p className="text-slate-500 text-lg">منصة موحدة لتوثيق ومتابعة كافة الأنشطة والفعاليات</p>
      </div>

      {/* 3D Icons Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
        {categories.map((category, index) => (
          <motion.div
            key={category.id}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.05 }}
            whileHover={{ 
              scale: 1.05, 
              rotateX: 10, 
              rotateY: 10,
              boxShadow: "0px 20px 30px rgba(0,0,0,0.15)"
            }}
            onClick={() => navigate(`/activities/${category.id}`)}
            className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl p-6 cursor-pointer flex flex-col items-center justify-center text-center h-40 shadow-lg transform transition-all perspective-1000"
            style={{ transformStyle: 'preserve-3d' }}
          >
            <div className="bg-white/20 p-4 rounded-full mb-3 backdrop-blur-sm shadow-inner">
              {getIcon(category.icon)}
            </div>
            <h3 className="text-white font-bold text-sm md:text-base leading-tight drop-shadow-md">
              {category.name}
            </h3>
          </motion.div>
        ))}
      </div>

      {/* Communication Feed */}
      <div className="mt-12 bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-6 border-b border-slate-200 bg-slate-50 flex items-center gap-3">
          <MessageSquare className="text-indigo-600" />
          <h2 className="text-xl font-bold text-slate-900">تحديثات الدوائر والأقسام</h2>
        </div>
        
        <div className="p-6">
          {/* Message Input */}
          <form onSubmit={handleSendMessage} className="mb-8 flex gap-4">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="شارك تحديثاً أو معلومة جديدة..."
              className="flex-1 px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
            />
            <button 
              type="submit"
              className="bg-indigo-600 text-white px-6 py-3 rounded-xl hover:bg-indigo-700 transition-colors flex items-center gap-2 font-bold shadow-md"
            >
              <Send size={20} className="rtl:rotate-180" />
              نشر
            </button>
          </form>

          {/* Messages List */}
          <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
            {messages.length === 0 ? (
              <p className="text-center text-slate-400 py-8">لا توجد تحديثات حالياً</p>
            ) : (
              messages.map((msg) => (
                <motion.div 
                  key={msg.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="bg-slate-50 p-4 rounded-xl border border-slate-100"
                >
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-700 font-bold text-xs">
                        {msg.username.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <span className="font-bold text-slate-900 block text-sm">{msg.username}</span>
                        <span className="text-xs text-indigo-600 font-medium">{msg.department || 'عام'}</span>
                      </div>
                    </div>
                    <span className="text-xs text-slate-400" dir="ltr">
                      {new Date(msg.created_at).toLocaleString('ar-EG')}
                    </span>
                  </div>
                  <p className="text-slate-700 leading-relaxed pr-10">{msg.content}</p>
                </motion.div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
