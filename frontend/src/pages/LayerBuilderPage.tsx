import { LayerForm } from '../components/builder/LayerForm';
import { ParallelismSlider } from '../components/builder/ParallelismSlider';
import { PrecisionComparator } from '../components/builder/PrecisionComparator';
import { useSimulatorStore } from '../store/useSimulatorStore';

export function LayerBuilderPage() {
  const { layers } = useSimulatorStore();
  
  return (
    <div className="flex flex-col gap-6 p-6">
      <h1 className="text-[32px] font-bold text-slate-100">Layer Builder</h1>
      
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div>
          <LayerForm />
        </div>
        <div className="flex flex-col gap-6">
          <ParallelismSlider layerId={layers.length > 0 ? layers[layers.length - 1].id : null} />
          <PrecisionComparator />
        </div>
      </div>
    </div>
  );
}
