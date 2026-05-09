
import React, { useState } from 'react';
import MathTutor from './components/MathTutor';
import SequenceVisualizer from './components/SequenceVisualizer';
import ConvergenceRace from './components/ConvergenceRace';
import { COLORS, Icons } from './constants';

enum Tab {
  TUTOR = 'tutor',
  VISUALIZER = 'visualizer',
  RACE = 'race'
}

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>(Tab.TUTOR);

  return (
    <div className="h-screen bg-black text-white selection:bg-red-600/30 flex flex-col overflow-hidden">
      {/* Navigation Bar */}
      <nav className="z-50 bg-black/80 backdrop-blur-md border-b border-zinc-900 px-6 py-4 flex-shrink-0">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="text-red-600 font-black text-3xl tracking-tighter">MATHNEXUS</div>
            <div className="bg-red-600 text-[10px] px-1 font-bold rounded mt-1">AI</div>
          </div>
          
          <div className="hidden md:flex items-center gap-8">
            <button 
              onClick={() => setActiveTab(Tab.TUTOR)}
              className={`flex items-center gap-2 font-medium transition ${activeTab === Tab.TUTOR ? 'text-white' : 'text-zinc-500 hover:text-zinc-300'}`}
            >
              <Icons.Brain /> AI Tutor
            </button>
            <button 
              onClick={() => setActiveTab(Tab.VISUALIZER)}
              className={`flex items-center gap-2 font-medium transition ${activeTab === Tab.VISUALIZER ? 'text-white' : 'text-zinc-500 hover:text-zinc-300'}`}
            >
              <Icons.Chart /> Visualizer
            </button>
            <button 
              onClick={() => setActiveTab(Tab.RACE)}
              className={`flex items-center gap-2 font-medium transition ${activeTab === Tab.RACE ? 'text-white' : 'text-zinc-500 hover:text-zinc-300'}`}
            >
              <Icons.Trophy /> Convergence Race
            </button>
          </div>

          {/* Search and Profile elements removed as per user request */}
          <div className="w-10 md:w-0"></div>
        </div>
      </nav>

      {/* Main Content Area */}
      <main className={`flex-1 overflow-hidden relative ${activeTab !== Tab.TUTOR ? 'overflow-y-auto' : ''}`}>
        {activeTab !== Tab.TUTOR && (
          <header className="px-6 pt-12 pb-6 max-w-7xl mx-auto">
            <h1 className="text-4xl md:text-6xl font-black mb-4 bg-gradient-to-r from-white to-zinc-500 bg-clip-text text-transparent">
              {activeTab === Tab.VISUALIZER && "Visualize the Infinite."}
              {activeTab === Tab.RACE && "The Limit Challenge."}
            </h1>
            <p className="text-zinc-400 max-w-2xl text-lg">
              {activeTab === Tab.VISUALIZER && "Turn abstract mathematical sequences into stunning visual representations to understand convergence and divergence."}
              {activeTab === Tab.RACE && "Compare series side-by-side. Witness the varying speeds of convergence in real-time simulations."}
            </p>
          </header>
        )}

        <div className={`${activeTab !== Tab.TUTOR ? 'max-w-7xl mx-auto px-6 py-8' : 'h-full'}`}>
          {activeTab === Tab.TUTOR && <MathTutor />}
          {activeTab === Tab.VISUALIZER && <SequenceVisualizer />}
          {activeTab === Tab.RACE && <ConvergenceRace />}
        </div>
      </main>

      {/* Mobile Sticky Footer Nav */}
      <div className="md:hidden bg-zinc-900 border-t border-zinc-800 flex justify-around p-4 z-50">
        <button onClick={() => setActiveTab(Tab.TUTOR)} className={`flex flex-col items-center gap-1 ${activeTab === Tab.TUTOR ? 'text-white' : 'text-zinc-500'}`}>
          <Icons.Brain /> <span className="text-[10px]">Tutor</span>
        </button>
        <button onClick={() => setActiveTab(Tab.VISUALIZER)} className={`flex flex-col items-center gap-1 ${activeTab === Tab.VISUALIZER ? 'text-white' : 'text-zinc-500'}`}>
          <Icons.Chart /> <span className="text-[10px]">Visual</span>
        </button>
        <button onClick={() => setActiveTab(Tab.RACE)} className={`flex flex-col items-center gap-1 ${activeTab === Tab.RACE ? 'text-white' : 'text-zinc-500'}`}>
          <Icons.Trophy /> <span className="text-[10px]">Race</span>
        </button>
      </div>
    </div>
  );
};

export default App;
