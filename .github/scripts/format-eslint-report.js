const fs = require('node:fs');
const path = require('node:path');

// Check if eslint report exists
const reportPath = path.join(process.cwd(), 'eslint_report.json');
if (!fs.existsSync(reportPath)) {
	console.log('No ESLint report found, creating empty report');
	fs.writeFileSync('eslint_report.md', '✅ No linting issues found!');
	process.exit(0);
}

const eslintReport = require(reportPath);

function formatEslintReport() {
	let output = '';
	let hasIssues = false;

	eslintReport.forEach((file) => {
		if (!file.messages.length) return;

		hasIssues = true;
		const relativePath = path.relative(process.cwd(), file.filePath);
		output += `#### File: \`${relativePath}\`\n`;
		output += '| Rule | Message | Line | Column |\n';
		output += '| ---- | ------- | ---- | ------ |\n';
		output += file.messages
			.map((msg) => `| **${msg.ruleId}** | ${msg.message} | ${msg.line} | ${msg.column} |`)
			.join('\n');
		output += '\n\n';
	});

	output = hasIssues ? `## ESLint Report\n\n${output}` : '✅ No linting issues found!';

	fs.writeFileSync('eslint_report.md', output);
}

formatEslintReport();
