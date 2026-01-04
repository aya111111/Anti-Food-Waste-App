import { useState } from "react";
import api from '../api';
import { useNavigate } from "react-router-dom";

export default function Register() {
  const nav = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  async function submit(e: any) {
    e.preventDefault();
    try {
      const res = await api.post("auth/register", {
        name,
        email,
        password,
      });
      localStorage.setItem("token", res.data.token);
      localStorage.setItem("user_id", res.data.user.id);
      nav("/");
    } catch (err) {
      alert("Registration failed");
    }
  }

  return (
    <form onSubmit={submit} className="max-w-md mx-auto p-4 border rounded">
      <h1 className="text-xl font-bold mb-4">Register</h1>

      <input
        type="text"
        placeholder="Name"
        className="w-full mb-2 p-2 border"
        value={name}
        onChange={e => setName(e.target.value)}
      />

      <input
        type="email"
        placeholder="Email"
        className="w-full mb-2 p-2 border"
        value={email}
        onChange={e => setEmail(e.target.value)}
      />

      <input
        type="password"
        placeholder="Password"
        className="w-full mb-4 p-2 border"
        value={password}
        onChange={e => setPassword(e.target.value)}
      />

      <button className="bg-green-600 text-white px-4 py-2 rounded">
        Create Account
      </button>
    </form>
  );
}
