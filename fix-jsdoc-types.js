const fs = require('fs');
const path = require('path');

const files = [
  'src/components/analysis/PurchaseWorksheet.jsx',
  'src/components/features/ExpandedPropertyView.jsx',
  'src/components/features/propertycard.jsx',
  'src/hooks/useSavedProperties.js',
  'src/pages/PropertyAnalysisPage.jsx',
  'src/components/features/PropertiesGrid.jsx'
];

files.forEach(file => {
  const filePath = path.join(__dirname, file);
  if (fs.existsSync(filePath)) {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Replace problematic type annotations
    content = content.replace(/@type \{(\[.*?Function\])\}/g, '');
    
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`✅ Fixed ${file}`);
  }
});

console.log('Done! Run: npm run docs');