const fs = require('fs');
const path = require('path');

// Additional files with remaining verbose logging
const additionalFiles = [
  'src/tabs/matters/Matters.tsx'
];

function cleanFile(filePath) {
  const fullPath = path.join(__dirname, filePath);
  if (!fs.existsSync(fullPath)) {
    console.log(`File not found: ${filePath}`);
    return;
  }

  let content = fs.readFileSync(fullPath, 'utf8');
  const originalLength = content.length;
  
  // Remove remaining debug console.log statements
  const debugPatterns = [
    /\s*console\.log\('🔍[^']*'[^;]*\);?\n?/g,
    /\s*console\.log\('📊[^']*'[^;]*\);?\n?/g,
    /\s*console\.log\('✅[^']*'[^;]*\);?\n?/g,
    /\s*\/\/ console\.log\([^)]*\);?\n?/g, // Commented console logs
  ];

  debugPatterns.forEach(pattern => {
    content = content.replace(pattern, '');
  });

  // Clean up multiple empty lines
  content = content.replace(/\n\s*\n\s*\n/g, '\n\n');
  
  fs.writeFileSync(fullPath, content);
  console.log(`✅ Cleaned ${filePath} - reduced from ${originalLength} to ${content.length} chars`);
}

console.log('🧹 Cleaning additional console logs...');
additionalFiles.forEach(cleanFile);
console.log('✅ Additional console log cleanup completed!');
