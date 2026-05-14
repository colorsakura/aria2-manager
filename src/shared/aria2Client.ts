import type {
  Aria2ActiveTask,
  ExtensionSettings,
  RequestContextHeaders,
  RpcStatus
} from './types';

interface RpcSuccess<T> {
  result: T;
}

interface RpcFailure {
  error: { message: string };
}

type RpcResponse<T> = RpcSuccess<T> | RpcFailure;

interface RawAria2Task {
  gid: string;
  status: string;
  totalLength?: string;
  completedLength?: string;
  downloadSpeed?: string;
  files?: Array<{ path?: string; uris?: Array<{ uri?: string }> }>;
}

export async function testConnection(
  settings: ExtensionSettings
): Promise<RpcStatus> {
  try {
    const result = await callRpc<{ version: string }>(
      settings,
      'aria2.getVersion',
      []
    );
    return { ok: true, version: result.version };
  } catch (error) {
    return { ok: false, message: errorMessage(error) };
  }
}

export async function addUri(
  settings: ExtensionSettings,
  url: string,
  headers: RequestContextHeaders
): Promise<string> {
  return callRpc<string>(settings, 'aria2.addUri', [
    [url],
    buildOptions(headers)
  ]);
}

export async function getActiveTasks(
  settings: ExtensionSettings
): Promise<Aria2ActiveTask[]> {
  const tasks = await callRpc<RawAria2Task[]>(settings, 'aria2.tellActive', []);
  return tasks.slice(0, 5).map(normalizeTask);
}

async function callRpc<T>(
  settings: ExtensionSettings,
  method: string,
  params: unknown[]
): Promise<T> {
  const rpcParams = settings.rpcToken.trim()
    ? [`token:${settings.rpcToken.trim()}`, ...params]
    : params;
  const response = await fetch(settings.rpcUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: method,
      method,
      params: rpcParams
    })
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  const payload = (await response.json()) as RpcResponse<T>;
  if ('error' in payload) {
    throw new Error(payload.error.message);
  }

  return payload.result;
}

function buildOptions(
  headers: RequestContextHeaders
): Record<string, string[]> {
  const header: string[] = [];
  if (headers.cookie) header.push(`Cookie: ${headers.cookie}`);
  if (headers.referer) header.push(`Referer: ${headers.referer}`);
  if (headers.userAgent) header.push(`User-Agent: ${headers.userAgent}`);
  return header.length > 0 ? { header } : {};
}

function normalizeTask(task: RawAria2Task): Aria2ActiveTask {
  const total = Number(task.totalLength ?? 0);
  const completed = Number(task.completedLength ?? 0);
  const progress = total > 0 ? Math.round((completed / total) * 100) : 0;

  return {
    gid: task.gid,
    name: taskName(task),
    status: task.status,
    progress,
    downloadSpeed: Number(task.downloadSpeed ?? 0)
  };
}

function taskName(task: RawAria2Task): string {
  const firstFile = task.files?.[0];
  const path = firstFile?.path;
  if (path) {
    return path.split('/').pop() || path;
  }

  const uri = firstFile?.uris?.[0]?.uri;
  if (uri) {
    try {
      return new URL(uri).pathname.split('/').pop() || uri;
    } catch {
      return uri;
    }
  }

  return task.gid;
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Unknown RPC error';
}
