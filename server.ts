import express from 'express';
import { createServer as createViteServer } from 'vite';
import db from './src/db.js'; // Note the .js extension for runtime
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import path from 'path';
import { fileURLToPath } from 'url';
import multer from 'multer';
import fs from 'fs';
import os from 'os';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-key-change-in-prod';

// Configure Multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, 'uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir);
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ storage: storage }).fields([
  { name: 'evidence', maxCount: 10 }
]);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());
  app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

  // API Routes
  
  // Server Info
  app.get('/api/server-info', (req, res) => {
    // Check if running in a cloud environment (like Google Cloud Run / AI Studio)
    if (process.env.K_SERVICE || process.env.CLOUD_RUN_JOB || process.env.HOSTNAME?.includes('run.app')) {
      return res.json({ 
        isCloud: true, 
        message: 'التطبيق يعمل حالياً على خادم سحابي.' 
      });
    }

    const interfaces = os.networkInterfaces();
    let localIp = 'localhost';
    
    for (const name of Object.keys(interfaces)) {
      for (const iface of interfaces[name]!) {
        // Skip internal and non-IPv4 addresses
        if (iface.family === 'IPv4' && !iface.internal) {
          localIp = iface.address;
          break;
        }
      }
      if (localIp !== 'localhost') break;
    }
    
    res.json({ ip: localIp, port: PORT, isCloud: false });
  });

  // Auth
  app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username) as any;

    if (!user || !bcrypt.compareSync(password, user.password)) {
      return res.status(401).json({ error: 'بيانات الاعتماد غير صحيحة' });
    }

    const token = jwt.sign({ id: user.id, username: user.username, role: user.role, department: user.department }, JWT_SECRET, { expiresIn: '24h' });
    res.json({ token, user: { id: user.id, username: user.username, role: user.role, department: user.department, section: user.section } });
  });

  // Middleware to verify token
  const authenticate = (req: any, res: any, next: any) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: 'لم يتم توفير رمز الدخول' });

    const token = authHeader.split(' ')[1];
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      req.user = decoded;
      next();
    } catch (err) {
      res.status(401).json({ error: 'رمز الدخول غير صالح' });
    }
  };

  // Users Management (Admin only)
  app.get('/api/users', authenticate, (req: any, res) => {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'غير مصرح' });
    const users = db.prepare('SELECT id, username, role, department, section, employee_name FROM users').all();
    res.json(users);
  });

  app.post('/api/users', authenticate, (req: any, res) => {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'غير مصرح' });
    const { username, password, role, department, section, employee_name } = req.body;
    try {
      const hashedPassword = bcrypt.hashSync(password, 10);
      const result = db.prepare('INSERT INTO users (username, password, role, department, section, employee_name) VALUES (?, ?, ?, ?, ?, ?)').run(username, hashedPassword, role || 'user', department, section, employee_name);
      res.json({ id: result.lastInsertRowid, username, role, department, section, employee_name });
    } catch (err: any) {
      res.status(400).json({ error: 'اسم المستخدم موجود بالفعل' });
    }
  });

  app.delete('/api/users/:id', authenticate, (req: any, res) => {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'غير مصرح' });
    const { id } = req.params;
    try {
      db.prepare('DELETE FROM users WHERE id = ?').run(id);
      res.json({ success: true });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  // Messages (Communication)
  app.get('/api/messages', authenticate, (req, res) => {
    const messages = db.prepare(`
      SELECT messages.*, users.username, users.department 
      FROM messages 
      JOIN users ON messages.user_id = users.id 
      ORDER BY created_at DESC LIMIT 50
    `).all();
    res.json(messages);
  });

  app.post('/api/messages', authenticate, (req: any, res) => {
    const { content } = req.body;
    try {
      const result = db.prepare('INSERT INTO messages (user_id, content) VALUES (?, ?)').run(req.user.id, content);
      const newMessage = db.prepare(`
        SELECT messages.*, users.username, users.department 
        FROM messages 
        JOIN users ON messages.user_id = users.id 
        WHERE messages.id = ?
      `).get(result.lastInsertRowid);
      res.json(newMessage);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  // Categories
  app.get('/api/categories', (req, res) => {
    const categories = db.prepare('SELECT * FROM categories ORDER BY id').all();
    res.json(categories);
  });

  app.post('/api/categories', authenticate, (req, res) => {
    const { name, description, icon } = req.body;
    try {
      const result = db.prepare('INSERT INTO categories (name, description, icon) VALUES (?, ?, ?)').run(name, description, icon);
      res.json({ id: result.lastInsertRowid, name, description, icon });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  // Activities
  app.get('/api/activities/recent', (req, res) => {
    const activities = db.prepare(`
      SELECT activities.id, activities.title, activities.date, activities.evidence_path, categories.name as category_name
      FROM activities 
      JOIN categories ON activities.category_id = categories.id
      ORDER BY activities.date DESC LIMIT 12
    `).all();
    res.json(activities);
  });

  app.get('/api/activities/all', authenticate, (req: any, res) => {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'غير مصرح' });
    const activities = db.prepare(`
      SELECT activities.*, categories.name as category_name, users.department as user_department, users.section as user_section
      FROM activities 
      JOIN categories ON activities.category_id = categories.id
      LEFT JOIN users ON activities.user_id = users.id
      ORDER BY activities.date DESC
    `).all();
    res.json(activities);
  });

  app.get('/api/activities', authenticate, (req: any, res) => {
    const { category_id } = req.query;
    let query = `
      SELECT activities.*, categories.name as category_name, users.department as user_department, users.section as user_section
      FROM activities 
      JOIN categories ON activities.category_id = categories.id
      LEFT JOIN users ON activities.user_id = users.id
    `;
    const params = [];

    if (category_id) {
      query += ' WHERE category_id = ?';
      params.push(category_id);
    }
    
    query += ' ORDER BY date DESC';

    const activities = db.prepare(query).all(...params);
    res.json(activities);
  });

  app.post('/api/activities', authenticate, upload, (req: any, res) => {
    const { category_id, title, description, date, notes } = req.body;
    const files = req.files as { [fieldname: string]: Express.Multer.File[] };
    
    let evidence_paths: string[] = [];
    if (files['evidence']) {
      evidence_paths = files['evidence'].map(f => `/uploads/${f.filename}`);
    }

    const evidence_path_str = evidence_paths.length > 0 ? JSON.stringify(evidence_paths) : null;

    try {
      const result = db.prepare(`
        INSERT INTO activities (category_id, user_id, title, description, date, evidence_path, notes)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(category_id, req.user.id, title, description, date, evidence_path_str, notes);
      
      res.json({ 
        id: result.lastInsertRowid, 
        category_id, title, description, date, evidence_path: evidence_path_str, notes 
      });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  app.delete('/api/activities/:id', authenticate, (req: any, res) => {
    const { id } = req.params;
    try {
      const activity = db.prepare('SELECT user_id FROM activities WHERE id = ?').get(id) as any;
      if (!activity) return res.status(404).json({ error: 'النشاط غير موجود' });
      
      if (req.user.role !== 'admin' && activity.user_id !== req.user.id) {
        return res.status(403).json({ error: 'غير مصرح لك بحذف هذا النشاط' });
      }

      db.prepare('DELETE FROM activities WHERE id = ?').run(id);
      res.json({ success: true });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  // Vite middleware
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true, host: '0.0.0.0' },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Serve static files in production
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
