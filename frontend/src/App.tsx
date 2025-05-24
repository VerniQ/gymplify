// src/App.tsx
import { Routes, Route, Navigate } from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import DashboardPage from "./pages/DashboardPage";
import ProtectedRoute from "./components/ProtectedRoute";
import { useAuth } from "./context/AuthContext";


import TrainingsPage from './pages/TrainingsPage';
import NotificationsPage from './pages/NotificationsPage';
import FavoritesPage from './pages/FavoritesPage';
import SettingsPage from './pages/SettingsPage';

function App() {
    const { isAuthenticated, isLoading } = useAuth(); /

    if (isLoading) {
        return <div className="flex justify-center items-center min-h-screen bg-gray-100"><p className="text-lg text-gray-600">Ładowanie aplikacji...</p></div>;
    }

    return (
        <Routes>

            <Route path="/login" element={!isAuthenticated ? <LoginPage /> : <Navigate to="/dashboard" replace />} />
            <Route path="/register" element={!isAuthenticated ? <RegisterPage /> : <Navigate to="/dashboard" replace />} />


            <Route element={<ProtectedRoute />}>
                <Route path="/dashboard" element={<DashboardPage />} />
                <Route path="/trainings" element={<TrainingsPage />} />
                <Route path="/notifications" element={<NotificationsPage />} />
                <Route path="/favorites" element={<FavoritesPage />} />
                <Route path="/settings" element={<SettingsPage />} />

                <Route path="/" element={<Navigate to="/dashboard" replace />} />
            </Route>


            <Route
                path="/"
                element={
                    !isAuthenticated ? <Navigate to="/login" replace /> : <Navigate to="/dashboard" replace />
                }
            />

            <Route path="*" element={<Navigate to={isAuthenticated ? "/dashboard" : "/login"} replace />} />
        </Routes>
    );
}

export default App;