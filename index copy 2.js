const http = require('http');
const querystring = require('querystring');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const jwt = require('jsonwebtoken');
const formidable = require('formidable');

// Verifique se a pasta "data" existe e a crie, se necessário
const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir);
}

const secretKey = '123456789';

const server = http.createServer((req, res) => {
  console.log('req.url:', req.url);
  console.log('req.method:', req.method);

  const requestData = {
    method: req.method,
    url: req.url,
    headers: req.headers,
    body: null
  };

  let data = '';
  req.on('data', chunk => {
    data += chunk.toString();
  });
  let parsedData = '';
  req.on('end', () => {
    const now = new Date();
    const guid = uuidv4();
    let filename = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}-${now.getDate().toString().padStart(2, '0')}-${now.getHours().toString().padStart(2, '0')}-${now.getMinutes().toString().padStart(2, '0')}-${now.getSeconds().toString().padStart(2, '0')}-${guid}.json`;
    let filePath = path.join(dataDir, filename);
    let contentype = req.headers["content-type"];
    console.log('end..1');
    console.log("content-type:", contentype);

    if (contentype === "application/json") {
      const parsedBody = JSON.parse(data);
      requestData.body = parsedBody;
      saveRequestData(filePath, requestData, res);
    } else if (contentype === `text/xml; charset="utf-8"`) {
      parsedData = querystring.parse(data);
      requestData.body = parsedData;
      saveRequestData(filePath, requestData, res);
    } else if (contentype.includes("multipart/form-data")) {
      const form = new formidable.IncomingForm();
      form.uploadDir = dataDir;
      form.parse(req, (err, fields, files) => {
        if (err) {
          console.error('Erro ao processar o formulário:', err);
          res.writeHead(500, { 'Content-Type': 'text/plain' });
          res.end('Erro ao processar o formulário.');
          return;
        }
        requestData.body = { fields, files };
        saveRequestData(filePath, requestData, res);
      });
    } else {
      parsedData = querystring.parse(data);
      requestData.body = parsedData;
      saveRequestData(filePath, requestData, res);
    }
  });

  const saveRequestData = (filePath, requestData, res) => {
    const requestDataJSON = JSON.stringify(requestData, null, 2);
    fs.writeFile(filePath, requestDataJSON, (err) => {
      if (err) {
        console.error('Erro ao salvar dados da solicitação no arquivo:', err);
        res.end('Erro ao salvar dados da solicitação no arquivo.');
      } else {
        console.log(`Dados da solicitação salvos em ${filePath}`);

        if (req.url === '/token') {
          handleTokenRequest(res, requestData.body);
        } else if (req.url === '/combearer') {
          handleBearerRequest(req, res, requestDataJSON);
        } else if (req.url === '/terceiro') {
          handleTerceiroRequest(res);
        } else {
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(requestDataJSON);
        }
      }
    });
  };

  const handleTokenRequest = (res, parsedData) => {
    console.log('Recebendo solicitação de token...');
    const requestedScope = parsedData.scope || 'default_scope';
    const payload = { user_id: 123, scope: requestedScope };
    const token = jwt.sign(payload, secretKey, { expiresIn: '300s' });

    const tokenResponse = {
      access_token: token,
      expires_in: 300,
      refresh_expires_in: 0,
      token_type: 'Bearer',
      'not-before-policy': 0,
      scope: requestedScope,
    };

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(tokenResponse));
  };

  const handleBearerRequest = (req, res, requestDataJSON) => {
    const authorizationHeader = req.headers['authorization'];
    if (authorizationHeader && authorizationHeader.startsWith('Bearer ')) {
      const token = authorizationHeader.slice(7);
      jwt.verify(token, secretKey, (err, decoded) => {
        if (err) {
          res.writeHead(401, { 'Content-Type': 'text/plain' });
          res.end('Token JWT inválido');
        } else {
          console.log('Token JWT válido', decoded);
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(requestDataJSON);
        }
      });
    } else {
      res.writeHead(401, { 'Content-Type': 'text/plain' });
      res.end('Bearer token não informado');
    }
  };

  const handleTerceiroRequest = (res) => {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    const corpo = { AppointmentId: "6f7d8dc2-c42e-4bd1-9ea6-e118a8017bb5" };
    res.end(JSON.stringify(corpo));
  };
});

const port = 3003;
server.listen(port, () => {
  console.log(`O servidor está em execução em http://localhost:${port}`);
});
