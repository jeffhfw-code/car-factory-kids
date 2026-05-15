import { Routes, Route, Navigate } from 'react-router-dom';
import HomeRoute from './routes/HomeRoute';
import FactoryRoute from './routes/FactoryRoute';
import GarageRoute from './routes/GarageRoute';
import GarageDetailRoute from './routes/GarageDetailRoute';
import LabRoute from './routes/LabRoute';
import RaceSelectRoute from './routes/RaceSelectRoute';
import RaceRunRoute from './routes/RaceRunRoute';
import RaceResultsRoute from './routes/RaceResultsRoute';
import NotebookRoute from './routes/NotebookRoute';
import SettingsRoute from './routes/SettingsRoute';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomeRoute />} />
      <Route path="/factory/:slotId" element={<FactoryRoute />} />
      <Route path="/garage" element={<GarageRoute />} />
      <Route path="/garage/:slotId" element={<GarageDetailRoute />} />
      <Route path="/lab/:slotId" element={<LabRoute />} />
      <Route path="/race/select" element={<RaceSelectRoute />} />
      <Route path="/race/run/:trackId" element={<RaceRunRoute />} />
      <Route path="/race/results" element={<RaceResultsRoute />} />
      <Route path="/notebook" element={<NotebookRoute />} />
      <Route path="/settings" element={<SettingsRoute />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
