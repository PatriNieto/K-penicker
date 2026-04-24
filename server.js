const express = require('express');
const path = require('path');
const chatHandler = require('./api/chat.js');

const app = express();
const port = 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname)));

app.post('/api/chat', chatHandler);

app.listen(port, () => {
  console.log(`Servidor corriendo en http://localhost:${port}`);
});