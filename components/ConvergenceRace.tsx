
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { create, all } from 'mathjs';
import { SeriesRaceData } from '../types';

const math = create(all);

const INITIAL_SERIES: SeriesRaceData[] = [
  { id: '1', name: '1 / n', formula: '1 / n', color: '#E50914', history: [], converged: false },
  { id: '2', name: '1 / n²', formula: '1 / n^2', color: '#0071EB', history: [], converged: false },
  { id: '3', name: '(0.5)ⁿ', formula: '0.5^n', color: '#46D369', history: [], converged: false },
];

const ConvergenceRace: React.FC = () => {
  const [series, setSeries] = useState<SeriesRaceData[]>(INITIAL_SERIES);
  const [isRunning, setIsRunning] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [limit, setLimit] = useState(0.01);
  const [maxSteps, setMaxSteps] = useState(15);
  const timerRef = useRef<number | null>(null);

  const startRace = () => {
    setSeries(prev => prev.map(s => ({ ...s, history: [], converged: false, convergenceTime: undefined })));
    setCurrentTime(0);
    setIsRunning(true);
  };

  const stopRace = () => {
    setIsRunning(false);
    if (timerRef.current) clearInterval(timerRef.current);
  };

  useEffect(() => {
    if (isRunning) {
      // Pre-compile formulas for performance
      const compiledFormulas = series.map(s => {
        try {
          return { id: s.id, compiled: math.compile(s.formula) };
        } catch (e) {
          return { id: s.id, compiled: null };
        }
      });

      timerRef.current = window.setInterval(() => {
        setCurrentTime(prev => {
          const nextTime = prev + 1;
          
          setSeries(currentSeries => {
            const updated = currentSeries.map(s => {
              try {
                const formulaObj = compiledFormulas.find(f => f.id === s.id);
                if (!formulaObj?.compiled) throw new Error("Invalid Formula");

                const result = formulaObj.compiled.evaluate({ n: nextTime });
                let val: number;
                
                if (typeof result === 'object' && result !== null) {
                  if ('isComplex' in result) val = result.re;
                  else if ('isBigNumber' in result) val = result.toNumber();
                  else if ('isFraction' in result) val = result.valueOf();
                  else val = Number(result);
                } else {
                  val = Number(result);
                }

                if (isNaN(val) || !isFinite(val)) throw new Error("Invalid Result");

                const alreadyConverged = s.converged;
                const isNowConverged = Math.abs(val) < limit;
                
                return {
                  ...s,
                  history: [...s.history, { t: nextTime, val }],
                  converged: alreadyConverged || isNowConverged,
                  convergenceTime: (!alreadyConverged && isNowConverged) ? nextTime : s.convergenceTime
                };
              } catch (e) {
                // If an individual formula fails, mark it as converged to stop calculating
                return { ...s, converged: true, error: true };
              }
            });

            if (updated.every(u => u.converged) || nextTime >= maxSteps) {
              stopRace();
            }

            return updated;
          });

          return nextTime;
        });
      }, 100);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRunning, limit, maxSteps]);

  const chartData = Array.from({ length: currentTime }, (_, i) => {
    const t = i + 1;
    const entry: any = { t };
    series.forEach(s => {
      const hist = s.history.find(h => h.t === t);
      if (hist) entry[s.name] = hist.val;
    });
    return entry;
  });

  const winners = [...series].sort((a, b) => (a.convergenceTime || 999) - (b.convergenceTime || 999));

  const handleFormulaChange = (id: string, newFormula: string) => {
    setSeries(prev => prev.map(s => {
      if (s.id === id) {
        // Basic validation: check if it's parsable
        let hasError = false;
        try {
          math.parse(newFormula);
        } catch (e) {
          hasError = true;
        }
        return { ...s, formula: newFormula, name: newFormula, error: hasError, history: [], converged: false, convergenceTime: undefined };
      }
      return s;
    }));
    // Reset race if formula changes
    if (isRunning) stopRace();
    setCurrentTime(0);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
      <div className="lg:col-span-3 bg-zinc-900 p-6 rounded-xl border border-zinc-800 shadow-xl">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h3 className="text-2xl font-bold text-white mb-1">Convergence Race Track</h3>
            <div className="flex items-center gap-6">
              <p className="text-zinc-400 text-sm">Target Limit: |aₙ| &lt; {limit}</p>
              <div className="flex items-center gap-3 bg-black/20 px-3 py-1 rounded-lg border border-zinc-800">
                <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Race Distance</span>
                <input 
                  type="range" 
                  min="5" 
                  max="15" 
                  step="1" 
                  value={maxSteps}
                  disabled={isRunning}
                  onChange={(e) => setMaxSteps(parseInt(e.target.value))}
                  className="w-24 h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-red-600"
                />
                <span className="text-red-500 font-mono font-bold text-xs w-4">{maxSteps}</span>
              </div>
            </div>
          </div>
          <div className="flex gap-4">
            {!isRunning ? (
              <button 
                onClick={startRace}
                className="bg-red-600 hover:bg-red-700 text-white px-8 py-2 rounded-full font-bold uppercase tracking-widest transition"
              >
                Start Race
              </button>
            ) : (
              <button 
                onClick={stopRace}
                className="bg-zinc-700 hover:bg-zinc-600 text-white px-8 py-2 rounded-full font-bold uppercase tracking-widest transition"
              >
                Stop
              </button>
            )}
          </div>
        </div>

        <div className="h-[450px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#333" />
              <XAxis dataKey="t" stroke="#666" />
              <YAxis stroke="#666" />
              <Tooltip contentStyle={{ backgroundColor: '#18181b', border: '1px solid #3f3f46' }} />
              <Legend />
              {series.map(s => (
                <Line 
                  key={s.id}
                  type="monotone"
                  dataKey={s.name}
                  stroke={s.color}
                  strokeWidth={3}
                  dot={false}
                  isAnimationActive={false}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="space-y-6">
        <div className="bg-zinc-900 p-6 rounded-xl border border-zinc-800 shadow-xl">
          <h4 className="text-sm font-bold uppercase tracking-wider text-zinc-500 mb-4">Live Leaderboard</h4>
          <div className="space-y-4">
            {winners.map((s: any, idx) => (
              <div key={s.id} className="flex flex-col gap-2 p-4 rounded bg-zinc-800 border-l-4 transition-all" style={{ borderColor: s.color }}>
                <div className="flex items-center justify-between">
                  <div className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Position {idx + 1}</div>
                </div>
                
                <div className="relative flex items-center">
                  <input 
                    type="text"
                    value={s.formula}
                    disabled={isRunning}
                    onChange={(e) => handleFormulaChange(s.id, e.target.value)}
                    className={`w-full bg-black/40 border ${s.error ? 'border-red-500/50' : 'border-zinc-700'} rounded px-3 py-2 pr-24 text-sm font-mono text-white focus:outline-none focus:border-zinc-500 transition-all disabled:opacity-50`}
                    placeholder="Enter formula (e.g. 1/n)"
                  />
                  <div className="absolute right-3 pointer-events-none">
                    {s.error ? (
                      <span className="text-red-500 text-[9px] font-black uppercase tracking-tighter bg-red-950/30 px-1.5 py-0.5 rounded border border-red-900/30">Syntax Error</span>
                    ) : s.converged ? (
                      <span className="text-green-400 text-[9px] font-mono font-bold bg-green-950/30 px-1.5 py-0.5 rounded border border-green-900/30">Converged @ {s.convergenceTime}</span>
                    ) : (
                      <span className="text-zinc-600 text-[9px] uppercase font-black bg-zinc-900/50 px-1.5 py-0.5 rounded border border-zinc-800/50">Ready</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConvergenceRace;
