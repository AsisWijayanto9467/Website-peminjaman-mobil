import React from 'react';
import {Navigate, Outlet} from "react-router-dom";

export default function ProtectedRoute({allowedRole}) {
  const token = localStorage.getItem("token");
  const role = localStorage.getItem("role");

  if(!token) {
    return <Navigate to="/" replace/>
  }

  if(allowedRole && !allowedRole.includes(role)) {
    return <Navigate to="/dashboard" replace />
  }

  return <Outlet />
}
