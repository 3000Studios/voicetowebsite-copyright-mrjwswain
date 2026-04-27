const fs = require('fs');
const path = require('path');

function listFiles(directory) {
  return new Promise((resolve, reject) => {
    fs.readdir(directory, (err, files) => {
      if (err) return reject(err);
      
      let results = [];

      files.forEach((file) => {
        const filePath = path.join(directory, file);

        fs.stat(filePath, (err, stats) => {
          if (stats.isDirectory()) {
            listFiles(filePath)
              .then(subResults => {
                results = results.concat(subResults);
                checkCompletion();
              })
              .catch(reject);
          } else {
            results.push(filePath);
            checkCompletion();
          }
        });
      });

      function checkCompletion() {
        if (--files.length === 0) resolve(results);
      }
    });
  });
}

listFiles(__dirname)
  .then(files => {
    console.log(files.join('\n'));
  })
  .catch(err => {
    console.error(err);
  });