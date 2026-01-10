import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { Toaster } from "sonner";
import { AuthProvider } from "@/contexts/AuthContext";
import { LanguageProvider } from "@/contexts/LanguageContext";
import Layout from "@/components/Layout";
import ProtectedRoute from "@/components/ProtectedRoute";
import SignIn from "@/pages/SignIn";
import SignUp from "@/pages/SignUp";
import ForgotPassword from "@/pages/ForgotPassword";
import Dashboard from "@/pages/Dashboard";
import CreateShipment from "@/pages/CreateShipment";
import Shipments from "@/pages/Shipments";
import Contacts from "@/pages/Contacts";
import Balance from "@/pages/Balance";
import Profile from "@/pages/Profile";

function App() {
  return (
    <LanguageProvider>
      <AuthProvider>
        <Router>
          <div className="App">
            <Routes>
              <Route path="/signin" element={<SignIn />} />
              <Route path="/login" element={<SignIn />} />
              <Route path="/signup" element={<SignUp />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <Layout>
                      <Dashboard />
                    </Layout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/create-shipment"
                element={
                  <ProtectedRoute>
                    <Layout>
                      <CreateShipment />
                    </Layout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/shipments"
                element={
                  <ProtectedRoute>
                    <Layout>
                      <Shipments />
                    </Layout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/contacts"
                element={
                  <ProtectedRoute>
                    <Layout>
                      <Contacts />
                    </Layout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/balance"
                element={
                  <ProtectedRoute>
                    <Layout>
                      <Balance />
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
            </Routes>
            <Toaster
              position="top-right"
              richColors
              closeButton
              toastOptions={{
                duration: 4000,
                style: {
                  fontFamily: "inherit",
                },
              }}
            />
          </div>
        </Router>
      </AuthProvider>
    </LanguageProvider>
  );
}

export default App;
