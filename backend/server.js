const cors = require('cors');
const fetch = require('node-fetch');
const multer = require('multer');
const express = require('express');
const fs = require('fs');
const path = require('path');
const bodyParser = require('body-parser');
const crypto = require('crypto');

// Multer setup for image uploads
const imageStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, 'images'));
  },
  filename: function (req, file, cb) {
    // Use original name or timestamped name
    const ext = path.extname(file.originalname);
    const base = path.basename(file.originalname, ext);
    cb(null, base + '-' + Date.now() + ext);
  }
});
const upload = multer({ storage: imageStorage });
const app = express();
const PORT = process.env.PORT || 4000;

// Serve static images from /images
app.use('/images', express.static(path.join(__dirname, 'images')));

app.use(cors());
app.use(bodyParser.json());

// Proxy endpoint to get agencies from eCFR and store locally
app.get('/api/agents', async (req, res) => {
  try {
    const filePath = path.join(__dirname, 'data', 'agencies.json');
    let useLocal = false;
    if (fs.existsSync(filePath)) {
      const stats = fs.statSync(filePath);
      const now = Date.now();
      const mtime = new Date(stats.mtime).getTime();
      const oneDay = 24 * 60 * 60 * 1000;
      if (now - mtime < oneDay) {
        useLocal = true;
      }
    }

    if (useLocal) {
      fs.readFile(filePath, 'utf8', (err, content) => {
        if (err) {
          return res.status(500).json({ error: 'Failed to read local agencies file' });
        }
        try {
          const data = JSON.parse(content);
          return res.json(data);
        } catch (e) {
          return res.status(500).json({ error: 'Invalid JSON in local agencies file' });
        }
      });
    } else {
      // Fetch from remote and store locally
      const response = await fetch('https://www.ecfr.gov/api/admin/v1/agencies');
      if (!response.ok) {
        return res.status(502).json({ error: 'Failed to fetch agencies from eCFR' });
      }
      const data = await response.json();
      fs.mkdirSync(path.dirname(filePath), { recursive: true });
      fs.writeFile(filePath, JSON.stringify(data, null, 2), (err) => {
        if (err) {
          // Log error but still return data
          console.error('Failed to store agencies.json:', err);
        }
        // Always return the data to the client
        return res.json(data);
      });
    }
  } catch (err) {
    res.status(500).json({ error: 'Error fetching agencies', details: err.message });
  }
});

// Proxy for /api/search/count
app.get('/api/search/count', async (req, res) => {
  try {
    const { agency, child, query } = req.query;
    let url = `https://www.ecfr.gov/api/search/v1/count?agency_slugs%5B%5D=${encodeURIComponent(child || agency)}`;
    if (query) url += `&query=${encodeURIComponent(query)}`;
    const response = await fetch(url);
    if (!response.ok) return res.status(502).json({ error: 'Failed to fetch count' });
    const data = await response.json();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'Error fetching count', details: err.message });
  }
});

// Proxy for /api/search/daily
app.get('/api/search/daily', async (req, res) => {
  try {
    const { agency, child, query } = req.query;
    let url = `https://www.ecfr.gov/api/search/v1/counts/daily?agency_slugs%5B%5D=${encodeURIComponent(child || agency)}`;
    if (query) url += `&query=${encodeURIComponent(query)}`;
    const response = await fetch(url);
    if (!response.ok) return res.status(502).json({ error: 'Failed to fetch daily counts' });
    const data = await response.json();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'Error fetching daily counts', details: err.message });
  }
});

// Proxy for /api/search/titles
app.get('/api/search/titles', async (req, res) => {
  try {
    const { agency, child, query } = req.query;
    let url = `https://www.ecfr.gov/api/search/v1/counts/titles?agency_slugs%5B%5D=${encodeURIComponent(child || agency)}`;
    if (query) url += `&query=${encodeURIComponent(query)}`;
    const response = await fetch(url);
    if (!response.ok) return res.status(502).json({ error: 'Failed to fetch title counts' });
    const data = await response.json();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'Error fetching title counts', details: err.message });
  }
});


// Proxy endpoint to get activities from eCFR and store locally
app.get('/api/activities', async (req, res) => {
  try {
    const filePath = path.join(__dirname, 'data', 'activities.json');
    fs.readFile(filePath, 'utf8', (err, content) => {
      if (err) {
        return res.status(500).json({ error: 'Failed to read local activities file' });
      }
      try {
        const data = JSON.parse(content);
        return res.json(data);
      } catch (e) {
        return res.status(500).json({ error: 'Invalid JSON in local activities file' });
      }
    });

  } catch (err) {
    res.status(500).json({ error: 'Error fetching activities', details: err.message });
  }
});


// Endpoint to upload image and metadata
app.post('/api/upload-activity', upload.single('image'), (req, res) => {
  try {
    const filePath = path.join(__dirname, 'data', 'activities.json');
    const metadata = req.body;
    const file = req.file;
    if (!file) {
      return res.status(400).json({ error: 'No image file uploaded' });
    }
    // Add image path to metadata
    metadata.imageUrl = `/images/${file.filename}`;

    // Read existing activities
    let activities = [];
    if (fs.existsSync(filePath)) {
      try {
        const content = fs.readFileSync(filePath, 'utf8');
        activities = JSON.parse(content);
        if (!Array.isArray(activities)) activities = [];
      } catch (e) {
        activities = [];
      }
    }
    // Add new activity
    activities.push(metadata);
    fs.writeFileSync(filePath, JSON.stringify(activities, null, 2));
    res.json({ message: 'Activity uploaded', activity: metadata });
  } catch (err) {
    res.status(500).json({ error: 'Error uploading activity', details: err.message });
  }
});

app.get('/api/users', async (req, res) => {
  try {
    const filePath = path.join(__dirname, 'data', 'users.json');
    fs.readFile(filePath, 'utf8', (err, content) => {
      if (err) {
        return res.status(500).json({ error: 'Failed to read local users file' });
      }
      try {
        const data = JSON.parse(content);
        return res.json(data);
      } catch (e) {
        return res.status(500).json({ error: 'Invalid JSON in local users file' });
      }
    });

  } catch (err) {
    res.status(500).json({ error: 'Error fetching users', details: err.message });
  }
});

// Chat endpoints
app.get('/api/chat/messages', (req, res) => {
  const filePath = path.join(__dirname, 'data', 'messages.json');
  fs.readFile(filePath, 'utf8', (err, content) => {
    if (err) return res.json([]);
    try {
      res.json(JSON.parse(content));
    } catch (e) {
      res.json([]);
    }
  });
});

app.post('/api/chat/messages', (req, res) => {
  const { text, user, room = 'general' } = req.body;
  const message = { id: crypto.randomUUID(), text, user, room, timestamp: new Date().toISOString() };
  const filePath = path.join(__dirname, 'data', 'messages.json');

  let messages = [];
  if (fs.existsSync(filePath)) {
    try {
      messages = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    } catch (e) { }
  }

  messages.push(message);
  fs.writeFileSync(filePath, JSON.stringify(messages, null, 2));
  res.json(message);
});

app.get('/api/chat/rooms', (req, res) => {
  const filePath = path.join(__dirname, 'data', 'rooms.json');
  fs.readFile(filePath, 'utf8', (err, content) => {
    if (err) return res.json(['general']);
    try {
      res.json(JSON.parse(content));
    } catch (e) {
      res.json(['general']);
    }
  });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Backend API running on port ${PORT}`);
});
