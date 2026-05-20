import React from 'react';
import {BrowserRouter as Router, Routes, Route} from "react-router-dom";
import ProtectedRoute from './services/ProtectedRoute';
import Login from './pages/Auth/Login';
import Dashboard from './pages/Home/Dashboard';
import "bootstrap/dist/css/bootstrap.css";

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />}/>


        <Route element={<ProtectedRoute />}>
          <Route path="/dashboard" element={<Dashboard />}/>
        </Route>
      </Routes>
    </Router>
  )
}
