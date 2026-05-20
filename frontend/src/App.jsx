import React from "react";
import {BrowserRouter as Router, Routes, Route} from "react-router-dom"
import Login from "./pages/Auth/Login";
import ProtectedRoute from "./services/ProtectedRoute";
import Dashboard from "./pages/Home/Dashboard";
import CreateValidation from "./pages/Validation/CreateValidation";
import List from "./pages/Installment/List";
import DetailList from "./pages/Installment/DetailList";

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/create/validation" element={<CreateValidation />} />

        <Route element={<ProtectedRoute />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/list/instalment" element={<List />} />
          <Route path="/list/instalment/:id" element={<DetailList />} />
        </Route>
      </Routes>
    </Router>
  );
}
