import { useEffect, useState } from "react";
import axios from "axios";

const userId = Number(localStorage.getItem("user_id"));

type Product = {
  id: number;
  name: string;
  category?: string;
  expiry_date?: string;
  is_shareable: boolean;
};

export default function Home() {
  const [products, setProducts] = useState<Product[]>([]);

  // Load products once
  useEffect(() => {
    axios
      .get("http://localhost:5000/api/products")
      .then((r) => setProducts(r.data))
      .catch((err) => console.error("Error loading products:", err));
  }, []);

  // Claim product
  async function claimProduct(productId: number) {
    try {
      const message = prompt(
        "Add a message to the owner:",
        "I'd like to claim this item."
      );

      const res = await axios.post(
        `http://localhost:5000/api/products/${productId}/claim`,
        {
          claimer_id: userId,
          message,
        }
      );

      alert("Claim sent successfully!");
    } catch (err) {
      console.error(err);
      alert("Failed to claim item.");
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-bold">My Fridge</h1>

      <div className="grid grid-cols-3 gap-4 mt-4">
        {products.map((p) => (
          <div key={p.id} className="border p-3 rounded shadow-sm">
            <div className="font-bold">{p.name}</div>
            <div className="text-sm text-gray-600">{p.category}</div>
            <div className="text-xs text-gray-500">{p.expiry_date}</div>

            <div className="mt-2">
              <span
                className={`${
                  p.is_shareable ? "text-green-600" : "text-gray-400"
                }`}
              >
                {p.is_shareable ? "Shareable" : "Private"}
              </span>
            </div>

            {p.is_shareable && (
              <button
                onClick={() => claimProduct(p.id)}
                className="mt-3 bg-blue-600 text-white px-3 py-1 rounded text-sm"
              >
                Claim
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
