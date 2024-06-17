const http = require('http');
const fs = require('fs');
const path = require('path');
const multiparty = require('multiparty');

const dataDir = './data'; // Diretório para salvar arquivos
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir);
}

const server = http.createServer((req, res) => {
  if (req.method.toLowerCase() === 'post') {
    const form = new multiparty.Form({ uploadDir: dataDir });

    form.parse(req, (err, fields, files) => {
      if (err) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Erro ao processar o upload' }));
        return;
      }
      res.writeHead(200, { 'Content-Type': 'text/html' });
      
    });
    
  } else {
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(`
      <form action="/" enctype="multipart/form-data" method="post">
        <input type="text" name="name"><br>
        <input type="file" name="file"><br>
        <input type="submit" value="Upload">
      </form>
    `);
  }
});

server.listen(3003, () => {
  console.log('Servidor rodando em http://localhost:3003');
});
