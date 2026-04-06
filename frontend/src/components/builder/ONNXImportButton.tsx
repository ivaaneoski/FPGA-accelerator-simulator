import { useState, useRef, useCallback } from 'react';
import { Upload, X } from 'lucide-react';
import { Button } from '../shared/Button';
import { importOnnxFile } from '../../api/estimator';
import { useSimulatorStore } from '../../store/useSimulatorStore';
import type { Layer, Activation, Precision } from '../../types';

function snakeToCamel(s: string): string {
  return s.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
}

function convertLayer(raw: any): Layer {
  const obj: any = {};
  for (const key of Object.keys(raw)) {
    obj[snakeToCamel(key)] = raw[key];
  }
  obj.id = crypto.randomUUID();
  if (!obj.name) obj.name = obj.type;
  obj.activation = (obj.activation as Activation) || 'none';
  obj.precision = (obj.precision as Precision) || 'int8';
  obj.parallelismFactor = obj.parallelismFactor ?? 4;
  return obj as Layer;
}

export function ONNXImportButton() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const setLayers = useSimulatorStore((s) => s.setLayers);
  const handleFile = useCallback(async (file: File) => {
    setLoading(true);
    setError(null);
    try {
      const resp = await importOnnxFile(file);
      const converted = resp.layers.map(convertLayer);
      setLayers(converted);
      useSimulatorStore.setState({
        importedModelName: resp.model_name || null,
        skippedOpsWarning: resp.skipped_ops?.length ? resp.skipped_ops : null,
      });
    } catch (err: any) {
      const detail = err.response?.data?.detail || err.message || 'Failed to import ONNX model.';
      const msg = Array.isArray(detail) ? detail.map((d: any) => d.msg || JSON.stringify(d)).join('; ') : String(detail);
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-3">
        <input
          ref={fileInputRef}
          type="file"
          accept=".onnx"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFile(file);
            // Reset so same file can be re-selected
            e.target.value = '';
          }}
        />
        <Button
          variant="secondary"
          onClick={handleClick}
          disabled={loading}
        >
          <Upload className="w-4 h-4" />
          {loading ? 'Importing...' : 'Import ONNX'}
        </Button>
      </div>

      {error && (
        <div className="flex items-center gap-2 text-[13px] bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 text-red-700 dark:text-red-400 rounded px-3 py-2 animate-fade-in">
          <span className="flex-1">{error}</span>
          <button onClick={() => setError(null)} className="opacity-60 hover:opacity-100 transition-opacity">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}
