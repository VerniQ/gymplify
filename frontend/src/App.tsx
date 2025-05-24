// src/App.tsx
import { Routes, Route } from "react-router-dom";
import LoginPage from "./pages/LoginPage.tsx";
import RegisterPage from "./pages/RegisterPage.tsx";
import DashboardPage from "./pages/DashboardPage.tsx";
import ProtectedRoute from "./components/ProtectedRoute.tsx"; // Importuj ProtectedRoute
import { useAuth } from "./context/AuthContext.tsx"; // Importuj useAuth

function App() {
    const { isLoading } = useAuth(); // Pobierz stan ładowania

    if (isLoading) {
        // Możesz tu pokazać globalny spinner/ładowarkę na całą aplikację
        return <div className="flex justify-center items-center min-h-screen">Loading application...</div>;
    }

    return (
        <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            {/* Ścieżki chronione */}
            <Route element={<ProtectedRoute />}>
                <Route path="/dashboard" element={<DashboardPage />} />
                {/* Tutaj dodaj inne chronione ścieżki */}
            </Route>
            {/* Domyślna ścieżka lub przekierowanie */}
            <Route path="/" element={<LoginPage />} /> {/* Lub inna strona startowa */}
        </Routes>
    );
}

export default App;