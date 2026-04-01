import { useState, useEffect } from 'react';
import { useSimulatorStore } from '../../store/useSimulatorStore';
import type { Conv2DLayer, DenseLayer } from '../../types';
import { Input, Select } from '../shared/Input';
import { Button } from '../shared/Button';

export function LayerForm() {
  const { addLayer, layers } = useSimulatorStore();
  const [type, setType] = useState<'conv2d' | 'dense'>('conv2d');
  
  const [conv2d, setConv2d] = useState<Omit<Conv2DLayer, 'id'>>({
    name: 'Conv2D-1',
    type: 'conv2d',
    inputWidth: 28,
    inputHeight: 28,
    inputChannels: 1,
    filters: 32,
    kernelSize: 3,
    stride: 1,
    padding: 'same',
    activation: 'relu',
    precision: 'int8',
    parallelismFactor: 1
  });

  const [dense, setDense] = useState<Omit<DenseLayer, 'id'>>({
    name: 'Dense-1',
    type: 'dense',
    inputNeurons: 128,
    outputNeurons: 64,
    activation: 'relu',
    precision: 'int8',
    parallelismFactor: 1
  });

  // Keep name synced with layer count
  useEffect(() => {
     setConv2d(prev => ({...prev, name: `Conv2D-${layers.filter(l => l.type === 'conv2d').length + 1}`}));
     setDense(prev => ({...prev, name: `Dense-${layers.filter(l => l.type === 'dense').length + 1}`}));
  }, [layers.length]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (type === 'conv2d') {
      addLayer({ ...conv2d, id: crypto.randomUUID(), type: 'conv2d' } as Conv2DLayer);
    } else {
      addLayer({ ...dense, id: crypto.randomUUID(), type: 'dense' } as DenseLayer);
    }
  };

  return (
    <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 shadow-sm mb-6">
      <div className="flex bg-slate-900 border border-slate-700 rounded-lg p-1 mb-6">
        <button
          className={`flex-1 text-sm font-semibold rounded-md py-2 transition-colors ${type === 'conv2d' ? 'bg-slate-800 text-slate-100 shadow-sm' : 'text-slate-400 hover:text-slate-100'}`}
          onClick={() => setType('conv2d')}
        >
          Conv2D
        </button>
        <button
          className={`flex-1 text-sm font-semibold rounded-md py-2 transition-colors ${type === 'dense' ? 'bg-slate-800 text-slate-100 shadow-sm' : 'text-slate-400 hover:text-slate-100'}`}
          onClick={() => setType('dense')}
        >
          Dense (Fully Connected)
        </button>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        {type === 'conv2d' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <Input label="Name" value={conv2d.name} onChange={e => setConv2d({...conv2d, name: e.target.value})} />
            <Input label="Input Width" type="number" min={1} value={conv2d.inputWidth} onChange={e => setConv2d({...conv2d, inputWidth: parseInt(e.target.value)})} />
            <Input label="Input Height" type="number" min={1} value={conv2d.inputHeight} onChange={e => setConv2d({...conv2d, inputHeight: parseInt(e.target.value)})} />
            <Input label="Input Channels" type="number" min={1} value={conv2d.inputChannels} onChange={e => setConv2d({...conv2d, inputChannels: parseInt(e.target.value)})} />
            <Input label="Filters" type="number" min={1} value={conv2d.filters} onChange={e => setConv2d({...conv2d, filters: parseInt(e.target.value)})} />
            <Input label="Kernel Size" type="number" step={2} min={1} max={7} value={conv2d.kernelSize} onChange={e => setConv2d({...conv2d, kernelSize: parseInt(e.target.value)})} />
            <Input label="Stride" type="number" min={1} value={conv2d.stride} onChange={e => setConv2d({...conv2d, stride: parseInt(e.target.value)})} />
            <Select label="Padding" value={conv2d.padding} onChange={e => setConv2d({...conv2d, padding: e.target.value as any})}>
              <option value="same">Same</option>
              <option value="valid">Valid</option>
            </Select>
            <Select label="Activation" value={conv2d.activation} onChange={e => setConv2d({...conv2d, activation: e.target.value as any})}>
              <option value="relu">ReLU</option>
              <option value="sigmoid">Sigmoid</option>
              <option value="none">None</option>
            </Select>
            <Select label="Precision" value={conv2d.precision} onChange={e => setConv2d({...conv2d, precision: e.target.value as any})}>
              <option value="fp32">FP32</option>
              <option value="int8">INT8</option>
              <option value="int4">INT4</option>
            </Select>
            <Input label="Parallelism Factor" type="number" min={1} max={16} value={conv2d.parallelismFactor} onChange={e => setConv2d({...conv2d, parallelismFactor: parseInt(e.target.value)})} />
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
             <Input label="Name" value={dense.name} onChange={e => setDense({...dense, name: e.target.value})} />
             <Input label="Input Neurons" type="number" min={1} value={dense.inputNeurons} onChange={e => setDense({...dense, inputNeurons: parseInt(e.target.value)})} />
             <Input label="Output Neurons" type="number" min={1} value={dense.outputNeurons} onChange={e => setDense({...dense, outputNeurons: parseInt(e.target.value)})} />
             <Select label="Activation" value={dense.activation} onChange={e => setDense({...dense, activation: e.target.value as any})}>
              <option value="relu">ReLU</option>
              <option value="softmax">Softmax</option>
              <option value="sigmoid">Sigmoid</option>
              <option value="none">None</option>
            </Select>
            <Select label="Precision" value={dense.precision} onChange={e => setDense({...dense, precision: e.target.value as any})}>
              <option value="fp32">FP32</option>
              <option value="int8">INT8</option>
              <option value="int4">INT4</option>
            </Select>
            <Input label="Parallelism Factor" type="number" min={1} max={16} value={dense.parallelismFactor} onChange={e => setDense({...dense, parallelismFactor: parseInt(e.target.value)})} />
          </div>
        )}
        
        <div className="flex justify-end pt-4 border-t border-slate-700">
           <Button type="submit">Add Layer</Button>
        </div>
      </form>
    </div>
  );
}
