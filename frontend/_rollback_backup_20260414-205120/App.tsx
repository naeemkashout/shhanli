// @ts-nocheck
import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { Toaster } from "sonner";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { LanguageProvider } from "@/contexts/LanguageContext";
import Layout from "@/components/Layout";
import ProtectedRoute from "@/components/ProtectedRoute";
import SignIn from "@/pages/SignIn";
import SignUp from "@/pages/SignUp";
import ForgotPassword from "@/pages/ForgotPassword";
import ResetPassword from "@/pages/ResetPassword";
import Dashboard from "@/pages/Dashboard";
import CreateShipment from "@/pages/CreateShipment";
import Shipments from "@/pages/Shipments";
import Contacts from "@/pages/Contacts";
import Balance from "@/pages/Balance";
import FinancialTransactions from "@/pages/FinancialTransactions";
import Notifications from "@/pages/Notifications";
import Profile from "@/pages/Profile";
import Companies from "@/pages/Companies";
import CompanyDetails from "@/pages/CompanyDetails";
import AboutUs from "@/pages/AboutUs";
import ContactUs from "@/pages/ContactUs";
import AdminHeader from "@/pages/admin/AdminHeader";
import AdminDashboard from "@/pages/admin/AdminDashboard";
import UsersManagement from "@/pages/admin/UsersManagement";
import ShipmentsManagement from "@/pages/admin/ShipmentsManagement";
import WalletManagement from "@/pages/admin/WalletManagement";
import ActivityLogs from "@/pages/admin/ActivityLogs";
import CompaniesManagement from "@/pages/admin/CompaniesManagement";
import AdminChangePassword from "@/pages/admin/AdminChangePassword";
import CancellationRequests from "@/pages/admin/CancellationRequests";
import WithdrawalRequests from "@/pages/admin/WithdrawalRequests";
import ComparisonInvoices from "@/pages/admin/ComparisonInvoices";

const adminRoles = ["admin", "super-admin", "company-admin"];

function RoleHomeRedirect() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/signin" replace />;
  }

  if (adminRoles.includes(user.role || "")) {
    return <Navigate to="/admin" replace />;
  }

  return <Navigate to="/dashboard" replace />;
}

function UserSiteRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/signin" replace />;
  }

  return <>{children}</>;
}

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
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/" element={<RoleHomeRedirect />} />
              <Route
                path="/dashboard"
                element={
                  <UserSiteRoute>
                    <Layout>
                      <Dashboard />
                    </Layout>
                  </UserSiteRoute>
                }
              />
              <Route
                path="/create-shipment"
                element={
                  <UserSiteRoute>
                    <Layout>
                      <CreateShipment />
                    </Layout>
                  </UserSiteRoute>
                }
              />
              <Route
                path="/shipments"
                element={
                  <UserSiteRoute>
                    <Layout>
                      <Shipments />
                    </Layout>
                  </UserSiteRoute>
                }
              />
              <Route
                path="/contacts"
                element={
                  <UserSiteRoute>
                    <Layout>
                      <Contacts />
                    </Layout>
                  </UserSiteRoute>
                }
              />
              <Route
                path="/balance"
                element={
                  <UserSiteRoute>
                    <Layout>
                      <Balance />
                    </Layout>
                  </UserSiteRoute>
                }
              />
              <Route
                path="/financial-transactions"
                element={
                  <UserSiteRoute>
                    <Layout>
                      <FinancialTransactions />
                    </Layout>
                  </UserSiteRoute>
                }
              />
              <Route
                path="/notifications"
                element={
                  <UserSiteRoute>
                    <Layout>
                      <Notifications />
                    </Layout>
                  </UserSiteRoute>
                }
              />
              <Route
                path="/profile"
                element={
                  <UserSiteRoute>
                    <Layout>
                      <Profile />
                    </Layout>
                  </UserSiteRoute>
                }
              />
              <Route
                path="/companies"
                element={
                  <UserSiteRoute>
                    <Layout>
                      <Companies />
                    </Layout>
                  </UserSiteRoute>
                }
              />
              <Route
                path="/companies/:companyId"
                element={
                  <UserSiteRoute>
                    <Layout>
                      <CompanyDetails />
                    </Layout>
                  </UserSiteRoute>
                }
              />
              <Route
                path="/about-us"
                element={
                  <UserSiteRoute>
                    <Layout>
                      <AboutUs />
                    </Layout>
                  </UserSiteRoute>
                }
              />
              <Route
                path="/contact-us"
                element={
                  <UserSiteRoute>
                    <Layout>
                      <ContactUs />
                    </Layout>
                  </UserSiteRoute>
                }
              />
              <Route
                path="/admin"
                element={
                  <ProtectedRoute
                    allowedRoles={["admin", "super-admin", "company-admin"]}
                  >
                    <AdminHeader>
                      <AdminDashboard />
                    </AdminHeader>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/users"
                element={
                  <ProtectedRoute allowedRoles={["admin", "super-admin"]}>
                    <AdminHeader>
                      <UsersManagement />
                    </AdminHeader>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/shipments"
                element={
                  <ProtectedRoute
                    allowedRoles={["admin", "super-admin", "company-admin"]}
                  >
                    <AdminHeader>
                      <ShipmentsManagement />
                    </AdminHeader>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/create-shipment"
                element={
                  <ProtectedRoute
                    allowedRoles={["admin", "super-admin", "company-admin"]}
                  >
                    <AdminHeader>
                      <CreateShipment />
                    </AdminHeader>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/cancellation-requests"
                element={
                  <ProtectedRoute allowedRoles={["company-admin"]}>
                    <AdminHeader>
                      <CancellationRequests />
                    </AdminHeader>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/withdrawal-requests"
                element={
                  <ProtectedRoute allowedRoles={["admin", "super-admin"]}>
                    <AdminHeader>
                      <WithdrawalRequests />
                    </AdminHeader>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/wallet"
                element={
                  <ProtectedRoute
                    allowedRoles={["admin", "super-admin", "company-admin"]}
                  >
                    <AdminHeader>
                      <WalletManagement />
                    </AdminHeader>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/comparison-invoices"
                element={
                  <ProtectedRoute
                    allowedRoles={["admin", "super-admin", "company-admin"]}
                  >
                    <AdminHeader>
                      <ComparisonInvoices />
                    </AdminHeader>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/activity"
                element={
                  <ProtectedRoute allowedRoles={["admin", "super-admin"]}>
                    <AdminHeader>
                      <ActivityLogs />
                    </AdminHeader>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/companies"
                element={
                  <ProtectedRoute
                    allowedRoles={["admin", "super-admin", "company-admin"]}
                  >
                    <AdminHeader>
                      <CompaniesManagement />
                    </AdminHeader>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/change-password"
                element={
                  <ProtectedRoute
                    allowedRoles={["admin", "super-admin", "company-admin"]}
                  >
                    <AdminHeader>
                      <AdminChangePassword />
                    </AdminHeader>
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
