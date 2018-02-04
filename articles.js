const express = require('express');
const fs = require('fs');
const path = require('path');
const util = require('util');
const fm = require('front-matter');
const md = require('markdown').markdown;
const dateFormat = require('dateformat');

const router = express.Router();

module.exports = router; // exporta router

const readDirAsync = util.promisify(fs.readdir);
const readFileAsync = util.promisify(fs.readFile);

let directoryMarkdowns;
let markdownContents;

async function readDirectory(req, res, next) {
  const artArray = await readDirAsync('./articles');
  directoryMarkdowns = artArray.filter(directoryItem => directoryItem.endsWith('.md'));
  next();
}

async function readMarkdowns(req, res, next) {
  const unparsedMarkdowns = await Promise.all(directoryMarkdowns.map(directoryMarkdown =>
    readFileAsync(`./articles/${directoryMarkdown}`, 'utf8'))).then(values => values);
  markdownContents = {};
  unparsedMarkdowns.forEach((unparsedMarkdown) => {
    const parsedMarkdown = fm(unparsedMarkdown);
    markdownContents[parsedMarkdown.attributes.slug] = parsedMarkdown;
  });
  next();
}

function catchErrors(fn) {
  return (req, res, next) => fn(req, res, next).catch(next);
}
router.use('/img', express.static(path.join(__dirname, './articles/img')));

router.use(catchErrors(readDirectory));
router.use(catchErrors(readMarkdowns));

router.get('/', (req, res) => {
  const unsortedContent = Object.keys(markdownContents).map(key => markdownContents[key]);
  const sortedContent = unsortedContent.sort((a, b) =>
    new Date(b.attributes.date) - new Date(a.attributes.date));
  sortedContent.forEach((articleInfo) => {
    articleInfo.attributes.date = dateFormat(articleInfo.attributes.date, 'd.m.yyyy');
  });
  res.render('list', {
    title: 'Greinasafnið',
    sortedContent,
  });
});

router.get('/:slug', (req, res) => {
  if (markdownContents[req.params.slug]) {
    const markdownContent = markdownContents[req.params.slug];
    const htmlContent = md.toHTML(markdownContent.body);
    res.render('article', {
      title: markdownContent.attributes.title,
      markdownContent,
      htmlContent,
    });
  } else {
    res.status(404).render('error', { title: 'Villa', errorMessage: 'Síða fannst ekki.' });
  }
});

router.get('/*', (req, res) => {
  res.status(404).render('error', { title: 'Villa', errorMessage: 'Síða fannst ekki.' });
});

router.use((err, req, res) => {
  res.status(500).render('error', { title: 'Villa', errorMessage: 'Villa kom upp.' });
});
