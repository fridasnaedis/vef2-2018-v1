const express = require('express');
const path = require('path');
const articles = require('./articles');

const app = express();
const hostname = '127.0.0.1';
const port = 3000;

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use('/static', express.static('public'));
app.use('/', articles);

app.listen(port, hostname, () => {
  console.info(`Server running at http://${hostname}:${port}/`);
});
