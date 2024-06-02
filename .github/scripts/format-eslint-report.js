const fs = require('node:fs');

function formatEslintReport() {
  const report = JSON.parse(fs.readFileSync('frontend/eslint-report.json', 'utf8'));
  let output = '';

  report.forEach(file => {
    if (!file.messages.length) return;

    output += `### ${file.filePath}\n`;
    file.messages.forEach(msg => {
      output += `- **${msg.ruleId}**: ${msg.message} (Line: ${msg.line}, Column: ${msg.column})\n`;
    });
    output += '\n';
  });

  fs.writeFileSync('eslint_report.md', output);
}

formatEslintReport();
