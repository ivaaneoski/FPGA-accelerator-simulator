import { LayerForm } from '../components/builder/LayerForm';
import { ParallelismSlider } from '../components/builder/ParallelismSlider';
import { PrecisionComparator } from '../components/builder/PrecisionComparator';
import { useSimulatorStore } from '../store/useSimulatorStore';

export function LayerBuilderPage() {
  const { layers } = useSimulatorStore();
  
  return (
    <div className="flex flex-col gap-6 max-w-[1200px] mx-auto w-full p-6 md:p-10 animate-fade-in">
      <div className="border-b border-notion-border dark:border-notionDark-border pb-4 mb-2">
         <h1 className="text-[28px] font-bold text-notion-text dark:text-notionDark-text tracking-tight">Layer Builder</h1>
      </div>
      
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        <div>
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
