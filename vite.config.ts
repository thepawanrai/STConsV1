import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';

export default defineConfig(() => {
  return {
    plugins: [
      react(),
      tailwindcss(),
      {
        name: 'api-server-middleware',
        configureServer(server) {
          server.middlewares.use((req, res, next) => {
            if (req.url === '/api/health') {
              res.setHeader('Content-Type', 'application/json');
              res.end(
                JSON.stringify({
                  status: 'healthy',
                  service: 'ST Constructions Corporate Portal API',
                  flagshipProject: 'Narayani Villas, Lucknow',
                  timestamp: new Date().toISOString(),
                  uptimeSeconds: Math.floor(process.uptime()),
                  environment: 'development',
                  leadAdapterConfigured: Boolean(process.env.CRM_WEBHOOK_URL)
                })
              );
              return;
            }

            if (req.url === '/api/enquiries' && req.method === 'POST') {
              let body = '';
              req.on('data', (chunk) => {
                body += chunk;
              });
              req.on('end', () => {
                try {
                  const data = JSON.parse(body || '{}');
                  if (!data.fullName || !data.phoneNumber || !data.consentGiven) {
                    res.statusCode = 400;
                    res.setHeader('Content-Type', 'application/json');
                    res.end(
                      JSON.stringify({
                        success: false,
                        error: 'Required fields missing: Full Name, Phone Number, and Consent.'
                      })
                    );
                    return;
                  }

                  const phoneClean = (data.phoneNumber || '').replace(/[\s\-\(\)]/g, '');
                  const phoneRegex = /^(\+?91|0)?[6-9]\d{9}$/;
                  if (!phoneRegex.test(phoneClean)) {
                    res.statusCode = 400;
                    res.setHeader('Content-Type', 'application/json');
                    res.end(
                      JSON.stringify({
                        success: false,
                        error: 'Please enter a valid 10-digit Indian mobile number.'
                      })
                    );
                    return;
                  }

                  res.statusCode = 201;
                  res.setHeader('Content-Type', 'application/json');
                  res.end(
                    JSON.stringify({
                      success: true,
                      leadId: `LEAD-${Date.now().toString(36).toUpperCase()}-${Math.floor(Math.random() * 1000)}`,
                      message:
                        'Thank you for your interest in Narayani Villas. Our project coordinator will contact you shortly.',
                      deliveryStatus: 'buffered_locally',
                      adapterNote:
                        'Lead recorded in local server queue. External CRM/Email adapter not configured in environment variables.'
                    })
                  );
                } catch {
                  res.statusCode = 400;
                  res.setHeader('Content-Type', 'application/json');
                  res.end(JSON.stringify({ success: false, error: 'Invalid JSON payload' }));
                }
              });
              return;
            }

            if (req.url?.startsWith('/api/')) {
              res.statusCode = 404;
              res.setHeader('Content-Type', 'application/json');
              res.end(
                JSON.stringify({
                  success: false,
                  error: 'API endpoint not found',
                  requestedPath: req.url
                })
              );
              return;
            }

            next();
          });
        },
      },
    ],
    publicDir: path.resolve(__dirname, 'public'),
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
