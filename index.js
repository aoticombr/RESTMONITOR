const http = require('http');
const querystring = require('querystring');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const jwt = require('jsonwebtoken');

// Verifique se a pasta "data" existe e a crie, se necessário
const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir);
}

const secretKey = '123456789';

// ... (seu código anterior)

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

        if (req.url === '/token') {
          console.log('Recebendo solicitação de token...');
        
          // Extrair o escopo da solicitação (se enviado)
          const requestedScope = parsedData.scope || 'default_scope';
        
          // Construir o payload do token com as informações necessárias
          const payload = {
            user_id: 123, // Substitua isso pelo ID do usuário apropriado
            scope: requestedScope,
          };
        
          // Chave secreta para assinar o token (substitua por sua chave real)
        
          // Gerar o token JWT
          const token = jwt.sign(payload, secretKey, { expiresIn: '300s' });
        
          // Construir a resposta incluindo o token JWT
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
        } else {
          // Aqui você pode adicionar a validação do token JWT
          const authorizationHeader = req.headers['authorization'];

          // Verificar se o cabeçalho "Authorization" está presente e começa com "Bearer "
          if (authorizationHeader && authorizationHeader.startsWith('Bearer ')) {
            const token = authorizationHeader.slice(7); // Remover "Bearer " do cabeçalho

            // Verificar se o token JWT é válido
            jwt.verify(token, secretKey, (err, decoded) => {
              if (err) {
                res.writeHead(401, { 'Content-Type': 'text/plain' });
                res.end('Token JWT inválido');
              } else {
                // Token JWT válido, você pode acessar os dados decodificados em 'decoded'
                console.log('Token JWT válido', decoded);

                // Agora você pode lidar com diferentes métodos HTTP
                if (req.method === 'POST') {
                  // Lógica para o método POST
                  // ...
                  res.writeHead(200, { 'Content-Type': 'text/plain' });
                  res.end('Requisição POST tratada');
                } else if (req.method === 'GET') {
                  // Lógica para o método GET
                  // ...
                  res.writeHead(200, { 'Content-Type': 'text/plain' });
                  res.end('Requisição GET tratada');
                } else {
                  // Outros métodos HTTP
                  res.writeHead(405, { 'Content-Type': 'text/plain' });
                  res.end('Método HTTP não permitido');
                }
              }
            });
          } else {
            // Token JWT ausente no cabeçalho "Authorization", devolva o contexto e o corpo da solicitação
            res.writeHead(200, { 'Content-Type': 'application/json' });
             res.end(requestDataJSON);
          }
        }
      }
    });
  });
});

const port = 3003;
server.listen(port, () => {
  console.log(`O servidor está em execução em http://localhost:${port}`);
});

