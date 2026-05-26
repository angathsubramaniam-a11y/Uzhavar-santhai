const fs = require('fs');
const lintData = JSON.parse(fs.readFileSync('lint.json', 'utf8'));
const filesWithErrors = lintData.filter(f => f.errorCount > 0);
filesWithErrors.forEach(file => {
  const errors = file.messages.filter(m => m.severity === 2);
  const realErrors = errors.filter(m => m.ruleId !== 'no-unused-vars');
  if (realErrors.length > 0) {
    console.log(file.filePath);
    realErrors.forEach(e => console.log(`  ${e.line}:${e.column} ${e.ruleId} - ${e.message}`));
  }
});
