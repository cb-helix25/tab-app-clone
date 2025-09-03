const fs = require('fs');
const path = require('path');

// Files with excessive logging
const filesToClean = [
  'src/index.tsx',
  'src/tabs/enquiries/Enquiries.tsx', 
  'src/utils/matterNormalization.ts'
];

function cleanFile(filePath) {
  const fullPath = path.join(__dirname, filePath);
  if (!fs.existsSync(fullPath)) {
    console.log(`File not found: ${filePath}`);
    return;
  }

  let content = fs.readFileSync(fullPath, 'utf8');
  const originalLength = content.length;
  
  // Remove debug console.log statements with emojis and verbose info
  const debugPatterns = [
    /console\.log\('🚀[^']*'[^;]*\);?\n?/g,
    /console\.log\('📧[^']*'[^;]*\);?\n?/g,
    /console\.log\('📅[^']*'[^;]*\);?\n?/g,
    /console\.log\('🏢[^']*'[^;]*\);?\n?/g,
    /console\.log\('👤[^']*'[^;]*\);?\n?/g,
    /console\.log\('📦[^']*'[^;]*\);?\n?/g,
    /console\.log\('✅[^']*'[^;]*\);?\n?/g,
    /console\.log\('📊[^']*'[^;]*\);?\n?/g,
    /console\.log\('🎯[^']*'[^;]*\);?\n?/g,
    /console\.log\('🔍[^']*'[^;]*\);?\n?/g,
    /console\.log\('🔄[^']*'[^;]*\);?\n?/g,
    /console\.log\('🔧[^']*'[^;]*\);?\n?/g,
    /console\.log\('📱[^']*'[^;]*\);?\n?/g,
    /console\.log\('🌐[^']*'[^;]*\);?\n?/g,
    /console\.log\('🏠[^']*'[^;]*\);?\n?/g,
    /console\.log\('📋[^']*'[^;]*\);?\n?/g,
    // Remove specific verbose patterns
    /console\.log\('Enquiries component[^;]*\);?\n?/g,
    /console\.log\(`\$\{[^`]*\}`[^;]*\);?\n?/g,
    /console\.log\('   [^']*'[^;]*\);?\n?/g, // Indented logs
  ];

  debugPatterns.forEach(pattern => {
    content = content.replace(pattern, '');
  });

  // Clean up multiple empty lines
  content = content.replace(/\n\s*\n\s*\n/g, '\n\n');
  
  fs.writeFileSync(fullPath, content);
  console.log(`✅ Cleaned ${filePath} - reduced from ${originalLength} to ${content.length} chars`);
}

console.log('🧹 Starting console log cleanup...');
filesToClean.forEach(cleanFile);
console.log('✅ Console log cleanup completed!');
