const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? 
      walkDir(dirPath, callback) : callback(path.join(dir, f));
  });
}

walkDir('./src', function(filePath) {
  if (filePath.endsWith('.js') || filePath.endsWith('.jsx') || filePath.endsWith('.css')) {
    let content = fs.readFileSync(filePath, 'utf8');
    let original = content;
    
    // In JS files, revert #818CF8 back to #8b5cf6
    if (!filePath.endsWith('index.css') && !filePath.endsWith('AiAdvisorWidget.jsx')) {
        content = content.replace(/purple:\s*['"]#818CF8['"]/gi, "purple: '#8b5cf6'");
        content = content.replace(/purple:\s*['"]129, 140, 248['"]/gi, "purple: '139, 92, 246'");
    }
    
    // In index.css, make sure glow-color-purple uses the darker purple #8b5cf6
    if (filePath.endsWith('index.css')) {
        content = content.replace(/border:\s*3px solid #818CF8/gi, "border: 3px solid #8b5cf6");
        content = content.replace(/border-color:\s*#818CF8/gi, "border-color: #8b5cf6");
        content = content.replace(/box-shadow:\s*0 0 28px #818CF8/gi, "box-shadow: 0 0 28px #8b5cf6");
    }

    if (content !== original) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log('Updated', filePath);
    }
  }
});
