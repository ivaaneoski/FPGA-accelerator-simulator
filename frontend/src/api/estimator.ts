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

export async function estimateLayers(payload: EstimateRequest): Promise<EstimationResult> {
  const transformedPayload = toSnakeCase(payload);
  const { data } = await apiClient.post<EstimationResult>('/api/estimate', transformedPayload);
  return data;
}

export async function getFPGATargets(): Promise<FPGATarget[]> {
  const { data } = await apiClient.get<FPGATarget[]>('/api/fpga-targets');
  return data;
}
