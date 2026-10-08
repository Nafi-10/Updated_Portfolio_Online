import express from 'express';
import path from 'path';
import fs from 'fs';

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json({ limit: '10mb' }));

// API route to get current portfolio data
app.get('/api/data', (req, res) => {
  const dataPath = path.join(process.cwd(), 'data', 'portfolio-data.json');
  if (fs.existsSync(dataPath)) {
    try {
      const data = fs.readFileSync(dataPath, 'utf-8');
      res.json(JSON.parse(data));
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  } else {
    res.status(404).json({ error: 'Data file not found' });
  }
});

// API route to update portfolio data file on disk
app.post('/api/data', (req, res) => {
  try {
    const dataPath = path.join(process.cwd(), 'data', 'portfolio-data.json');
    fs.writeFileSync(dataPath, JSON.stringify(req.body, null, 2), 'utf-8');
    res.json({ success: true, message: 'Portfolio data updated successfully on disk' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Serve the htdocs-style root and admin folder.
const rootFolder = process.cwd();
const mainFolder = rootFolder;
const adminFolder = path.join(rootFolder, 'admin');

// 1. First serve static files for /admin routes
app.use('/admin', express.static(adminFolder));

// 2. Serve static files for /main routes
app.use('/main', express.static(mainFolder));

// 3. Serve main static files directly at root (for relative paths like js/main.js, css/style.css)
app.use(express.static(mainFolder));

// 4. Serve rootFolder static files
app.use(express.static(rootFolder));

// Primary Route Handlers
app.get('/', (req, res) => {
  res.sendFile(path.join(mainFolder, 'index.html'));
});

app.get('/admin', (req, res) => {
  res.sendFile(path.join(adminFolder, 'index.html'));
});

app.get('/admin/dashboard', (req, res) => {
  res.sendFile(path.join(adminFolder, 'dashboard.html'));
});

// For missing asset requests (.js, .css, .json, images, fonts), return 404 instead of HTML fallback
app.use((req, res, next) => {
  if (/\.(js|css|json|jpg|jpeg|png|gif|svg|ico|woff|woff2|ttf|eot)$/i.test(req.path)) {
    return res.status(404).send('Asset not found');
  }
  next();
});

// Catch-all fallback to portfolio main for page navigation
app.get('*', (req, res) => {
  if (req.path.startsWith('/admin')) {
    res.sendFile(path.join(adminFolder, 'dashboard.html'));
  } else {
    res.sendFile(path.join(mainFolder, 'index.html'));
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Portfolio server running on http://0.0.0.0:${PORT}`);
});
