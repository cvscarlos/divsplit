import { describe, it, expect } from 'vitest';

import { getTransactionError } from './transaction';

describe('getTransactionError', () => {
	it('returns null when date, total and description are all present and valid', () => {
		expect(getTransactionError({ date: '2026-06-14', total: 120, description: 'Dinner' })).toBeNull();
	});

	it('flags missing required fields', () => {
		expect(getTransactionError({ date: '', total: 120, description: 'Dinner' })).toMatch(/date|total|description/i);
		expect(getTransactionError({ date: '2026-06-14', total: 0, description: 'Dinner' })).toMatch(
			/date|total|description/i,
		);
		expect(getTransactionError({ date: '2026-06-14', total: 120, description: '' })).toMatch(/date|total|description/i);
	});

	it('flags an unparseable date', () => {
		expect(getTransactionError({ date: 'not-a-date', total: 120, description: 'Dinner' })).toMatch(/valid date/i);
	});
});
