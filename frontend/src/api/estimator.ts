import { apiClient } from './client';
import type { EstimateRequest, EstimationResult, FPGATarget } from '../types';

function toSnakeCase(obj: any): any {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }
  if (Array.isArray(obj)) {
    return obj.map(toSnakeCase);
  }
  const result: any = {};
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      const snakeKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
      result[snakeKey] = toSnakeCase(obj[key]);
    }
  }
  return result;
}

let activeController: AbortController | null = null;

export async function estimateLayers(
  payload: EstimateRequest,
  signal?: AbortSignal
): Promise<EstimationResult> {
  const transformedPayload = toSnakeCase(payload);
  const { data } = await apiClient.post<EstimationResult>(
    '/api/estimate',
    transformedPayload,
    { signal }
  );
  return data;
}

/**
 * Cancellable version: aborts any previous in-flight request.
 * Used by the main store's runEstimation.
 */
export function estimateLayersCancellable(payload: EstimateRequest): {
  promise: Promise<EstimationResult>;
  controller: AbortController;
} {
  // Abort any previous in-flight request
  activeController?.abort();
  activeController = new AbortController();
  const controller = activeController;

  const promise = estimateLayers(payload, controller.signal);
  return { promise, controller };
}

export async function getFPGATargets(): Promise<FPGATarget[]> {
  const { data } = await apiClient.get<FPGATarget[]>('/api/fpga-targets');
  return data;
}

export async function importOnnxFile(file: File): Promise<any> {
  const formData = new FormData();
  formData.append('file', file);
  const { data } = await apiClient.post('/api/import-onnx', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data;
}
