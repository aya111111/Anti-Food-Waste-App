import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../api";
import ShareButtons from "../components/ShareButtons";

type Product = {
  id: number;
  name: string;
  category?: string;
  expiry_date?: string;
  is_shareable: boolean;
  owner_id: number;
  status?: string;
};

export default function ProductDetail() {
  const { id } = useParams<{ id: string }>();
  const nav = useNavigate();
  const [product, setProduct] = useState<Product | null>(null);
  const [userId, setUserId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [claimedStatus, setClaimedStatus] = useState(false);

  // Load profile and product data
  useEffect(() => {
    loadData();
  }, [id]);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      // Profile (fallback to localStorage if API fails)
      const profileRes = await api.get("/users/profile").catch(() => {
        const fallback = Number(localStorage.getItem("user_id"));
        return { data: { id: fallback } };
      });
      setUserId(profileRes.data.id);

      // Fetch product list and find product by id.
      const productsRes = await api.get("/products");
      const p = productsRes.data.find((prod: Product) => prod.id === Number(id));
      if (!p) {
        setError("Product not found");
        setLoading(false);
        return;
      }
      setProduct(p);
      setClaimedStatus(p.status === "claimed");
    } catch (err) {
      console.error(err);
      setError("Failed to load product");
    } finally {
      setLoading(false);
    }
  };

  // Claim handler for non-owners
  const handleClaim = async () => {
    if (!product) return;
    const message = prompt("Message to the owner:", "I'm interested in this product!");
    if (!message) return;
    try {
      await api.post(`/products/${product.id}/claim`, { message });
      alert("Claim sent! The owner will review it.");
      setClaimedStatus(true);
      await loadData();
    } catch (err: any) {
      console.error(err);
      if (err.response?.status === 401) {
        alert("Please login first.");
        nav("/login");
      } else {
        alert("Failed to send claim.");
      }
    }
  };

  if (loading) return <div className="p-6 text-center">Loading...</div>;
  if (error) return (
    <div className="p-6 text-center text-red-500">
      <p>{error}</p>
      <button onClick={() => nav("/")} className="mt-4 bg-blue-600 text-white px-4 py-2 rounded">
        Back to My Fridge
      </button>
    </div>
  );
  if (!product) return null;

  const isOwner = userId === product.owner_id;

  return (
    <div className="max-w-2xl mx-auto p-6">
      <button onClick={() => nav("/")} className="text-blue-600 font-bold mb-6 hover:underline">
        ← Back to My Fridge
      </button>

      <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-8">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h1 className="text-4xl font-extrabold text-gray-900">{product.name}</h1>
            <p className="text-sm text-gray-500 mt-2">
              <span className="bg-blue-50 text-blue-600 px-3 py-1 rounded-full font-bold uppercase text-xs">
                {product.category || "Other"}
              </span>
            </p>
          </div>
          {claimedStatus && (
            <span className="bg-red-100 text-red-700 px-4 py-2 rounded-lg font-bold uppercase text-sm">
              Reserved
            </span>
          )}
        </div>

        <div className="grid grid-cols-2 gap-6 mb-8 p-6 bg-gray-50 rounded-2xl">
          <div>
            <p className="text-xs text-gray-400 font-bold uppercase mb-1">Expiry Date</p>
            <p className="text-lg font-semibold text-gray-800">
              {product.expiry_date ? product.expiry_date.split("T")[0] : "Not specified"}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-400 font-bold uppercase mb-1">Sharing Status</p>
            <p className={`text-lg font-semibold ${product.is_shareable ? "text-green-600" : "text-gray-600"}`}>
              {product.is_shareable ? "✓ Shareable" : "Private"}
            </p>
          </div>
        </div>

        {/* Share buttons */}
        <div className="border-t border-gray-100 pt-6 space-y-4">
          <div className="mb-6">
            <p className="text-xs text-gray-400 font-bold uppercase mb-3">Share This Product</p>
            <ShareButtons
              title={`${product.name} on Anti-Food-Waste-App`}
              text={`Category: ${product.category}, Expires: ${product.expiry_date ? product.expiry_date.split("T")[0] : "N/A"}`}
              url={window.location.href}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
