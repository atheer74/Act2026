import Database from 'better-sqlite3';
import bcrypt from 'bcryptjs';

const db = new Database('activities.db');

// Initialize tables
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT DEFAULT 'user',
    department TEXT,
    section TEXT
  );

  CREATE TABLE IF NOT EXISTS categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT UNIQUE NOT NULL,
    description TEXT,
    icon TEXT
  );

  CREATE TABLE IF NOT EXISTS activities (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    category_id INTEGER NOT NULL,
    user_id INTEGER,
    title TEXT NOT NULL,
    section TEXT,
    description TEXT,
    date TEXT NOT NULL,
    image_path TEXT,
    evidence_path TEXT,
    beneficiaries INTEGER DEFAULT 0,
    cost REAL DEFAULT 0,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES categories(id),
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    content TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
  );
`);

// Seed initial data if empty
const userCount = db.prepare('SELECT count(*) as count FROM users').get() as { count: number };

if (userCount.count === 0) {
  const hashedPassword = bcrypt.hashSync('admin123', 10);
  db.prepare('INSERT INTO users (username, password, role, department, section) VALUES (?, ?, ?, ?, ?)').run('admin', hashedPassword, 'admin', 'الإدارة العامة', 'تكنولوجيا المعلومات');
  console.log('Created default admin user: admin / admin123');
}

// Check if we need to migrate categories to Arabic
const firstCategory = db.prepare('SELECT name FROM categories LIMIT 1').get() as { name: string } | undefined;

if (firstCategory && /^[A-Za-z]/.test(firstCategory.name)) {
  console.log('Detected English categories. Migrating to Arabic...');
  db.prepare('DELETE FROM categories').run();
  // Reset sequence
  db.prepare('DELETE FROM sqlite_sequence WHERE name="categories"').run();
}

const categoryCount = db.prepare('SELECT count(*) as count FROM categories').get() as { count: number };

if (categoryCount.count === 0) {
  const categories = [
    { name: "العودة الطوعية", icon: "Plane" },
    { name: "المبعدين من الاتحاد الاوروبي", icon: "UserX" },
    { name: "المساعدات الاغاثية", icon: "HeartHandshake" },
    { name: "المنح المالية", icon: "Banknote" },
    { name: "العمل التطوعي", icon: "Users" },
    { name: "الاتمتة", icon: "Cpu" },
    { name: "المخيمات", icon: "Tent" },
    { name: "التطوير المؤسسي", icon: "Building2" },
    { name: "الابتكار والابداع", icon: "Lightbulb" },
    { name: "تبسيط الاجراءات", icon: "FileCheck" },
    { name: "الايواء", icon: "Home" },
    { name: "المستلزمات المدرسية", icon: "Backpack" },
    { name: "المستلزمات الصحية", icon: "Stethoscope" },
    { name: "الحماية الاجتماعية", icon: "Shield" },
    { name: "شؤون المرأة", icon: "User" },
    { name: "المشاريع المدرة للدخل", icon: "TrendingUp" },
    { name: "حقوق الانسان", icon: "Scale" },
    { name: "النشاطات الرياضية", icon: "Trophy" },
    { name: "النشاطات العلمية", icon: "Microscope" },
    { name: "نشاطات متنوعة", icon: "LayoutGrid" }
  ];

  const insert = db.prepare('INSERT INTO categories (name, icon) VALUES (?, ?)');
  const insertMany = db.transaction((cats: {name: string, icon: string}[]) => {
    for (const cat of cats) insert.run(cat.name, cat.icon);
  });

  insertMany(categories);
  console.log('Seeded initial categories in Arabic.');
}

// Migration for existing tables if needed (idempotent-ish check)
try {
  db.prepare('SELECT image_path FROM activities LIMIT 1').get();
} catch (e) {
  console.log('Migrating activities table...');
  db.exec('ALTER TABLE activities ADD COLUMN image_path TEXT');
  db.exec('ALTER TABLE activities ADD COLUMN evidence_path TEXT');
  db.exec('ALTER TABLE activities ADD COLUMN section TEXT');
  db.exec('ALTER TABLE activities ADD COLUMN user_id INTEGER REFERENCES users(id)');
}

try {
  db.prepare('SELECT employee_name FROM users LIMIT 1').get();
} catch (e) {
  console.log('Migrating users table...');
  db.exec('ALTER TABLE users ADD COLUMN employee_name TEXT');
}

export default db;
