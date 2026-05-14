import { describe, expect, it } from 'vitest';
import type { RuntimeResponse } from './types';
import { assertResponseType } from './messages';

describe('assertResponseType', () => {
  it('returns response when type matches', () => {
    const response: RuntimeResponse = { type: 'ok' };

    expect(assertResponseType(response, 'ok')).toBe(response);
  });

  it('throws when type does not match', () => {
    const response: RuntimeResponse = { type: 'ok' };

    expect(() => assertResponseType(response, 'settings')).toThrow('Expected settings response but received ok');
  });
});
