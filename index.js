const http = require('http');
const querystring = require('querystring');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

// Verifique se a pasta "data" existe e a crie, se necessário
const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir);
}

const server = http.createServer((req, res) => {
  console.log(req.url);
  console.log(req.method);

  const requestData = {
    method: req.method,
    url: req.url,
    headers: req.headers,
  };

  let data = '';
  req.on('data', chunk => {
    data += chunk.toString();
  });

  req.on('end', () => {
    // Parse the URL-encoded data using querystring.parse()
    const parsedData = querystring.parse(data);
    requestData.body = parsedData;

    // Salve os dados em um arquivo com base na data e hora atual
    const now = new Date();
    const guid = uuidv4();
    const filename = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}-${now.getDate().toString().padStart(2, '0')}-${now.getHours().toString().padStart(2, '0')}-${now.getMinutes().toString().padStart(2, '0')}-${now.getSeconds().toString().padStart(2, '0')}-${guid}.json`;
    const filePath = path.join(dataDir, filename);

    // Converta os dados da solicitação em formato JSON
    const requestDataJSON = JSON.stringify(requestData, null, 2);

    fs.writeFile(filePath, requestDataJSON, (err) => {
      if (err) {
        console.error('Erro ao salvar dados da solicitação no arquivo:', err);
        res.end('Erro ao salvar dados da solicitação no arquivo.');
      } else {
        console.log(`Dados da solicitação salvos em ${filename}`);
        if (req.url === '/token' && req.method === 'POST') {
          console.log('Recebendo solicitação de token...');

          // Extrair o escopo da solicitação (se enviado)
          const requestedScope = parsedData.scope || 'default_scope';

          // Construir a resposta incluindo o escopo solicitado
          const tokenResponse = {
            access_token: "seu_token_aqui",
            expires_in: 300,
            refresh_expires_in: 0,
            token_type: "Bearer",
            "not-before-policy": 0,
            scope: requestedScope, // Incluindo o escopo na resposta
          };

          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify(tokenResponse));
        } else {
          res.end('Dados da solicitação recebidos e salvos.');
        }
      }
    });
  });

});

const port = 3003;
server.listen(port, () => {
  console.log(`O servidor está em execução em http://localhost:${port}`);
});
