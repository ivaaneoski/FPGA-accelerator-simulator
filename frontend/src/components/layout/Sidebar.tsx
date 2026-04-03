import { useState } from 'react';
import { Plus, Pencil, Trash2, Cpu, Database, Save, FolderOpen } from 'lucide-react';
import { useSimulatorStore } from '../../store/useSimulatorStore';
import { Button } from '../shared/Button';
import { useNavigate } from 'react-router-dom';

export function Sidebar() {
  const { layers, removeLayer, clearLayers, saveConfig, savedConfigs, loadConfig } = useSimulatorStore();
  const navigate = useNavigate();
  const [showSavePrompt, setShowSavePrompt] = useState(false);
  const [saveName, setSaveName] = useState('');
  const [showLoadMenu, setShowLoadMenu] = useState(false);

  const handleSave = () => {
    if (!saveName.trim()) return;
    saveConfig(saveName.trim());
    setSaveName('');
    setShowSavePrompt(false);
  };

  return (
    <aside className="w-full xl:w-[260px] shrink-0 xl:min-h-[calc(100vh-45px)] bg-[#f7f7f5] dark:bg-[#202020] border-r border-notion-border dark:border-notionDark-border flex flex-col pt-4 transition-colors">
      <div className="px-4 flex items-center justify-between mb-2">
        <h3 className="text-[12px] font-semibold text-notion-textSecondary dark:text-notionDark-textSecondary tracking-wide uppercase">Layer Stack</h3>
        <button 
          className="notion-icon-btn" 
          onClick={() => navigate('/builder')}
          aria-label="Add layer"
        >
          <Plus className="w-3.5 h-3.5" />
        </button>
      </div>
      
      <div className="flex-1 overflow-y-auto px-2 pb-6 flex flex-col gap-0.5">
        {layers.length === 0 ? (
          <div className="px-2 py-4 flex flex-col items-center justify-center text-center">
            <p className="text-[13px] text-notion-textSecondary dark:text-notionDark-textSecondary">No layers yet.</p>
          </div>
        ) : (
          layers.map((layer) => (
             <div key={layer.id} className="group relative flex items-center justify-between px-2 py-1.5 hover:bg-[rgba(55,53,47,0.08)] dark:hover:bg-[rgba(255,255,255,0.055)] rounded cursor-pointer transition-colors">
               <div className="flex items-center gap-2 overflow-hidden">
                 <div className="w-4 flex items-center justify-center shrink-0 opacity-60">
                   {layer.type === 'conv2d' ? <Cpu className="w-3.5 h-3.5 text-notion-tagBlueText dark:text-notionDark-tagBlueText" /> : <Database className="w-3.5 h-3.5 text-notion-tagPurpleText dark:text-notionDark-tagPurpleText" />}
                 </div>
                 <div className="flex flex-col truncate">
                   <span className="text-[14px] font-medium text-notion-text dark:text-notionDark-text truncate leading-tight">
                     {layer.name}
                   </span>
                   <span className="text-[12px] text-notion-textSecondary dark:text-notionDark-textSecondary truncate leading-tight">
                      {layer.type === 'conv2d' 
                        ? `${layer.filters}f, ${layer.kernelSize}x${layer.kernelSize}k` 
                        : `${layer.inputNeurons}→${layer.outputNeurons}`}
                   </span>
                 </div>
               </div>
               
               <div className="opacity-0 group-hover:opacity-100 flex items-center bg-[#f7f7f5] dark:bg-[#202020] group-hover:bg-[#ebebea] dark:group-hover:bg-[#2f2f2f] transition-all absolute right-1 px-1 rounded shadow-[0_0_2px_rgba(0,0,0,0.1)] gap-0.5">
                  <button 
                    onClick={(e) => { e.stopPropagation(); navigate('/builder'); }}
                    className="notion-icon-btn p-1"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button 
                    onClick={(e) => { e.stopPropagation(); removeLayer(layer.id); }}
                    className="notion-icon-btn p-1 text-[#E03E3E] hover:bg-[#FBE4E4] dark:text-[#DF5452] dark:hover:bg-[rgba(255,0,26,0.1)]"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
               </div>
             </div>
          ))
        )}
      </div>

      <div className="p-4 border-t border-notion-border dark:border-notionDark-border flex flex-col gap-2 bg-[#f7f7f5] dark:bg-[#202020]">
        <Button 
          variant="danger" 
          className="w-full text-[13px]"
          onClick={() => { if (confirm('Are you sure you want to clear all layers?')) clearLayers(); }}
          disabled={layers.length === 0}
        >
          Clear All
        </Button>

        {/* Save prompt */}
        {showSavePrompt && (
          <div className="flex gap-1">
            <input
              type="text"
              className="flex-1 text-[12px] rounded border border-notion-border dark:border-notionDark-border bg-notion-bg dark:bg-notionDark-bg text-notion-text dark:text-notionDark-text px-2 py-1 outline-none focus:border-[#2eaadc]"
              placeholder="Config name…"
              value={saveName}
              onChange={(e) => setSaveName(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleSave(); if (e.key === 'Escape') setShowSavePrompt(false); }}
              autoFocus
            />
            <button onClick={handleSave} className="notion-icon-btn text-[#0F7B6C] hover:bg-[#EEFAF3]" title="Confirm save"><Save className="w-3.5 h-3.5" /></button>
          </div>
        )}

        {/* Load menu */}
        {showLoadMenu && savedConfigs.length > 0 && (
          <div className="flex flex-col gap-0.5 max-h-40 overflow-y-auto bg-notion-bg dark:bg-notionDark-bg border border-notion-border dark:border-notionDark-border rounded shadow-md">
            {savedConfigs.map(c => (
              <button
                key={c.id}
                className="text-left text-[12px] px-3 py-1.5 text-notion-text dark:text-notionDark-text hover:bg-notion-bgHover dark:hover:bg-notionDark-bgHover transition-colors"
                onClick={() => { loadConfig(c.id); setShowLoadMenu(false); }}
              >
                {c.name}
                <span className="text-notion-textSecondary dark:text-notionDark-textSecondary ml-1.5 text-[11px]">({c.layers.length} layers)</span>
              </button>
            ))}
          </div>
        )}

        <div className="flex gap-2">
          <Button
            variant="secondary"
            className="flex-1 text-[13px]"
            onClick={() => { setShowLoadMenu(v => !v); setShowSavePrompt(false); }}
            disabled={savedConfigs.length === 0}
          >
            <FolderOpen className="w-3.5 h-3.5 mr-1" />
            Load
          </Button>
          <Button
            variant="primary"
            className="flex-1 text-[13px]"
            onClick={() => { setShowSavePrompt(v => !v); setShowLoadMenu(false); }}
            disabled={layers.length === 0}
          >
            <Save className="w-3.5 h-3.5 mr-1" />
            Save
          </Button>
        </div>
      </div>
    </aside>
  );
}
