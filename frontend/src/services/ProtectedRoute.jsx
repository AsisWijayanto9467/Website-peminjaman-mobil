import React from 'react'
import { Navigate, Outlet } from 'react-router-dom';

export default function ProtectedRoute({ allowedRoles = [] }) {
    const token = localStorage.getItem("token");
    const userRole = localStorage.getItem("role");

    if (!token) {
        return <Navigate to="/" replace />;
    }

    if (allowedRoles.length > 0 && !allowedRoles.includes(userRole)) {
        switch (userRole) {
            case 'admin':
                return <Navigate to="/admin/dashboard" replace />;
            case 'officer':
                return <Navigate to="/officer/dashboard" replace />;
            case 'validator':
                return <Navigate to="/validator/dashboard" replace />;
            case 'society':
                return <Navigate to="/dashboard" replace />;
            default:
                return <Navigate to="/" replace />;
        }
    }

    return <Outlet />;
}