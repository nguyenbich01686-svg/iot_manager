import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
} from "react-router-dom";

import Sidebar
  from "./components/Sidebar";

import ProtectedRoute
  from "./components/ProtectedRoute";

import Login
  from "./pages/Login";

import Dashboard
  from "./pages/Dashboard";

import DataSensors
  from "./pages/DataSensors";

import ActionHistory
  from "./pages/ActionHistory";

import Profile
  from "./pages/Profile";

function Layout({
  children,
}) {
  return (
    <div className="app-layout">

      <Sidebar />

      <main className="main-content">
        {children}
      </main>

    </div>
  );
}

function App() {
  return (
    <BrowserRouter>

      <Routes>

        <Route
          path="/login"
          element={
            <Login />
          }
        />

        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Layout>
                <Dashboard />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/sensors"
          element={
            <ProtectedRoute>
              <Layout>
                <DataSensors />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/actions"
          element={
            <ProtectedRoute>
              <Layout>
                <ActionHistory />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <Layout>
                <Profile />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="*"
          element={
            <Navigate
              to="/"
              replace
            />
          }
        />

      </Routes>

    </BrowserRouter>
  );
}

export default App;