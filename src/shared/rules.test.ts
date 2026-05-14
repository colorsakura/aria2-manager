import { describe, expect, it } from 'vitest';
import type { DownloadCandidate, RuleSettings } from './types';
import { shouldInterceptDownload } from './rules';

const baseRules: RuleSettings = {
  extensions: ['zip', '.iso'],
  minSizeMb: 10,
  includedDomains: [],
  excludedDomains: []
};

function candidate(overrides: Partial<DownloadCandidate>): DownloadCandidate {
  return {
    id: 1,
    url: 'https://example.com/files/archive.zip',
    filename: 'archive.zip',
    totalBytes: 1024,
    ...overrides
  };
}

describe('shouldInterceptDownload', () => {
  it('does not intercept when disabled', () => {
    expect(shouldInterceptDownload(candidate({}), baseRules, false)).toEqual({
      shouldIntercept: false,
      reason: 'disabled'
    });
  });

  it('intercepts matching extensions case-insensitively and ignores leading dots', () => {
    expect(
      shouldInterceptDownload(
        candidate({
          url: 'https://example.com/ubuntu.ISO',
          filename: 'ubuntu.ISO'
        }),
        baseRules,
        true
      ).shouldIntercept
    ).toBe(true);
  });

  it('does not treat an empty extension list as match everything', () => {
    expect(
      shouldInterceptDownload(
        candidate({
          url: 'https://example.com/archive.zip',
          filename: 'archive.zip',
          totalBytes: 1024
        }),
        { ...baseRules, extensions: [], minSizeMb: 0 },
        true
      )
    ).toEqual({ shouldIntercept: false, reason: 'no-positive-rule-matched' });
  });

  it('intercepts when reliable size meets the threshold', () => {
    expect(
      shouldInterceptDownload(
        candidate({
          url: 'https://example.com/download',
          filename: 'download',
          totalBytes: 11 * 1024 * 1024
        }),
        { ...baseRules, extensions: [] },
        true
      ).shouldIntercept
    ).toBe(true);
  });

  it('ignores size rule when totalBytes is unknown', () => {
    expect(
      shouldInterceptDownload(
        candidate({
          url: 'https://example.com/download',
          filename: 'download',
          totalBytes: undefined
        }),
        { ...baseRules, extensions: [] },
        true
      )
    ).toEqual({ shouldIntercept: false, reason: 'no-positive-rule-matched' });
  });

  it('does not intercept excluded domains', () => {
    expect(
      shouldInterceptDownload(
        candidate({ url: 'https://cdn.example.com/archive.zip' }),
        { ...baseRules, excludedDomains: ['example.com'] },
        true
      )
    ).toEqual({ shouldIntercept: false, reason: 'domain-excluded' });
  });

  it('requires included domain when include list is non-empty', () => {
    expect(
      shouldInterceptDownload(
        candidate({ url: 'https://other.test/archive.zip' }),
        { ...baseRules, includedDomains: ['example.com'] },
        true
      )
    ).toEqual({ shouldIntercept: false, reason: 'domain-not-included' });
  });
});
