const http = require('http');

const data = JSON.stringify({
  title: 'Test Note',
  body: 'Test Body'
});

const options = {
  hostname: 'localhost',
  port: 3001,
  path: '/api/projects/54e53109-9b7c-4d29-8f71-a67e666dd052/notes',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
};

const req = http.request(options, (res) => {
  let responseData = '';
  res.on('data', (chunk) => { responseData += chunk; });
  res.on('end', () => {
    console.log('Status:', res.statusCode);
    console.log('Response:', responseData);
  });
});

req.on('error', (e) => {
  console.error(`problem with request: ${e.message}`);
});

req.write(data);
req.end();
