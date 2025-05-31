// src/App.tsx
import { Routes, Route, Navigate } from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import DashboardPage from "./pages/DashboardPage";
import ProtectedRoute from "./components/ProtectedRoute";
import { useAuth } from "./context/AuthContext";

import TrainingsPage from './pages/TrainingsPage';
import SettingsPage from './pages/SettingsPage';

import AdminDashboardPage from "./pages/admin/AdminDashboardPage";
import MuscleGroupsPage from "./pages/admin/muscle-group/MuscleGroupsPage";
import ExercisesPage from "./pages/admin/exercise/ExercisesPage";
import UserManagementPage from "./pages/admin/user-management/UserManagementPage";
import TrainerManagementPage from "./pages/admin/trainer-management/TrainerManagementPage";
import TrainingPlansPage from "./pages/admin/training-plans/TrainingPlansPage";
import TrainerSessionsPage from "./pages/admin/trainer-sessions/TrainerSessionsPage";
import AdminStatisticsPage from "./pages/admin/statistics/AdminStatisticsPage";
import PersonalPlansPage from "./pages/admin/personal-plans/PersonalPlansPage.tsx";

function App() {
    const { isAuthenticated, isLoading, user } = useAuth();

    if (isLoading) {
        return (
            <div className="flex justify-center items-center min-h-screen bg-gray-100">
                <p className="text-lg text-gray-600">Ładowanie aplikacji...</p>
            </div>
        );
    }

    return (
        <Routes>
            <Route path="/login" element={!isAuthenticated ? <LoginPage /> : <Navigate to={user?.role === 'ADMIN' ? "/admin" : "/dashboard"} replace />} />
            <Route path="/register" element={!isAuthenticated ? <RegisterPage /> : <Navigate to={user?.role === 'ADMIN' ? "/admin" : "/dashboard"} replace />} />

            <Route element={<ProtectedRoute />}>
                <Route path="/dashboard" element={<DashboardPage />} />
                <Route path="/trainings" element={<TrainingsPage />} />
                <Route path="/settings" element={<SettingsPage />} />
                <Route path="/" element={<Navigate to={user?.role === 'ADMIN' ? "/admin" : "/dashboard"} replace />} />

                {user?.role === 'ADMIN' && (
                    <>
                        <Route path="/admin" element={<AdminDashboardPage />} />
                        <Route path="/admin/user-management" element={<UserManagementPage />} />
                        <Route path="/admin/trainer-management" element={<TrainerManagementPage />} />
                        <Route path="/admin/muscle-groups" element={<MuscleGroupsPage />} />
                        <Route path="/admin/exercises" element={<ExercisesPage />} />
                        <Route path="/admin/training-plans" element={<TrainingPlansPage />} />
                        <Route path="/admin/trainer-sessions" element={<TrainerSessionsPage />} />
                        <Route path="/admin/statistics" element={<AdminStatisticsPage />} />
                        <Route path="/admin/personal-plans" element={<PersonalPlansPage />} />
                    </>
                )}
            </Route>

            <Route
                path="*"
                element={
                    <Navigate to={isAuthenticated ? (user?.role === 'ADMIN' ? "/admin" : "/dashboard") : "/login"} replace />
                }
            />
        </Routes>
    );
}

export default App;