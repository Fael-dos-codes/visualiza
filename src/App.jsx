import { BrowserRouter, Routes, Route } from "react-router-dom";
import Acesso from "./pages/Acesso";
import PrimeiroNome from "./pages/PrimeiroNome";
import CriarSenha from "./pages/CriarSenha";
import LoginSenha from "./pages/LoginSenha";
import Dashboard from "./pages/Dashboard";
import "./index.css";
import AdminClientes from "./pages/AdminClientes";
import AdminCampanhas from "./pages/AdminCampanhas";
import AdminMetricas from "./pages/AdminMetricas";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Acesso />} />
        <Route path="/primeiro-acesso/nome" element={<PrimeiroNome />} />
        <Route path="/primeiro-acesso/senha" element={<CriarSenha />} />
        <Route path="/login-senha" element={<LoginSenha />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/admin" element={<AdminClientes />} />
        <Route path="/admin/campanhas" element={<AdminCampanhas />} />
        <Route path="/admin/metricas" element={<AdminMetricas />} />
      </Routes>
    </BrowserRouter>
  );
}