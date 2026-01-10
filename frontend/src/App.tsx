import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import { useState, useEffect } from "react";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Groups from "./pages/Groups";
import Notifications from "./pages/Notifications";
import Requests from "./pages/Requests";
import ProductDetail from "./pages/ProductDetail";

export default function App() {
  const [token, setToken] = useState<string | null>(localStorage.getItem("token"));

  useEffect(() => {
    const interval = setInterval(() => {
      setToken(localStorage.getItem("token"));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    setToken(null);
    window.location.href = "/login";
  };

  return (
    <BrowserRouter>
      <div className="p-4 font-sans max-w-4xl mx-auto">
        <nav className="flex gap-6 mb-8 items-center border-b pb-4">
          <div className="flex gap-4">
            <Link to="/" className="text-gray-600 hover:text-black">My fridge</Link>
            {token && <Link to="/groups" className="text-gray-600 hover:text-black">Groups</Link>}
            {token && <Link to="/notifications" className="text-gray-600 hover:text-black">Notifications</Link>}
            {token && <Link to="/requests" className="text-gray-600 hover:text-black">Requests</Link>}
          </div>

          {!token ? (
            <div className="flex gap-4 ml-auto">
              <Link to="/login" className="text-blue-600 font-medium">Login</Link>
              <Link to="/register" className="bg-blue-600 text-white px-4 py-1 rounded">Register</Link>
            </div>
          ) : (
            <button onClick={handleLogout} className="ml-auto text-red-500 font-medium cursor-pointer">
              Logout
            </button>
          )}
        </nav>

        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/notifications" element={<Notifications />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/groups" element={<Groups />} />
          <Route path="/requests" element={<Requests />} />
          <Route path="/products/:id" element={<ProductDetail />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}
