const fs = require('fs');
const path = require('path');

const publicDir = path.join(__dirname, 'public');
const files = fs.readdirSync(publicDir).filter(f => f.endsWith('.html'));

let updatedCount = 0;

files.forEach(file => {
  const filePath = path.join(publicDir, file);
  let content = fs.readFileSync(filePath, 'utf8');

  // Replace any variation of localhost API definitions
  const newContent = content.replace(
    /const\s+API\s*=\s*["']http:\/\/localhost:5000["']/g,
    'const API = window.location.origin'
  );

  if (content !== newContent) {
    fs.writeFileSync(filePath, newContent);
    console.log(`✅ Updated: ${file}`);
    updatedCount++;
  }
});

console.log(`\n🎉 Done! ${updatedCount} HTML files updated.`);