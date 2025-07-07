const fs = require('fs');
const path = require('path');


const uploadDir = path.join(__dirname, 'uploads');

export function ensureUploadDirExists() {
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
    console.log(`Created directory: ${uploadDir}`);
  }
}

