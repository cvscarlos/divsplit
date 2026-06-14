import { describe, it, expect } from 'vitest';

import { ACTIVITY_TYPES, trackTransferRecorded, trackTransferRemoved } from './activity-tracker';
import type { Group } from '../types';

const group: Group = { config: {} };

describe('transfer activity helpers', () => {
	it('records a transfer with payer, payee and amount in the description', () => {
		const updated = trackTransferRecorded(group, 'Bob', 'Carol', 40);
		const entry = updated.activities?.[0];
		expect(entry?.type).toBe(ACTIVITY_TYPES.TRANSFER_RECORDED);
		expect(entry?.description).toContain('Bob');
		expect(entry?.description).toContain('Carol');
		expect(entry?.description).toContain('40');
	});

	it('records a transfer removal', () => {
		const updated = trackTransferRemoved(group, 'Bob', 'Carol', 40);
		expect(updated.activities?.[0]?.type).toBe(ACTIVITY_TYPES.TRANSFER_REMOVED);
	});
});
