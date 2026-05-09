
import React, { useState, useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ScatterChart, Scatter, ZAxis, ReferenceLine, Label } from 'recharts';
import { create, all } from 'mathjs';
import { SequenceData } from '../types';

const math = create(all);

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const { n, value } = payload[0].payload;
    return (
      <div className="bg-black border border-zinc-800 px-4 py-2 rounded-lg shadow-2xl backdrop-blur-md">
        <p className="text-[10px] text-zinc-500 font-black uppercase tracking-widest mb-1">Coordinates</p>
        <div className="flex items-center gap-2">
           <span className="text-blue-500 font-mono font-bold">n: {n}</span>
           <span className="text-zinc-700">|</span>
           <span className="text-white font-mono font-bold">aₙ: {value.toFixed(4)}</span>
        </div>
      </div>
    );
  }
  return null;
};

const SequenceVisualizer: React.FC = () => {
  const [inputFormula, setInputFormula] = useState('');
  const [activeFormula, setActiveFormula] = useState<string | null>(null);
  const [range, setRange] = useState(10);
  const [chartType, setChartType] = useState<'line' | 'scatter'>('scatter');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleVisualize = () => {
    if (!inputFormula.trim()) return;
    setIsProcessing(true);
    setError(null);
    try {
      // Local deterministic validation using mathjs
      math.parse(inputFormula);
      setActiveFormula(inputFormula);
    } catch (err: any) {
      setError(`Mathematical Syntax Error: ${err.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const compiledFormula = useMemo(() => {
    if (!activeFormula) return null;
    try {
      return math.compile(activeFormula);
    } catch (e) {
      return null;
    }
  }, [activeFormula]);

  const data = useMemo(() => {
    if (!compiledFormula) return [];
    
    const results: SequenceData[] = [];
    for (let n = 0; n <= range; n++) {
      try {
        const result = compiledFormula.evaluate({ n });
        let val: number;
        
        // Safe Evaluator: Handle Complex, BigNumber, Fraction, and standard numbers
        if (typeof result === 'object' && result !== null) {
          if ('isComplex' in result) {
            val = result.re; // Use real part for visualization
          } else if ('isBigNumber' in result) {
            val = result.toNumber();
          } else if ('isFraction' in result) {
            val = result.valueOf();
          } else {
            val = Number(result);
          }
        } else {
          val = Number(result);
        }

        if (isFinite(val) && !isNaN(val)) {
          results.push({ n, value: val });
        }
      } catch (err: any) {
        // Skip points that cause errors (e.g. log of negative)
      }
    }
    return results;
  }, [compiledFormula, range]);

  const yDomain = useMemo(() => {
    if (data.length === 0) return [0, 1];
    const values = data.map(d => d.value);
    const min = Math.min(...values);
    const max = Math.max(...values);
    
    if (min === max) return [min - 1, max + 1];
    
    const diff = Math.abs(max - min);
    const padding = diff * 0.15;
    
    // Ensure we don't return NaN or Infinity
    const finalMin = isFinite(min - padding) ? min - padding : -10;
    const finalMax = isFinite(max + padding) ? max + padding : 10;
    
    return [finalMin, finalMax];
  }, [data]);

  const formatYAxis = (tickItem: number): string => {
    if (Math.abs(tickItem) < 0.001 && tickItem !== 0) return tickItem.toExponential(1);
    if (Math.abs(tickItem) >= 1000) return tickItem.toLocaleString();
    return tickItem.toFixed(2);
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 bg-[#0a0a0b] p-6 rounded-2xl border border-zinc-900 shadow-2xl relative">
          <div className="flex items-center justify-between mb-8">
            <div className="flex flex-col">
              <h3 className="text-2xl font-black tracking-tight text-white">Visualization Engine</h3>
              <p className="text-[10px] font-black mt-1 uppercase tracking-widest flex items-center gap-2">
                <span className="text-zinc-700">STATUS:</span>
                {activeFormula ? (
                  <span className="text-[#3b82f6]">PLOTTING {activeFormula.toUpperCase()}</span>
                ) : (
                  <span className="text-zinc-800">READY</span>
                )}
              </p>
            </div>
            <div className="flex gap-1 bg-[#111113] p-1.5 rounded-xl border border-zinc-800/50">
               <button 
                onClick={() => setChartType('line')}
                className={`px-5 py-2 rounded-lg text-xs font-black uppercase tracking-wider transition-all ${chartType === 'line' ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20' : 'text-zinc-700 hover:text-zinc-400'}`}
              >
                Line
              </button>
              <button 
                onClick={() => setChartType('scatter')}
                className={`px-5 py-2 rounded-lg text-xs font-black uppercase tracking-wider transition-all ${chartType === 'scatter' ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20' : 'text-zinc-700 hover:text-zinc-400'}`}
              >
                Scatter
              </button>
            </div>
          </div>
          
          <div className="h-[450px] w-full relative">
            {isProcessing && (
              <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] z-10 flex items-center justify-center rounded-lg">
                <div className="flex flex-col items-center gap-3">
                  <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                  <span className="text-[10px] font-black text-blue-400 uppercase tracking-[0.3em]">Processing Logic</span>
                </div>
              </div>
            )}
            
            {!activeFormula && !isProcessing && (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-zinc-900 select-none z-0">
                 <div className="w-24 h-24 border border-zinc-900 rounded-full flex items-center justify-center mb-6">
                    <div className="w-12 h-12 border border-zinc-900 rounded-full animate-ping"></div>
                 </div>
                 <p className="text-xs font-black uppercase tracking-[0.5em] opacity-40">System Idle</p>
              </div>
            )}

            <ResponsiveContainer width="100%" height="100%">
              {chartType === 'line' ? (
                <LineChart 
                  key={`line-${activeFormula}`} 
                  data={data} 
                  margin={{ top: 20, right: 40, left: 10, bottom: 20 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#161618" vertical={false} />
                  <XAxis 
                    dataKey="n" 
                    stroke="#27272a" 
                    tick={{ fill: '#3f3f46', fontSize: 11, fontWeight: 800 }} 
                    domain={[0, range]} 
                    type="number"
                    ticks={[0, 3, 6, 9, range]}
                  >
                    <Label value="n" position="insideBottomRight" offset={-5} fill="#3b82f6" style={{ fontWeight: 900, fontSize: 18, fontFamily: 'Fira Code' }} />
                  </XAxis>
                  <YAxis 
                    stroke="#27272a" 
                    tick={{ fill: '#3f3f46', fontSize: 11, fontWeight: 800 }} 
                    domain={yDomain}
                    tickFormatter={formatYAxis}
                  >
                    <Label value="aₙ" position="insideTopLeft" offset={25} fill="#3b82f6" style={{ fontWeight: 900, fontSize: 18, fontFamily: 'Fira Code' }} />
                  </YAxis>
                  <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#3b82f6', strokeWidth: 1, strokeDasharray: '5 5' }} />
                  <ReferenceLine y={0} stroke="#18181b" strokeWidth={1} />
                  <Line 
                    type="monotone" 
                    dataKey="value" 
                    stroke="#3b82f6" 
                    strokeWidth={3} 
                    dot={{ r: 4, fill: '#3b82f6', strokeWidth: 0 }} 
                    activeDot={{ r: 6, fill: '#fff', strokeWidth: 0 }}
                  />
                </LineChart>
              ) : (
                <ScatterChart 
                  key={`scatter-${activeFormula}`} 
                  margin={{ top: 20, right: 40, left: 10, bottom: 20 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#161618" />
                  <XAxis 
                    type="number" 
                    dataKey="n" 
                    stroke="#27272a" 
                    tick={{ fill: '#3f3f46', fontSize: 11, fontWeight: 800 }} 
                    domain={[0, range]} 
                  >
                    <Label value="n" position="insideBottomRight" offset={-5} fill="#3b82f6" style={{ fontWeight: 900, fontSize: 18, fontFamily: 'Fira Code' }} />
                  </XAxis>
                  <YAxis 
                    type="number" 
                    dataKey="value" 
                    stroke="#27272a" 
                    tick={{ fill: '#3f3f46', fontSize: 11, fontWeight: 800 }} 
                    domain={yDomain}
                    tickFormatter={formatYAxis}
                  >
                    <Label value="aₙ" position="insideTopLeft" offset={25} fill="#3b82f6" style={{ fontWeight: 900, fontSize: 18, fontFamily: 'Fira Code' }} />
                  </YAxis>
                  <Tooltip content={<CustomTooltip />} />
                  <ReferenceLine y={0} stroke="#18181b" strokeWidth={1} />
                  <Scatter name="Sequence" data={data} fill="#3b82f6" />
                </ScatterChart>
              )}
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-[#0e0e10] p-8 rounded-2xl border border-zinc-900 flex flex-col gap-8 shadow-2xl">
          <div className="flex-1 space-y-6">
            <label className="block text-[10px] font-black text-zinc-600 uppercase tracking-widest">Sequence Formula aₙ</label>
            <div className="space-y-4">
              <input
                type="text"
                value={inputFormula}
                onChange={(e) => {
                  setInputFormula(e.target.value);
                  setError(null);
                }}
                className={`w-full bg-[#080809] border ${error ? 'border-red-600/50' : 'border-zinc-800'} rounded-xl px-6 py-5 font-mono text-white text-lg focus:outline-none focus:border-zinc-700 transition-all placeholder:text-zinc-800`}
                placeholder="n*(-1)^n"
              />
              
              {error && (
                <div className="bg-red-950/20 border border-red-900/50 px-4 py-3 rounded-lg flex items-start gap-3 animate-in fade-in slide-in-from-top-2">
                  <span className="text-red-500 mt-0.5">⚠️</span>
                  <div className="flex-1">
                    <p className="text-[10px] font-black text-red-500 uppercase tracking-widest mb-0.5">Engineering Halt</p>
                    <p className="text-xs text-red-200/70 font-medium leading-relaxed">{error}</p>
                  </div>
                </div>
              )}

              <button
                onClick={handleVisualize}
                disabled={isProcessing || !inputFormula.trim()}
                className="w-full bg-[#1e3a8a]/80 hover:bg-[#1e3a8a] disabled:opacity-30 text-white font-black py-5 rounded-xl transition-all shadow-xl uppercase tracking-widest text-sm"
              >
                {isProcessing ? 'Optimizing...' : 'Visualize Sequence'}
              </button>
            </div>
          </div>

          <div className="pt-8 border-t border-zinc-800/50 mt-auto space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">Plot Range (N)</span>
              <span className="text-[#3b82f6] font-mono font-black text-sm">{range}</span>
            </div>
            <input
              type="range" min="5" max="50" step="1" value={range}
              onChange={(e) => setRange(parseInt(e.target.value))}
              className="w-full h-1.5 bg-[#080809] rounded-lg appearance-none cursor-pointer accent-blue-600"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default SequenceVisualizer;
