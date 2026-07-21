import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import PrivateRoute from './components/PrivateRoute';
import Layout from './components/layout/Layout';
import Dashboard from './pages/Dashboard';
import PointCharts from './pages/PointCharts';
import ResortDetail from './pages/ResortDetail';
import TripCalculator from './pages/TripCalculator';
import MyContracts from './pages/MyContracts';
import Trends from './pages/Trends';
import Login from './pages/Login';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Dashboard />} />
            <Route path="login" element={<Login />} />
            <Route path="charts" element={<PointCharts />} />
            <Route path="charts/:resortId" element={<ResortDetail />} />
            <Route path="calculator" element={<TripCalculator />} />
            <Route path="contracts" element={<PrivateRoute><MyContracts /></PrivateRoute>} />
            <Route path="trends" element={<Trends />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
