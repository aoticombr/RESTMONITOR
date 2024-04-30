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
  console.log('req.url:',req.url);
  console.log('req.method:',req.method);

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
  let parsedData =  ''
  req.on('end', () => {
    // Salve os dados em um arquivo com base na data e hora atual
    const now = new Date();
    const guid = uuidv4();
    let filename = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}-${now.getDate().toString().padStart(2, '0')}-${now.getHours().toString().padStart(2, '0')}-${now.getMinutes().toString().padStart(2, '0')}-${now.getSeconds().toString().padStart(2, '0')}-${guid}.json`;
    let filePath = path.join(dataDir, filename);
    let contentype = req.headers["content-type"] 
    // Parse the URL-encoded data using querystring.parse()
    console.log('end..1');
    //requestData.body = parsedData;
    //console.log('data:',data);
    if (contentype === "application/json") {
      const parsedBody = JSON.parse(data);
      requestData.body = parsedBody;
    } else  if (contentype === `text/xml; charset="utf-8"`) {
      parsedData = querystring.parse(data);
      requestData.body = parsedData;
    } else if (contentype.includes("multipart/form-data")){
      contentype = "multipart/form-data"
      parsedData = querystring.parse(data);
      requestData.body = parsedData;
    } else {
       parsedData = querystring.parse(data);
      requestData.body = parsedData;
    }
    
    let requestDataJSON = '';
    console.log("content-type:",contentype )
    // Converta os dados da solicitação em formato JSON
                                         
    if (contentype === "application/json") {
      
      requestDataJSON = JSON.stringify(requestData, null, 2);
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
          } 
          if (req.url === '/combearer') {
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
  
                  res.writeHead(200, { 'Content-Type': 'application/json' });
                  res.end(requestDataJSON);
                }
              });
  
              res.writeHead(200, { 'Content-Type': 'application/json' });
              res.end(requestDataJSON);
            } else {
              res.writeHead(401, { 'Content-Type': 'text/plain' });
                  res.end('Bearer token não informado');
            }
          } if (req.url === '/terceiro') {
            res.writeHead(200, { 'Content-Type': 'application/json' });
            const corpo = {AppointmentId:"6f7d8dc2-c42e-4bd1-9ea6-e118a8017bb5"}
            res.end(JSON.stringify(corpo));  
          } else {
            
              // Token JWT ausente no cabeçalho "Authorization", devolva o contexto e o corpo da solicitação
              res.writeHead(200, { 'Content-Type': 'application/json' });
               res.end(requestDataJSON);
              
               //console.log (requestData)
            
          }
        }
      });
    } else  if ((contentype === `application/xml`) ||
          (contentype === `text/xml; charset="utf-8"`) ||
          (contentype === `text/xml`)){
          console.log('fazendo parse' )   
          if (data) {   
            console.log('dado existe' )  
            console.log('salvando...' )           
              requestData.body = data
              requestDataJSON = JSON.stringify(requestData, null, 2);
              fs.writeFile(filePath, requestDataJSON, (err) => {
                if (err) {
                  console.error('Erro ao salvar dados da solicitação no arquivo:', err);
                  res.end('Erro ao salvar dados da solicitação no arquivo.');
                } else {
                  console.log('dado salvo' )  
                  console.log(`Dados da solicitação salvos em ${filename}`);
                  // Token JWT ausente no cabeçalho "Authorization", devolva o contexto e o corpo da solicitação
                  console.log('enviando resposta' )  
                  res.writeHead(200, { 'Content-Type': req.headers["content-type"] });
                  res.end(data);      
                }
              });
          } else {
                console.error('Erro: corpo da solicitação vazio.');
                res.writeHead(400, { 'Content-Type': 'text/plain' });
                res.end('Erro: corpo da solicitação vazio.');
          }
          console.log('fazendo parse fim' )
    } else if (contentype === "multipart/form-data") {                 
      console.log('fazendo parse' )   
      if (data) {   
        console.log('dado existe' )  
        console.log('salvando...' )           
          requestData.body = data
          requestDataJSON = JSON.stringify(requestData, null, 2);
          fs.writeFile(filePath, requestDataJSON, (err) => {
            if (err) {
              console.error('Erro ao salvar dados da solicitação no arquivo:', err);
              res.end('Erro ao salvar dados da solicitação no arquivo.');
            } else {
              console.log('dado salvo' )  
              console.log(`Dados da solicitação salvos em ${filename}`);
              // Token JWT ausente no cabeçalho "Authorization", devolva o contexto e o corpo da solicitação
              console.log('enviando resposta' )  
              res.writeHead(200, { 'Content-Type': req.headers["content-type"] });
              res.end(data);      
            }
          });
      } else {
            console.error('Erro: corpo da solicitação vazio.');
            res.writeHead(400, { 'Content-Type': 'text/plain' });
            res.end('Erro: corpo da solicitação vazio.');
      }
      console.log('fazendo parse fim' )

       
      
    }   else {
      fs.writeFile(filePath, data, (err) => {
        if (err) {
          console.error('Erro ao salvar dados da solicitação no arquivo:', err);
          res.end('Erro ao salvar dados da solicitação no arquivo.');
        } else {
          console.log('dado salvo' )  
          console.log(`Dados da solicitação salvos em ${filename}`);
          // Token JWT ausente no cabeçalho "Authorization", devolva o contexto e o corpo da solicitação
          console.log('enviando resposta' )  
          res.writeHead(200, { 'Content-Type': req.headers["content-type"] });
          res.end(data);      
        }
      });
      res.writeHead(400, { 'Content-Type': req.headers["content-type"] });
      res.end('Content-type não esperado 2');
    }

    
  });
});

const port = 3003;
server.listen(port, () => {
  console.log(`O servidor está em execução em http://localhost:${port}`);
});

