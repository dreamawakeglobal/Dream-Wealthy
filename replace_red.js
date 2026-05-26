const fs = require('fs');
const glob = require('glob'); // Note: we might not have glob, use standard fs walking
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
    content = content.replace(/red:\s*['"]#ff3b30['"]/gi, "red: '#FF0000'");
    content = content.replace(/red:\s*['"]#F43F5E['"]/gi, "red: '#FF0000'");
    content = content.replace(/red:\s*['"]255, 59, 48['"]/gi, "red: '255, 0, 0'");
    
    // Also update index.css variables if present
    if (filePath.endsWith('index.css')) {
      content = content.replace(/--danger:\s*#F43F5E;/gi, "--danger: #FF0000;");
      content = content.replace(/--danger-glow:\s*rgba\(244,\s*63,\s*94,\s*0\.15\);/gi, "--danger-glow: rgba(255, 0, 0, 0.15);");
    }

    if (content !== original) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log('Updated', filePath);
    }
  }
});
