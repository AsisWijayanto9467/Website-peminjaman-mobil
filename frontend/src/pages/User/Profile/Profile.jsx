import React, { useEffect, useState } from "react";
import api from "../../../services/api";
import { Link, useNavigate } from "react-router-dom";

export default function Profile() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const userName = localStorage.getItem("name") || "Society User";

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const res = await api.get("/auth/profile");
      setProfile(res.data.user);
    } catch (err) {
      console.log(err);
      setError("Failed to load profile data");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      const res = await api.post("/auth/logout");
      alert(res.data.message);
      localStorage.clear();
      navigate("/");
    } catch (err) {
      console.log(err);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    return date.toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  const getGenderBadge = (gender) => {
    if (gender === "male") return "badge badge-primary";
    if (gender === "female") return "badge badge-info";
    return "badge badge-secondary";
  };

  const getGenderLabel = (gender) => {
    if (gender === "male") return "Laki-laki";
    if (gender === "female") return "Perempuan";
    return gender || "-";
  };

  const getRoleBadge = (role) => {
    const badges = {
      society: "badge badge-info",
      officer: "badge badge-primary",
      validator: "badge badge-warning",
      admin: "badge badge-danger",
    };
    return badges[role] || "badge badge-secondary";
  };

  return (
    <>
      <nav className="navbar navbar-expand-md navbar-dark fixed-top bg-primary">
        <div className="container">
          <span className="navbar-brand">
            <i className="fas fa-car mr-2"></i>
            Installment Cars
          </span>

          <div className="ml-auto d-flex align-items-center">
            <span className="navbar-text text-white mr-3">
              <i className="fas fa-user-circle mr-1"></i>
              {userName}
            </span>

            {/* Payment Buttons */}
            <Link
              to="/payment/management"
              className="btn btn-success btn-sm mr-2"
            >
              <i className="fas fa-credit-card mr-1"></i> Pay
            </Link>
            <Link to="/payment/history" className="btn btn-info btn-sm mr-2">
              <i className="fas fa-history mr-1"></i> History
            </Link>

            {/* Profile Button */}
            <Link to="/profile" className="btn btn-light btn-sm mr-2">
              <i className="fas fa-id-card mr-1"></i> Profile
            </Link>

            {/* Logout Button */}
            <button
              onClick={handleLogout}
              className="btn btn-outline-light btn-sm"
            >
              <i className="fas fa-sign-out-alt mr-1"></i> Logout
            </button>
          </div>
        </div>
      </nav>

      <main style={{ marginTop: 80 }}>
        <header className="jumbotron">
          <div className="container">
            <h1 className="display-4">
              <i className="fas fa-user-circle mr-2"></i>
              My Profile
            </h1>
            <p className="lead">View your account information</p>
          </div>
        </header>

        <div className="container">
          {loading && (
            <div className="text-center py-5">
              <div className="spinner-border text-primary" role="status">
                <span className="sr-only">Loading...</span>
              </div>
              <p className="mt-3 text-muted">Loading profile...</p>
            </div>
          )}

          {error && (
            <div className="alert alert-danger">
              <i className="fas fa-exclamation-triangle mr-2"></i>
              {error}
            </div>
          )}

          {!loading && profile && (
            <div className="row">
              {/* LEFT COLUMN - Avatar & Regional */}
              <div className="col-md-4 mb-4">
                <div className="card card-default text-center">
                  <div className="card-body">
                    <div className="mb-3">
                      <div
                        className="mx-auto bg-primary text-white d-flex align-items-center justify-content-center"
                        style={{
                          width: 100,
                          height: 100,
                          borderRadius: "50%",
                          fontSize: "2.5rem",
                          fontWeight: "bold",
                        }}
                      >
                        {profile.name
                          ? profile.name.charAt(0).toUpperCase()
                          : "U"}
                      </div>
                    </div>
                    <h5 className="card-title mb-1">{profile.name}</h5>
                    <span className={getRoleBadge(profile.role)}>
                      <i className="fas fa-user-tag mr-1"></i>
                      {profile.role.toUpperCase()}
                    </span>
                    <div className="mt-3">
                      <button
                        className="btn btn-outline-primary btn-sm btn-block"
                        onClick={() => navigate("/dashboard")}
                      >
                        <i className="fas fa-arrow-left mr-1"></i>
                        Back to Dashboard
                      </button>
                    </div>
                  </div>
                </div>

                {/* Regional Info */}
                {profile.regional && (
                  <div className="card card-default mt-3">
                    <div className="card-header border-0">
                      <h5 className="mb-0">
                        <i className="fas fa-map-marker-alt mr-2"></i>
                        Regional Info
                      </h5>
                    </div>
                    <div className="card-body p-0">
                      <table className="table table-striped mb-0">
                        <tbody>
                          <tr>
                            <th>
                              <i className="fas fa-map mr-1"></i> Province
                            </th>
                            <td className="text-muted">
                              {profile.regional.province || "-"}
                            </td>
                          </tr>
                          <tr>
                            <th>
                              <i className="fas fa-city mr-1"></i> District
                            </th>
                            <td className="text-muted">
                              {profile.regional.district || "-"}
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>

              {/* RIGHT COLUMN - Detail Info */}
              <div className="col-md-8">
                {/* Personal Information */}
                <div className="card card-default mb-4">
                  <div className="card-header border-0">
                    <h5 className="mb-0">
                      <i className="fas fa-user mr-2"></i>
                      Personal Information
                    </h5>
                  </div>
                  <div className="card-body p-0">
                    <table className="table table-striped mb-0">
                      <tbody>
                        <tr>
                          <th style={{ width: "30%" }}>
                            <i className="fas fa-user mr-1"></i> Full Name
                          </th>
                          <td className="text-muted">{profile.name || "-"}</td>
                        </tr>
                        <tr>
                          <th>
                            <i className="fas fa-id-card mr-1"></i> ID Card
                            Number
                          </th>
                          <td className="text-muted">
                            {profile.id_card_number || "-"}
                          </td>
                        </tr>
                        {profile.born_date && (
                          <tr>
                            <th>
                              <i className="fas fa-calendar-alt mr-1"></i> Born
                              Date
                            </th>
                            <td className="text-muted">
                              {formatDate(profile.born_date)}
                            </td>
                          </tr>
                        )}
                        {profile.gender && (
                          <tr>
                            <th>
                              <i className="fas fa-venus-mars mr-1"></i> Gender
                            </th>
                            <td>
                              <span className={getGenderBadge(profile.gender)}>
                                <i
                                  className={`fas fa-${profile.gender === "male" ? "mars" : "venus"} mr-1`}
                                ></i>
                                {getGenderLabel(profile.gender)}
                              </span>
                            </td>
                          </tr>
                        )}
                        {profile.address && (
                          <tr>
                            <th>
                              <i className="fas fa-home mr-1"></i> Address
                            </th>
                            <td className="text-muted">{profile.address}</td>
                          </tr>
                        )}
                        <tr>
                          <th>
                            <i className="fas fa-fingerprint mr-1"></i> User ID
                          </th>
                          <td className="text-muted">
                            <code>{profile.id}</code>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Account Information */}
                <div className="card card-default">
                  <div className="card-header border-0">
                    <h5 className="mb-0">
                      <i className="fas fa-shield-alt mr-2"></i>
                      Account Information
                    </h5>
                  </div>
                  <div className="card-body p-0">
                    <table className="table table-striped mb-0">
                      <tbody>
                        <tr>
                          <th style={{ width: "30%" }}>
                            <i className="fas fa-user-shield mr-1"></i> Role
                          </th>
                          <td>
                            <span className={getRoleBadge(profile.role)}>
                              <i className="fas fa-user-tag mr-1"></i>
                              {profile.role.toUpperCase()}
                            </span>
                          </td>
                        </tr>
                        {profile.validator_name && (
                          <tr>
                            <th>
                              <i className="fas fa-user-check mr-1"></i>{" "}
                              Validator
                            </th>
                            <td className="text-muted">
                              {profile.validator_name}
                            </td>
                          </tr>
                        )}
                        <tr>
                          <th>
                            <i className="fas fa-check-circle mr-1"></i> Account
                            Status
                          </th>
                          <td>
                            <span className="badge badge-success">
                              <i className="fas fa-check mr-1"></i> Active
                            </span>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      <footer>
        <div className="container">
          <div className="text-center py-4 text-muted">
            Copyright &copy; 2026
          </div>
        </div>
      </footer>
    </>
  );
}
