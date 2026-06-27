import { describe, it, expect } from 'vitest';

import { needsIdentityGate } from './identity';
import type { Member } from '../types';

const ana: Member = { id: 'a', name: 'Ana' };

describe('needsIdentityGate', () => {
	it('asks when no identity has been chosen', () => {
		expect(needsIdentityGate(null, undefined, 0)).toBe(true);
		expect(needsIdentityGate(null, undefined, 3)).toBe(true);
	});

	it('does not ask when the saved identity matches a member (header "You: …" shows)', () => {
		// Regression: a valid identity must NOT be gated, so the header attribution stays.
		expect(needsIdentityGate('a', ana, 2)).toBe(false);
	});

	it('re-asks when the saved identity is stale (members changed / sample data loaded)', () => {
		// Regression: stale id + members present → re-prompt so "You: …" comes back.
		expect(needsIdentityGate('a', undefined, 2)).toBe(true);
	});

	it('does not loop on a fresh event mid-setup (id set, no members yet)', () => {
		expect(needsIdentityGate('a', undefined, 0)).toBe(false);
	});
});
