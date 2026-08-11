const http = require('http');
const https = require('https');
const { URL } = require('url');

const PORT = 3000;
const PRETIX_TOKEN = process.env.PRETIX_TOKEN || '<PASTE_YOUR_PRETIX_TOKEN_HERE>';

if (!PRETIX_TOKEN || PRETIX_TOKEN === '<PASTE_YOUR_PRETIX_TOKEN_HERE>') {
  console.warn('Warning: PRETIX_TOKEN is not configured. Set the PRETIX_TOKEN environment variable or paste it into this file.');
}

const server = http.createServer(async (req, res) => {
  const requestUrl = new URL(req.url, `http://${req.headers.host}`);
  const origin = req.headers.origin || '*';

  res.setHeader('Access-Control-Allow-Origin', origin === 'null' ? '*' : origin);
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  if (requestUrl.pathname !== '/proxy') {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not found');
    return;
  }

  const organizer = requestUrl.searchParams.get('organizer');
  const event = requestUrl.searchParams.get('event');

  if (!organizer || !event) {
    res.writeHead(400, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'organizer and event are required' }));
    return;
  }

  const targetUrl = `https://pretix.eu/api/v1/organizers/${organizer}/events/${event}/quotas/?with_availability=true`;

  try {
    const pretixResponse = await fetch(targetUrl, {
      method: 'GET',
      headers: {
        Authorization: `Token ${PRETIX_TOKEN}`,
        Accept: 'application/json',
      },
    });

    const body = await pretixResponse.text();
    const headers = {
      'Content-Type': 'application/json',
    };

    res.writeHead(pretixResponse.status, headers);
    res.end(body);
  } catch (error) {
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: error.message }));
  }
});

server.listen(PORT, () => {
  console.log(`Local proxy running at http://127.0.0.1:${PORT}/proxy`);
  console.log('Set PRETIX_TOKEN in the environment or paste it into proxy-server.js.');
});
