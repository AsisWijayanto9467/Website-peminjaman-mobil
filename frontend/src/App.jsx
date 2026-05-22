import React from "react";
import {BrowserRouter as Router, Routes, Route} from "react-router-dom"
import Login from "./pages/Auth/Login";
import Register from "./pages/Auth/Register";
import Dashboard from "./pages/User/Dashboard";
import DetailList from "./pages/User/Installment/DetailList";
import List from "./pages/User/Installment/List";
import CreateValidation from "./pages/User/Validation/CreateValidation";
import AdminDashboard from "./pages/Admin/AdminDashboard";
import OfficerDashboard from "./pages/Officer/OfficerDashboard";
import ValidatorDashboard from "./pages/Validator/ValidatorDashboard";
import ProtectedRoute from "./services/ProtectedRoute";
import ValidationReports from "./pages/Admin/Report/ValidationReports";
import InstallmentReports from "./pages/Admin/Report/InstallmentReports";
import StaffManagement from "./pages/Admin/Staff/StaffManagement";
import BrandManagement from "./pages/Officer/ManagementData/BrandManagement";
import RegionalManagement from "./pages/Officer/ManagementData/RegionalManagement";
import CarsManagement from "./pages/Officer/ManagementData/CarsManagement";
import TenorManagement from "./pages/Officer/ManagementData/TenorManagement";
import ApplicationOfficerReports from "./pages/Officer/Reports/ApplicationOfficerReports";
import ValidationOfficerReports from "./pages/Officer/Reports/ValidationOfficerReports";
import CarsReports from "./pages/Officer/Reports/CarsReports";
import PaymentReports from "./pages/Officer/Reports/PaymentReports";
import SocietyReports from "./pages/Officer/Reports/SocietyReports";
import ApplicationManagement from "./pages/Validator/Application/ApplicationManagement";
import ValidationManagement from "./pages/Validator/Validation/ValidationManagement";
import InstallmentValidatorReport from "./pages/Validator/Reports/InstallmentValidatorReport";
import ValidationValidatorReport from "./pages/Validator/Reports/ValidationValidatorReport";

export default function App() {
  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/create/validation" element={<CreateValidation />} />

        {/* Society Routes (Masyarakat) */}
        <Route element={<ProtectedRoute allowedRoles={['society']} />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/list/instalment" element={<List />} />
          <Route path="/list/instalment/:id" element={<DetailList />} />
        </Route>

        {/* Admin Routes */}
        <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          <Route path="/admin/reports/validations" element={<ValidationReports />} />
          <Route path="/admin/reports/installments" element={<InstallmentReports />} />
          <Route path="/admin/staff" element={<StaffManagement />} />
        </Route>

        {/* Officer Routes */}
        <Route element={<ProtectedRoute allowedRoles={['officer']} />}>
          <Route path="/officer/dashboard" element={<OfficerDashboard />} />
          <Route path="/officer/brand" element={<BrandManagement />} />
          <Route path="/officer/regional" element={<RegionalManagement />} />
          <Route path="/officer/cars" element={<CarsManagement />} />
          <Route path="/officer/tenor" element={<TenorManagement />} />
          <Route path="/officer/application/report" element={<ApplicationOfficerReports />} />
          <Route path="/officer/validation/report" element={<ValidationOfficerReports />} />
          <Route path="/officer/cars/report" element={<CarsReports />} />
          <Route path="/officer/payments/report" element={<PaymentReports/>} />
          <Route path="/officer/society/report" element={<SocietyReports />} />
        </Route>

        {/* Validator Routes */}
        <Route element={<ProtectedRoute allowedRoles={['validator']} />}>
          <Route path="/validator/dashboard" element={<ValidatorDashboard />} />
          <Route path="/validator/applications" element={<ApplicationManagement />} />
          <Route path="/validator/validations" element={<ValidationManagement />} />
          <Route path="/validator/installment/report" element={<InstallmentValidatorReport />} />
          <Route path="/validator/validation/report" element={<ValidationValidatorReport />} />
        </Route>
      </Routes>
    </Router>
  );
}
