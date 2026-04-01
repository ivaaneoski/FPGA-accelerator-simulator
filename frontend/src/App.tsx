import { Routes, Route } from 'react-router-dom';
import { Navbar } from './components/layout/Navbar';
import { Sidebar } from './components/layout/Sidebar';
import { SimulatorPage } from './pages/SimulatorPage';
import { LayerBuilderPage } from './pages/LayerBuilderPage';
import { ComparisonPage } from './pages/ComparisonPage';
import { AnalyticsPage } from './pages/AnalyticsPage';
import { AboutPage } from './pages/AboutPage';

function App() {
  return (
    <div className="min-h-screen flex flex-col w-full">
      <Navbar />
      <div className="flex flex-col xl:flex-row flex-1 overflow-hidden">
        <Sidebar />
        <main className="flex-1 w-full overflow-y-auto no-scrollbar">
           <Routes>
             <Route path="/" element={<SimulatorPage />} />
             <Route path="/builder" element={<LayerBuilderPage />} />
             <Route path="/comparison" element={<ComparisonPage />} />
             <Route path="/analytics" element={<AnalyticsPage />} />
             <Route path="/about" element={<AboutPage />} />
           </Routes>
        </main>
      </div>
    </div>
  );
}

export default App;
