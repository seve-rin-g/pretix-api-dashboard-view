const fs = require('fs');
const https = require('https');
const { URL } = require('url');

const PRETIX_TOKEN = process.env.PRETIX_TOKEN;
const ORGANIZER = process.env.ORGANIZER || 'envelope-soundsystem';
const EVENT = process.env.EVENT || 'campout-26';

if (!PRETIX_TOKEN) {
  console.error('Error: PRETIX_TOKEN environment variable is not set');
  process.exit(1);
}

async function fetchTickets() {
  const url = `https://pretix.eu/api/v1/organizers/${ORGANIZER}/events/${EVENT}/quotas/?with_availability=true`;

  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    
    https.request(urlObj, {
      method: 'GET',
      headers: {
        'Authorization': `Token ${PRETIX_TOKEN}`,
        'Accept': 'application/json',
      },
    }, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        if (res.statusCode === 200) {
          resolve(JSON.parse(body));
        } else {
          reject(new Error(`API returned ${res.statusCode}: ${body}`));
        }
      });
    }).on('error', reject).end();
  });
}

async function main() {
  try {
    console.log(`Fetching tickets for ${ORGANIZER}/${EVENT}...`);
    const data = await fetchTickets();
    
    const output = {
      timestamp: new Date().toISOString(),
      results: data.results
    };
    
    fs.writeFileSync('tickets.json', JSON.stringify(output, null, 2));
    console.log('Successfully wrote tickets.json');
    process.exit(0);
  } catch (error) {
    console.error('Error fetching tickets:', error.message);
    process.exit(1);
  }
}

main();
