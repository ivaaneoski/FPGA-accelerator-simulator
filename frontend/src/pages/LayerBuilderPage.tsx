import { LayerForm } from '../components/builder/LayerForm';
import { ONNXImportButton } from '../components/builder/ONNXImportButton';
import { ParallelismSlider } from '../components/builder/ParallelismSlider';
import { PrecisionComparator } from '../components/builder/PrecisionComparator';
import { useSimulatorStore } from '../store/useSimulatorStore';
import { X } from 'lucide-react';

export function LayerBuilderPage() {
  const { layers, importedModelName, skippedOpsWarning, dismissSkippedOpsWarning } = useSimulatorStore();

  return (
    <div className="flex flex-col gap-6 max-w-[1200px] mx-auto w-full p-6 md:p-10 animate-fade-in">
      <div className="border-b border-notion-border dark:border-notionDark-border pb-4 mb-2 flex items-end gap-3">
         <h1 className="text-[28px] font-bold text-notion-text dark:text-notionDark-text tracking-tight">Layer Builder</h1>
        {importedModelName && (
          <span className="text-[14px] text-notion-textSecondary dark:text-notionDark-textSecondary mb-1 font-mono bg-notion-bg dark:bg-notionDark-bg border border-notion-border dark:border-notionDark-border rounded px-2 py-0.5">
            {importedModelName}
          </span>
        )}
      </div>

      {skippedOpsWarning && skippedOpsWarning.length > 0 && (
        <div className="flex items-start gap-2 text-[13px] bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 text-amber-700 dark:text-amber-400 rounded px-4 py-3 animate-fade-in">
          <span className="flex-1">
            Some layers were skipped and will not appear in the estimation: {skippedOpsWarning.join(', ')}. These layer types are not yet supported.
          </span>
          <button
            onClick={dismissSkippedOpsWarning}
            className="opacity-60 hover:opacity-100 transition-opacity shrink-0 mt-0.5"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        <div className="flex flex-col gap-4">
          <ONNXImportButton />
          <LayerForm />
        </div>
        <div className="flex flex-col gap-8">
          <ParallelismSlider layerId={layers.length > 0 ? layers[layers.length - 1].id : null} />
          <PrecisionComparator />
        </div>
      </div>
    </div>
  );
}
