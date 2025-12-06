import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { GameProvider, useGame } from './context/GameContext';
import { Layout } from './components/Layout';
import { SplashPage } from './pages/SplashPage';
import { HomePage } from './pages/HomePage';
import { SquadraPage } from './pages/SquadraPage';
import { LeaderboardPage } from './pages/LeaderboardPage';
import { PremiPage } from './pages/PremiPage';
import { AdminPage } from './pages/AdminPage';

// Protected Route wrapper
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useGame();
  
  if (isLoading) {
    return (
      <div className="min-h-screen bg-dark flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-coral-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }
  
  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }
  
  return <>{children}</>;
};

function AppRoutes() {
  const { isAuthenticated } = useGame();

  return (
    <Routes>
      {/* Splash / Login */}
      <Route 
        path="/" 
        element={isAuthenticated ? <Navigate to="/home" replace /> : <SplashPage />} 
      />
      
      {/* Protected Routes with Layout */}
      <Route element={
        <ProtectedRoute>
          <Layout />
        </ProtectedRoute>
      }>
        <Route path="/home" element={<HomePage />} />
        <Route path="/squadra" element={<SquadraPage />} />
        <Route path="/leaderboard" element={<LeaderboardPage />} />
        <Route path="/premi" element={<PremiPage />} />
        <Route path="/admin" element={<AdminPage />} />
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <GameProvider>
      <Router>
        <AppRoutes />
      </Router>
    </GameProvider>
  );
}

export default App;
