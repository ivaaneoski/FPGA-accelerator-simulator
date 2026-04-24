import { useState, useRef, useCallback } from 'react';
import { AlertTriangle, Check, Cpu, Database, Upload, X } from 'lucide-react';
import { Button } from '../shared/Button';
import { Modal } from '../shared/Modal';
import { importOnnxFile } from '../../api/estimator';
import { useSimulatorStore } from '../../store/useSimulatorStore';
import type { Layer, Activation, Precision, OnnxImportResponse } from '../../types';

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
  const [review, setReview] = useState<{
    response: OnnxImportResponse;
    layers: Layer[];
    fileName: string;
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const setLayers = useSimulatorStore((s) => s.setLayers);
  const handleFile = useCallback(async (file: File) => {
    setLoading(true);
    setError(null);
    try {
      const resp = await importOnnxFile(file) as OnnxImportResponse;
      const converted = resp.layers.map(convertLayer);
      setReview({
        response: resp,
        layers: converted,
        fileName: file.name,
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

  const applyReview = () => {
    if (!review) return;

    setLayers(review.layers);
    useSimulatorStore.setState({
      importedModelName: review.response.model_name || review.fileName,
      skippedOpsWarning: review.response.skipped_ops?.length ? review.response.skipped_ops : null,
    });
    setReview(null);
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

      <Modal
        isOpen={!!review}
        onClose={() => setReview(null)}
        title="Review ONNX Import"
        footer={
          <>
            <Button variant="ghost" onClick={() => setReview(null)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={applyReview} disabled={!review?.layers.length}>
              <Check className="w-4 h-4" />
              Apply Layers
            </Button>
          </>
        }
      >
        {review && (
          <div className="flex flex-col gap-5">
            <div className="grid grid-cols-2 gap-3">
              <div className="border border-notion-border dark:border-notionDark-border rounded px-3 py-2">
                <p className="text-[11px] uppercase tracking-wide text-notion-textSecondary dark:text-notionDark-textSecondary">Model</p>
                <p className="text-[13px] font-medium text-notion-text dark:text-notionDark-text truncate">
                  {review.response.model_name || review.fileName}
                </p>
              </div>
              <div className="border border-notion-border dark:border-notionDark-border rounded px-3 py-2">
                <p className="text-[11px] uppercase tracking-wide text-notion-textSecondary dark:text-notionDark-textSecondary">Parsed Layers</p>
                <p className="text-[13px] font-medium text-notion-text dark:text-notionDark-text">
                  {review.layers.length}
                </p>
              </div>
            </div>

            {review.response.skipped_ops?.length > 0 && (
              <div className="flex items-start gap-2 rounded border border-amber-200 dark:border-amber-900/50 bg-amber-50 dark:bg-amber-950/30 px-3 py-2 text-[13px] text-amber-700 dark:text-amber-400">
                <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
                <span>
                  Skipped unsupported operators: {review.response.skipped_ops.join(', ')}
                </span>
              </div>
            )}

            <div className="max-h-[340px] overflow-y-auto custom-scrollbar border border-notion-border dark:border-notionDark-border rounded">
              {review.layers.length === 0 ? (
                <div className="p-4 text-[13px] text-notion-textSecondary dark:text-notionDark-textSecondary">
                  No supported Conv, Gemm, or MatMul layers were found in this model.
                </div>
              ) : (
                <div className="divide-y divide-notion-border dark:divide-notionDark-border">
                  {review.layers.map((layer, index) => (
                    <div key={layer.id} className="flex items-center gap-3 px-3 py-2.5">
                      <div className="w-7 h-7 rounded bg-notion-bgHover dark:bg-notionDark-bgHover flex items-center justify-center shrink-0">
                        {layer.type === 'conv2d' ? <Cpu className="w-4 h-4 text-[#0B6E99]" /> : <Database className="w-4 h-4 text-[#6940A5]" />}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-[13px] font-medium text-notion-text dark:text-notionDark-text truncate">{index + 1}. {layer.name}</span>
                          <span className="text-[11px] uppercase text-notion-textSecondary dark:text-notionDark-textSecondary">{layer.type}</span>
                        </div>
                        <p className="text-[12px] text-notion-textSecondary dark:text-notionDark-textSecondary truncate">
                          {layer.type === 'conv2d'
                            ? `${layer.inputWidth}x${layer.inputHeight}x${layer.inputChannels} -> ${layer.filters} filters, k${layer.kernelSize}, stride ${layer.stride}`
                            : `${layer.inputNeurons} -> ${layer.outputNeurons} neurons`}
                          {` | ${layer.precision.toUpperCase()} | p${layer.parallelismFactor} | ${layer.activation}`}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
