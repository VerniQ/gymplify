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
import AdminDashboardPage from "./pages/admin/AdminDashboardPage.tsx";
import MuscleGroupsPage from "./pages/admin/muscle-group/MuscleGroupsPage.tsx";
import ExercisesPage from "./pages/admin/exercise/ExercisesPage.tsx";
import UserManagementPage from "./pages/admin/user-management/UserManagementPage.tsx";
import TrainerManagementPage from "./pages/admin/trainer-management/TrainerManagementPage.tsx";

function App() {
    const { isAuthenticated, isLoading, user } = useAuth();

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
                <Route path="/admin" element={<AdminDashboardPage/>}/>
                <Route path="/admin/muscle-groups" element={<MuscleGroupsPage/>}/>
                <Route path="/admin/exercises/" element={<ExercisesPage/>}/>
            </Route>

                {user?.role === 'ADMIN' && (
                    <>
                        <Route path="/admin" element={<AdminDashboardPage />} />
                        <Route path="/admin/muscle-groups" element={<MuscleGroupsPage />} />
                        <Route path="/admin/user-management" element={<UserManagementPage />} />
                        <Route path="/admin/trainer-management" element={user?.role === 'ADMIN' ? <TrainerManagementPage /> : <Navigate to="/dashboard" replace />} />
                    </>
                )}
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