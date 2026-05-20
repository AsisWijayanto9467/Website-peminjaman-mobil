import React, { useState } from 'react'
import api from '../../services/api';
import { useNavigate } from 'react-router-dom';

export default function Login() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [idCardNumber, setIdCardNumber] = useState("");
    const [password, setPassword] = useState("");

    const handleSubmit = async(e) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        try {
            const res = await api.post("/auth/login", {
                id_card_number : idCardNumber,
                password : password
            });

            const token = res.data.token;
            localStorage.setItem("token", token);

            navigate("/dashboard");
        } catch (error) {
            const data = error.response?.data;

            if(data?.errors) {
                const message = Object.values(data.errors).flat();
                setError(message);
            } else if(data?.message) {
                setError(data.message);
            } else if(error.message) {
                setError(error.message)
            } else {
                setError("Terjadi kesalahan");
            }
        } finally {
            setLoading(false);
        }
    }


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
                        <div className="col-md-6">
                            <form onSubmit={handleSubmit} className="card card-default">
                                <div className="card-header">
                                    <h4 className="mb-0">Login</h4>
                                </div>
                                {error && (
                                    <div className="alert alert-danger">{error}</div>
                                )}
                                <div className="card-body">
                                    <div className="form-group row align-items-center">
                                        <div className="col-4 text-right">ID Card Number</div>
                                        <div className="col-8"><input type="text" value={idCardNumber} onChange={(e) => setIdCardNumber(e.target.value)} className="form-control" /></div>
                                    </div>
                                    <div className="form-group row align-items-center">
                                        <div className="col-4 text-right">Password</div>
                                        <div className="col-8"><input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="form-control" /></div>
                                    </div>
                                    <div className="form-group row align-items-center mt-4">
                                        <div className="col-4"></div>
                                        <div className="col-8"><button className="btn btn-primary" type="submit" disabled={loading}>{loading ? "Loggingin...." : "Login"}</button></div>
                                    </div>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </main>

            <footer>
                <div className="container">
                    <div className="text-center py-4 text-muted">
                        Copyright &copy; 2024 - Web Tech ID
                    </div>
                </div>
            </footer>
        </>
    )
}
