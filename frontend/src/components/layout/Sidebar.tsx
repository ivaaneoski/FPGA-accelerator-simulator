import { Plus, Pencil, Trash2 } from 'lucide-react';
import { useSimulatorStore } from '../../store/useSimulatorStore';
import { Badge } from '../shared/Badge';

export function Sidebar() {
  const { layers, removeLayer, clearLayers } = useSimulatorStore();

  return (
    <aside className="w-full xl:w-[320px] shrink-0 xl:min-h-[calc(100vh-60px)] bg-slate-800 border-r border-slate-700 flex flex-col pt-6">
      <div className="px-6 flex items-center justify-between mb-4">
        <h3 className="text-xl font-semibold text-slate-100">Layer Stack</h3>
        <button className="text-sm font-semibold text-indigo-500 hover:text-indigo-400 focus:outline-none focus:underline" onClick={() => window.location.href='/builder'}>
          + Add
        </button>
      </div>
      
      <div className="flex-1 overflow-y-auto px-6 pb-6 flex flex-col gap-3">
        {layers.length === 0 ? (
          <div className="border-2 border-dashed border-slate-700 rounded-lg p-6 flex flex-col items-center justify-center text-center">
            <Plus className="w-8 h-8 text-slate-500 mb-2" />
            <p className="text-sm text-slate-400">Add your first layer to begin estimation.</p>
          </div>
        ) : (
          layers.map((layer) => (
             <div key={layer.id} className="bg-slate-800 border border-slate-700 rounded-lg p-4 shadow-sm group">
               <div className="flex justify-between items-start mb-2">
                 <div className="flex gap-2 items-center">
                   <Badge variant={layer.type}>{layer.type === 'conv2d' ? 'Conv2D' : 'Dense'}</Badge>
                   <span className="text-slate-100 text-sm font-semibold">{layer.name}</span>
                 </div>
                 <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                    <button className="w-8 h-8 flex items-center justify-center rounded text-slate-400 hover:text-slate-100 hover:bg-white/5 transition-colors focus:opacity-100">
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => removeLayer(layer.id)}
                      className="w-8 h-8 flex items-center justify-center rounded text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors focus:opacity-100"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                 </div>
               </div>
               <p className="text-xs font-light text-slate-400">
                  {layer.type === 'conv2d' 
                    ? `${layer.filters} filters, ${layer.kernelSize}x${layer.kernelSize} kernel` 
                    : `${layer.inputNeurons} in → ${layer.outputNeurons} out`}
               </p>
             </div>
          ))
        )}
      </div>

      <div className="p-6 border-t border-slate-700 flex flex-col gap-3">
        <button 
          onClick={() => { if (confirm('Are you sure you want to clear all layers?')) clearLayers(); }}
          className="text-red-500 bg-transparent border-[1.5px] border-red-500 hover:bg-red-500/10 rounded-lg px-4 py-2 text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={layers.length === 0}
        >
          Clear All
        </button>
        <div className="flex gap-2">
            <button className="flex-1 bg-transparent border-[1.5px] border-indigo-500 text-indigo-500 hover:bg-indigo-500/10 rounded-lg py-2 text-sm font-semibold transition-colors">
              Load Config
            </button>
            <button className="flex-1 bg-indigo-500 text-white hover:bg-indigo-600 active:bg-indigo-700 rounded-lg py-2 text-sm font-semibold transition-colors disabled:opacity-50" disabled={layers.length===0}>
              Save Config
            </button>
        </div>
      </div>
    </aside>
  );
}
