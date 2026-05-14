import type { DownloadCandidate, RuleDecision, RuleSettings } from './types';

const BYTES_PER_MB = 1024 * 1024;

export function shouldInterceptDownload(
  download: DownloadCandidate,
  rules: RuleSettings,
  enabled: boolean
): RuleDecision {
  if (!enabled) {
    return { shouldIntercept: false, reason: 'disabled' };
  }

  const hostname = getHostname(download.url);

  if (hostname && domainMatches(hostname, rules.excludedDomains)) {
    return { shouldIntercept: false, reason: 'domain-excluded' };
  }

  if (
    rules.includedDomains.length > 0 &&
    (!hostname || !domainMatches(hostname, rules.includedDomains))
  ) {
    return { shouldIntercept: false, reason: 'domain-not-included' };
  }

  if (extensionMatches(download, rules.extensions)) {
    return { shouldIntercept: true, reason: 'extension-matched' };
  }

  if (sizeMatches(download.totalBytes, rules.minSizeMb)) {
    return { shouldIntercept: true, reason: 'size-matched' };
  }

  return { shouldIntercept: false, reason: 'no-positive-rule-matched' };
}

function getHostname(url: string): string | null {
  try {
    return new URL(url).hostname.toLowerCase();
  } catch {
    return null;
  }
}

function domainMatches(hostname: string, domains: string[]): boolean {
  return domains.some((domain) => {
    const normalized = domain.trim().toLowerCase();
    return (
      normalized.length > 0 &&
      (hostname === normalized || hostname.endsWith(`.${normalized}`))
    );
  });
}

function extensionMatches(
  download: DownloadCandidate,
  extensions: string[]
): boolean {
  if (extensions.length === 0) {
    return false;
  }

  const extension =
    extractExtension(download.filename) ??
    extractExtension(getUrlPathname(download.url));
  if (!extension) {
    return false;
  }

  const normalizedExtension = extension.toLowerCase();
  return extensions.map(normalizeExtension).includes(normalizedExtension);
}

function getUrlPathname(url: string): string {
  try {
    return new URL(url).pathname;
  } catch {
    return url;
  }
}

function extractExtension(value?: string): string | null {
  if (!value) {
    return null;
  }

  const lastSegment = value.split('/').pop() ?? value;
  const dotIndex = lastSegment.lastIndexOf('.');
  if (dotIndex < 0 || dotIndex === lastSegment.length - 1) {
    return null;
  }

  return lastSegment.slice(dotIndex + 1);
}

function normalizeExtension(extension: string): string {
  return extension.trim().replace(/^\./, '').toLowerCase();
}

function sizeMatches(
  totalBytes: number | undefined,
  minSizeMb: number
): boolean {
  if (!totalBytes || minSizeMb <= 0) {
    return false;
  }

  return totalBytes >= minSizeMb * BYTES_PER_MB;
}
