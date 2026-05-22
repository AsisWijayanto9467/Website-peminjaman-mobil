import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../../services/api";

export default function Register() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [regionals, setRegionals] = useState([]);
  const [loadingRegionals, setLoadingRegionals] = useState(true);

  // Form state
  const [idCardNumber, setIdCardNumber] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const [name, setName] = useState("");
  const [bornDate, setBornDate] = useState("");
  const [gender, setGender] = useState("");
  const [address, setAddress] = useState("");
  const [regionalId, setRegionalId] = useState("");

  // Fetch regionals data
  useEffect(() => {
    const fetchRegionals = async () => {
      try {
        // Menggunakan POST method sesuai route: /auth/get-regional
        const res = await api.post("/auth/get-regional");
        
        // Cek struktur response dan ambil data
        if (res.data && res.data.data) {
          setRegionals(res.data.data);
        } else if (res.data) {
          setRegionals(res.data);
        } else {
          setRegionals([]);
        }
      } catch (error) {
        console.error("Failed to fetch regionals:", error);
        setError("Gagal memuat data wilayah");
      } finally {
        setLoadingRegionals(false);
      }
    };

    fetchRegionals();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await api.post("/auth/register", {
        id_card_number: idCardNumber,
        password: password,
        password_confirmation: passwordConfirmation,
        name: name,
        born_date: bornDate,
        gender: gender,
        address: address,
        regional_id: regionalId,
      });

      // Ambil data user dari response
      const userData = res.data.user;
      const token = userData.token;

      // Registrasi hanya untuk role society/user
      // Simpan token, role, dan data user ke localStorage
      localStorage.setItem("token", token);
      localStorage.setItem("role", "society");
      localStorage.setItem("user", JSON.stringify(userData));

      // Langsung arahkan ke dashboard society
      navigate("/dashboard");
    } catch (error) {
      const data = error.response?.data;

      if (data?.errors) {
        const messages = [];
        // Handle nested errors object
        for (const key in data.errors) {
          if (Array.isArray(data.errors[key])) {
            messages.push(...data.errors[key]);
          } else if (typeof data.errors[key] === "string") {
            messages.push(data.errors[key]);
          } else {
            messages.push(`${key}: ${JSON.stringify(data.errors[key])}`);
          }
        }
        setError(messages.join(", "));
      } else if (data?.message) {
        setError(data.message);
      } else if (error.message) {
        setError(error.message);
      } else {
        setError("Terjadi kesalahan saat registrasi");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <main>
        <header className="jumbotron">
          <div className="container text-center">
            <h1 className="display-4">Installment Cars</h1>
          </div>
        </header>
        <div className="container">
          <div className="row justify-content-center">
            <div className="col-lg-10 col-md-12">
              <form onSubmit={handleSubmit} className="card card-default">
                <div className="card-header">
                  <h4 className="mb-0">Register</h4>
                </div>
                {error && (
                  <div className="alert alert-danger mx-3 mt-3">{error}</div>
                )}
                <div className="card-body">
                  <div className="row">
                    {/* Kolom Kiri */}
                    <div className="col-md-6">
                      <div className="form-group row align-items-center mb-3">
                        <div className="col-4 text-right">
                          <label className="mb-0">ID Card Number</label>
                        </div>
                        <div className="col-8">
                          <input
                            type="text"
                            value={idCardNumber}
                            onChange={(e) => setIdCardNumber(e.target.value)}
                            className="form-control"
                            placeholder="16 digit ID Card"
                            maxLength="16"
                            required
                          />
                        </div>
                      </div>

                      <div className="form-group row align-items-center mb-3">
                        <div className="col-4 text-right">
                          <label className="mb-0">Nama Lengkap</label>
                        </div>
                        <div className="col-8">
                          <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="form-control"
                            placeholder="Nama lengkap"
                            required
                          />
                        </div>
                      </div>

                      <div className="form-group row align-items-center mb-3">
                        <div className="col-4 text-right">
                          <label className="mb-0">Tanggal Lahir</label>
                        </div>
                        <div className="col-8">
                          <input
                            type="date"
                            value={bornDate}
                            onChange={(e) => setBornDate(e.target.value)}
                            className="form-control"
                            required
                          />
                        </div>
                      </div>

                      <div className="form-group row align-items-center mb-3">
                        <div className="col-4 text-right">
                          <label className="mb-0">Jenis Kelamin</label>
                        </div>
                        <div className="col-8">
                          <select
                            value={gender}
                            onChange={(e) => setGender(e.target.value)}
                            className="form-control"
                            required
                          >
                            <option value="">Pilih Jenis Kelamin</option>
                            <option value="male">Laki-laki</option>
                            <option value="female">Perempuan</option>
                          </select>
                        </div>
                      </div>
                    </div>

                    {/* Kolom Kanan */}
                    <div className="col-md-6">
                      <div className="form-group row align-items-center mb-3">
                        <div className="col-4 text-right">
                          <label className="mb-0">Alamat</label>
                        </div>
                        <div className="col-8">
                          <textarea
                            value={address}
                            onChange={(e) => setAddress(e.target.value)}
                            className="form-control"
                            placeholder="Alamat lengkap"
                            rows="2"
                            required
                          />
                        </div>
                      </div>

                      <div className="form-group row align-items-center mb-3">
                        <div className="col-4 text-right">
                          <label className="mb-0">Wilayah</label>
                        </div>
                        <div className="col-8">
                          <select
                            value={regionalId}
                            onChange={(e) => setRegionalId(e.target.value)}
                            className="form-control"
                            disabled={loadingRegionals}
                            required
                          >
                            <option value="">
                              {loadingRegionals
                                ? "Memuat data..."
                                : "Pilih Wilayah"}
                            </option>
                            {regionals.map((regional) => (
                              <option key={regional.id} value={regional.id}>
                                {regional.province} - {regional.district}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div className="form-group row align-items-center mb-3">
                        <div className="col-4 text-right">
                          <label className="mb-0">Password</label>
                        </div>
                        <div className="col-8">
                          <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="form-control"
                            placeholder="Minimal 6 karakter"
                            minLength="6"
                            required
                          />
                        </div>
                      </div>

                      <div className="form-group row align-items-center mb-3">
                        <div className="col-4 text-right">
                          <label className="mb-0">Konfirmasi Password</label>
                        </div>
                        <div className="col-8">
                          <input
                            type="password"
                            value={passwordConfirmation}
                            onChange={(e) =>
                              setPasswordConfirmation(e.target.value)
                            }
                            className="form-control"
                            placeholder="Ulangi password"
                            minLength="6"
                            required
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Tombol Register */}
                  <div className="row mt-3">
                    <div className="col-md-6 offset-md-3">
                      <button
                        className="btn btn-primary w-100"
                        type="submit"
                        disabled={loading}
                      >
                        {loading ? "Mendaftarkan..." : "Register"}
                      </button>
                    </div>
                  </div>

                  {/* Link Login */}
                  <div className="text-center mt-3">
                    <span>Sudah punya akun? </span>
                    <Link to="/">Login</Link>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      </main>

      <footer>
        <div className="container">
          <div className="text-center py-3 text-muted">
            Copyright &copy; 2024 - Web Tech ID
          </div>
        </div>
      </footer>
    </>
  );
}