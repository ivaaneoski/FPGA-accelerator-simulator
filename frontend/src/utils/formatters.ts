export const fmtInt = (n: number): string => Math.round(n).toLocaleString('en-US');

export const fmtLatency = (us: number): string => {
  if (us >= 1000) return `${(us / 1000).toFixed(2)} ms`;
  if (us >= 1) return `${us.toFixed(2)} \u00B5s`; // µ character
  return `${(us * 1000).toFixed(1)} ns`;
};

export const fmtThroughput = (infPerSec: number): string => {
  if (infPerSec >= 1_000_000) return `${(infPerSec / 1_000_000).toFixed(2)}M inf/s`;
  if (infPerSec >= 1_000) return `${(infPerSec / 1_000).toFixed(1)}K inf/s`;
  return `${Math.round(infPerSec)} inf/s`;
};

export const fmtMACs = (macs: number): string => {
  if (macs >= 1_000_000_000) return `${(macs / 1_000_000_000).toFixed(2)}G MACs`;
  if (macs >= 1_000_000) return `${(macs / 1_000_000).toFixed(2)}M MACs`;
  if (macs >= 1_000) return `${(macs / 1_000).toFixed(1)}K MACs`;
  return `${macs} MACs`;
};

export const fmtPct = (pct: number): string => `${Math.min(pct, 999).toFixed(1)}%`;
