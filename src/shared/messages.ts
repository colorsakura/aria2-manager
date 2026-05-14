import browser from 'webextension-polyfill';
import type { RuntimeRequest, RuntimeResponse } from './types';

export async function sendRuntimeMessage<T extends RuntimeResponse['type']>(
  request: RuntimeRequest,
  expectedType: T
): Promise<Extract<RuntimeResponse, { type: T }>> {
  const response = (await browser.runtime.sendMessage(
    request
  )) as RuntimeResponse;
  return assertResponseType(response, expectedType);
}

export function assertResponseType<T extends RuntimeResponse['type']>(
  response: RuntimeResponse,
  expectedType: T
): Extract<RuntimeResponse, { type: T }> {
  if (response.type !== expectedType) {
    throw new Error(
      `Expected ${expectedType} response but received ${response.type}`
    );
  }

  return response as Extract<RuntimeResponse, { type: T }>;
}
