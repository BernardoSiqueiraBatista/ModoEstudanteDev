import AuthLayout from '../layouts/AuthLayout';
import MainLayout from '../layouts/MainLayout';
import Cadastro from '../views/auth/Cadastro';
import ProtectedRoute from './ProtectedRoute';

import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

export default function RouterView() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<AuthLayout />} />
        <Route path="/cadastro" element={<Cadastro />} />

        <Route
          path="/app"
          element={
            <ProtectedRoute>
              <Navigate to="/dashboard" replace />
            </ProtectedRoute>
          }
        />

        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <MainLayout />
            </ProtectedRoute>
          }
        />

        <Route
          path="/agenda"
          element={
            <ProtectedRoute>
              <MainLayout />
            </ProtectedRoute>
          }
        />

        <Route
          path="/pacientes"
          element={
            <ProtectedRoute>
              <MainLayout />
            </ProtectedRoute>
          }
        />
        <Route
          path="/pacientes/:id"
          element={
            <ProtectedRoute>
              <MainLayout />
            </ProtectedRoute>
          }
        />

        <Route
          path="/consulta/ativa/:id"
          element={
            <ProtectedRoute>
              <MainLayout />
            </ProtectedRoute>
          }
        />

        <Route
          path="/consulta/raciocinio/:id"
          element={
            <ProtectedRoute>
              <MainLayout />
            </ProtectedRoute>
          }
        />

        <Route
        path="/consulta/encerramento/:id"
          element={
            <ProtectedRoute>
              <MainLayout />
            </ProtectedRoute>
          }
        />

        <Route
        path="/simulados"
          element={
            <ProtectedRoute>
              <MainLayout />
            </ProtectedRoute>
          }
        />

        <Route
        path="/simulados/rapido"
          element={
            <ProtectedRoute>
              <MainLayout />
            </ProtectedRoute>
          }
        />

        <Route
        path="/simulados/iniciar"
          element={
            <ProtectedRoute>
              <MainLayout />
            </ProtectedRoute>
          }
        />

        <Route
        path="/simulados/resultado/:id"
          element={
            <ProtectedRoute>
              <MainLayout />
            </ProtectedRoute>
          }
        />

        <Route
        path="/simulados/executar/:id"
          element={
            <ProtectedRoute>
              <MainLayout />
            </ProtectedRoute>
          }
        />

        {[
          '/relatorios',
          '/vision',
          '/financas',
          '/questoes',
          '/consultas-simuladas',
          '/flashcards',
          '/paper',
        ].map((path) => (
          <Route
            key={path}
            path={path}
            element={
              <ProtectedRoute>
                <MainLayout />
              </ProtectedRoute>
            }
          />
        ))}

        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Router>
  );
}
