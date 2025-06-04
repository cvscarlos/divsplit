import fs from 'node:fs';
import path from 'node:path';

// Check if eslint report exists
const reportPath = path.join(process.cwd(), 'eslint_report.json');
if (!fs.existsSync(reportPath)) {
	console.log('No ESLint report found - ESLint may have failed to run');
	fs.writeFileSync('eslint_report.md', '❌ ESLint failed to generate a report. Check the workflow logs for details.');
	process.exit(0);
}

const eslintReport = JSON.parse(fs.readFileSync(reportPath, 'utf8'));

function formatEslintReport() {
	let output = '';
	let hasIssues = false;
	let totalErrors = 0;
	let totalWarnings = 0;

	eslintReport.forEach((file) => {
		if (!file.messages.length) return;

		hasIssues = true;
		const relativePath = path.relative(process.cwd(), file.filePath);
		output += `#### File: \`${relativePath}\`\n`;
		output += '| Severity | Rule | Message | Line | Column |\n';
		output += '| -------- | ---- | ------- | ---- | ------ |\n';
		
		file.messages.forEach((msg) => {
			const severity = msg.severity === 2 ? '🔴 Error' : '🟡 Warning';
			if (msg.severity === 2) totalErrors++;
			else totalWarnings++;
			
			output += `| ${severity} | **${msg.ruleId || 'N/A'}** | ${msg.message} | ${msg.line} | ${msg.column} |\n`;
		});
		output += '\n';
	});

	if (hasIssues) {
		const summary = `## ❌ ESLint Report\n\n**Summary:** ${totalErrors} error(s), ${totalWarnings} warning(s)\n\n${output}`;
		fs.writeFileSync('eslint_report.md', summary);
	} else {
		fs.writeFileSync('eslint_report.md', '✅ No linting issues found!');
	}
}

formatEslintReport();
