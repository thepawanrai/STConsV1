/**
 * ST CONSTRUCTIONS - Production Node.js + Express Server
 * Serves the Vite-built frontend distribution and the /api backend routes.
 */
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import dotenv from 'dotenv';
import { apiRouter } from './server/api.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;
const isProd = process.env.NODE_ENV === 'production' || fs.existsSync(path.join(__dirname, 'dist'));

// Security & sensible request settings
app.use(express.json({ limit: '256kb' }));
app.use(express.urlencoded({ extended: true, limit: '256kb' }));

// Safe Security Headers
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  // Allow framing for AI Studio preview environment if needed
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  next();
});

// Mount API routes BEFORE static fallback
app.use('/api', apiRouter);

// Static assets directory
const distPath = path.join(__dirname, 'dist');
const publicPath = path.join(__dirname, 'public');

if (fs.existsSync(publicPath)) {
  app.use(express.static(publicPath));
}

if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));

  // Client-side SPA routing fallback: serve dist/index.html for any GET not matching an asset or /api
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) {
      return next(); // Leave to API 404
    }
    const indexPath = path.join(distPath, 'index.html');
    if (fs.existsSync(indexPath)) {
      res.sendFile(indexPath);
    } else {
      res.status(503).send('Application is building. Please refresh in a moment.');
    }
  });
} else {
  // Helpful fallback message when dist is not yet built
  app.get('*', (req, res) => {
    if (req.path.startsWith('/api')) {
      return res.status(404).json({ error: 'Endpoint not found' });
    }
    res.send(`
      <!DOCTYPE html>
      <html>
        <head><title>ST Constructions - Production Server</title></head>
        <body style="font-family: sans-serif; padding: 40px; text-align: center;">
          <h2>ST Constructions Corporate Website</h2>
          <p>Production server is active. Build frontend using <code>npm run build</code> to generate the client bundle.</p>
          <p><a href="/api/health">Check API Health Endpoint</a></p>
        </body>
      </html>
    `);
  });
}

// Global error handler
app.use((err, req, res, next) => {
  console.error('[Server Unhandled Error]', err);
  if (req.path.startsWith('/api')) {
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
  res.status(500).send('Internal Server Error');
});

const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`[ST Constructions Server] Running on http://0.0.0.0:${PORT} (PID ${process.pid})`);
  console.log(`[ST Constructions Server] Health endpoint: http://0.0.0.0:${PORT}/api/health`);
});

// Graceful termination
process.on('SIGTERM', () => {
  console.log('[ST Constructions Server] SIGTERM signal received. Closing HTTP server.');
  server.close(() => {
    console.log('[ST Constructions Server] HTTP server closed.');
    process.exit(0);
  });
});
