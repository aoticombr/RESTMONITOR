const http = require('http');
const querystring = require('querystring');

const server = http.createServer((req, res) => {
  if (req.method === 'POST') {
    let data = '';
    req.on('data', chunk => {
      data += chunk.toString();
    });

    req.on('end', () => {
      // Parse the URL-encoded data using querystring.parse()
      const parsedData = querystring.parse(data);
      console.log(parsedData);
      res.end('Data received and logged.');
    });
  } else {
    res.end('Only POST requests are supported.');
  }
});

const port = 3003;
server.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});