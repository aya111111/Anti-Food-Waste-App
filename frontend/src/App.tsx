import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";

export default function App() {
  return (
    <BrowserRouter>
      <div className="p-4">
        <nav className="flex gap-4 mb-4">
          <Link to="/">Home</Link>
          <Link to="/login">Login</Link>
          <Link to="/register">Register</Link>
        </nav>

        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}
