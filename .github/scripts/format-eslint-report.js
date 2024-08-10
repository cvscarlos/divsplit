const fs = require('node:fs');
const path = require('node:path');
const eslintReport = require('../../frontend/eslint_report.json');

function formatEslintReport() {
	let output = '';

	eslintReport.forEach((file) => {
		if (!file.messages.length) return;

		const relativePath = path.relative(process.cwd(), file.filePath);
		output += `#### File: \`${relativePath}\`\n`;
		output += '| Rule | Message | Line | Column |\n';
		output += '| ---- | ------- | ---- | ------ |\n';
		output += file.messages
			.map((msg) => `| **${msg.ruleId}** | ${msg.message} | ${msg.line} | ${msg.column} |`)
			.join('\n');
		output += '\n';
	});

	fs.writeFileSync('eslint_report.md', output);
}

formatEslintReport();
