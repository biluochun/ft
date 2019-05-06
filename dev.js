
const sass = require('node-sass');
const path = require('path');
const fs = require('fs')
const { execSync } = require('child_process');

const scssDir = path.join(__dirname, 'src/scss/index.scss');
sass.render({
  file: scssDir,
  outFile: path.join(__dirname, 'src/css/index.css'),
  sourceMap: true,
}, function (error, result) {
  if (error) return console.error(error);
  fs.writeFile(path.join(__dirname, 'src/css/index.css'), result.css, function (err) {
    if (err) return console.error(error);
  });
});

execSync(`tsc --watch --outDir ./src/js`, {
  cwd: path.join(__dirname),
  stdio: process.stdio,
});
