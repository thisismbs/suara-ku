import React from 'react';
import { Sliders, Grid, ShieldAlert, Timer, Volume2, RotateCcw } from 'lucide-react';
import useSettings from '../hooks/useSettings';

export default function Settings() {
  const { settings, updateSettings, resetToDefaults } = useSettings();

  return (
    <div className="space-y-4 pb-6">
      {/* Header Halaman Clean Modern */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm">
        <div className="space-y-1">
          <h2 className="text-base font-bold text-slate-800 tracking-tight flex items-center gap-2">
            <span className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Sliders className="w-4 h-4 stroke-[2.2]" />
            </span>
            Pengaturan Aksesibilitas
          </h2>
          <p className="text-xs text-slate-500 font-medium">
            Adaptasi kontrol motorik Cerebral Palsy, jeda tremor, dan suara
          </p>
        </div>
      </div>

      {/* Kartu 1 - Tata Letak Papan */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
            <Grid className="w-4 h-4 text-indigo-600" />
            Tata Letak Papan Komunikasi
          </label>
          <span className="text-[11px] font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-100">
            {settings.gridSize}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2.5">
          {[
            {
              id: '2x2',
              label: 'Grid 2x2',
              desc: 'Sangat Besar (ramah tremor berat)'
            },
            {
              id: '3x3',
              label: 'Grid 3x3',
              desc: 'Standar (tampilan seimbang)'
            }
          ].map((item) => {
            const isSelected = settings.gridSize === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => updateSettings('gridSize', item.id)}
                className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-indigo-50 border-indigo-400 text-indigo-900 shadow-xs'
                    : 'bg-slate-50/70 border-slate-200/80 text-slate-600 hover:bg-slate-100 font-medium'
                }`}
              >
                <div className="text-xs font-bold">{item.label}</div>
                <div className="text-[10px] text-slate-400 mt-0.5 leading-snug">
                  {item.desc}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Kartu 2 - Kontrol Motorik (Anti-Tremor) */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm space-y-3">
        <div className="flex justify-between items-center text-xs">
          <label className="font-bold text-slate-700 flex items-center gap-1.5">
            <ShieldAlert className="w-4 h-4 text-amber-500" /> Jeda Lockout (Anti-Tremor)
          </label>
          <span className="font-mono font-bold bg-amber-50 text-amber-800 border border-amber-200 px-2.5 py-0.5 rounded-full text-[11px]">
            {settings.lockoutMs > 0 ? `${settings.lockoutMs} ms` : 'Nonaktif (0 ms)'}
          </span>
        </div>

        <input
          type="range"
          min="0"
          max="1500"
          step="100"
          value={settings.lockoutMs}
          onChange={(e) => updateSettings('lockoutMs', Number(e.target.value))}
          className="w-full accent-indigo-600 cursor-pointer"
        />

        <p className="text-[11px] text-slate-400 leading-relaxed">
          Mencegah penekanan ganda yang tidak disengaja. Sentuhan berulang dalam rentang waktu ini akan diabaikan.
        </p>
      </div>

      {/* Kartu 3 - Dwell Time (Sentuh Tahan) */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <Timer className="w-4 h-4 text-indigo-600" /> Sentuh Tahan (Dwell Click)
            </label>
            <p className="text-[11px] text-slate-400">
              Pilih simbol cukup dengan menahan jari tanpa mengangkat
            </p>
          </div>

          {/* Toggle Switch */}
          <button
            type="button"
            role="switch"
            aria-checked={settings.dwellEnabled}
            onClick={() => updateSettings('dwellEnabled', !settings.dwellEnabled)}
            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
              settings.dwellEnabled ? 'bg-indigo-600' : 'bg-slate-200'
            }`}
          >
            <span
              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                settings.dwellEnabled ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        {/* Slider durasi tahan jika aktif */}
        {settings.dwellEnabled && (
          <div className="pt-2 space-y-2 border-t border-slate-100 animate-in fade-in duration-200">
            <div className="flex justify-between items-center text-xs">
              <span className="font-semibold text-slate-600">Durasi Tahan</span>
              <span className="font-mono font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 px-2 py-0.5 rounded-full text-[11px]">
                {settings.dwellMs} ms ({(settings.dwellMs / 1000).toFixed(1)} dtk)
              </span>
            </div>
            <input
              type="range"
              min="500"
              max="2000"
              step="100"
              value={settings.dwellMs}
              onChange={(e) => updateSettings('dwellMs', Number(e.target.value))}
              className="w-full accent-indigo-600 cursor-pointer"
            />
          </div>
        )}
      </div>

      {/* Kartu 4 - Kecepatan Suara */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm space-y-3">
        <div className="flex justify-between items-center text-xs">
          <label className="font-bold text-slate-700 flex items-center gap-1.5">
            <Volume2 className="w-4 h-4 text-emerald-600" /> Kecepatan Artikulasi Suara
          </label>
          <span className="font-mono font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded-full text-[11px]">
            {Number(settings.speechRate || 0.9).toFixed(1)}x
          </span>
        </div>

        <input
          type="range"
          min="0.7"
          max="1.2"
          step="0.05"
          value={settings.speechRate || 0.9}
          onChange={(e) => updateSettings('speechRate', parseFloat(e.target.value))}
          className="w-full accent-indigo-600 cursor-pointer"
        />

        <div className="flex justify-between text-[10px] text-slate-400 font-medium px-0.5">
          <span>0.7x (Lambat & Jelas)</span>
          <span>0.9x (Rekomendasi Anak)</span>
          <span>1.2x (Cepat)</span>
        </div>
      </div>

      {/* Tombol Kembalikan ke Default */}
      <div className="pt-2">
        <button
          type="button"
          onClick={resetToDefaults}
          className="btn-clay w-full py-3 bg-white hover:bg-slate-50 text-slate-600 border border-slate-200/90 font-semibold text-xs rounded-2xl shadow-clay active:shadow-clay-pressed flex items-center justify-center gap-1.5 cursor-pointer"
        >
          <RotateCcw className="w-4 h-4" />
          <span>Kembalikan ke Default</span>
        </button>
      </div>
    </div>
  );
}
