const cors = require('cors');

const fetch = require('node-fetch');

const express = require('express');
const fs = require('fs');
const path = require('path');
const bodyParser = require('body-parser');

const app = express();
const PORT = process.env.PORT || 4000;

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


app.listen(PORT, () => {
  console.log(`Backend API running on port ${PORT}`);
});
