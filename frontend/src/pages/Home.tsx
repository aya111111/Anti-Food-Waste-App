import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api"; 
import ShareButtons from "../components/ShareButtons";

type Product = {
  id: number;
  name: string;
  category?: string;
  expiry_date?: string;
  is_shareable: boolean;
  owner_id: number;
  owner_name?: string;
  status?: string;
};

export default function Home() {
  const nav = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [myClaims, setMyClaims] = useState<number[]>([]);
  const [userId, setUserId] = useState<number | null>(null);

  const [newName, setNewName] = useState("");
  const [newCategory, setNewCategory] = useState("Vegetables");
  const [newExpiry, setNewExpiry] = useState("");

  const [filterCategory, setFilterCategory] = useState("All");
  const [showOnlyMine, setShowOnlyMine] = useState(false);

  // Load authenticated profile
  const loadProfile = () => {
    api.get("/users/profile")
      .then((r) => setUserId(r.data.id))
      .catch(() => {
        const fallback = Number(localStorage.getItem("user_id"));
        if (fallback) setUserId(fallback);
      });
  };

  // Load all products
  const loadProducts = () => {
    api.get("/products")
      .then((r) => setProducts(r.data))
      .catch((err) => console.error("Error loading products:", err));
  };

  // Load product ids that current user already claimed 
  const loadMyClaims = async () => {
    try {
      const res = await api.get("/claims/my-claims");
      const ids = Array.isArray(res.data) && typeof res.data[0] === 'number' 
        ? res.data 
        : res.data.map((c: any) => Number(c.product_id || c));
      setMyClaims(ids);
    } catch (err) {
      setMyClaims([]);
    }
  };

  useEffect(() => {
    loadProfile();
    loadProducts();
    loadMyClaims();
  }, []);

  const filteredProducts = products.filter((p) => {
    const matchesCategory = filterCategory === "All" || p.category === filterCategory;
    const matchesOwner = showOnlyMine && userId ? p.owner_id === userId : true;
    return matchesCategory && matchesOwner;
  });

  // Add new product via API
  async function addProduct(e: React.FormEvent) {
    e.preventDefault();
    if (!userId) return alert("Please login first.");
    try {
      await api.post("/products", {
        name: newName,
        category: newCategory,
        expiry_date: newExpiry,
        is_shareable: false,
      });
      setNewName("");
      setNewExpiry("");
      loadProducts(); 
    } catch (err) {
      alert("Error adding product.");
    }
  }

  // Toggle shareable flag
  async function toggleShare(productId: number, currentStatus: boolean) {
    try {
      await api.put(`/products/${productId}`, { is_shareable: !currentStatus });
      loadProducts();
    } catch (err) {
      alert("Failed to update status.");
    }
  }

  // Delete a product
  async function deleteProduct(productId: number, e: React.MouseEvent) {
  e.preventDefault();
  e.stopPropagation();
  try {
    await api.delete(`/products/${productId}`);
    setProducts(prev => prev.filter(p => p.id !== productId));
  } catch (err) {
    console.error("Delete error:", err);
    alert("Delete failed.");
  }
}

  // Claim a shareable product as an authenticated user
  async function claimProduct(productId: number, e: React.MouseEvent) {
    e.stopPropagation(); 
    const message = prompt("Message for the owner:", "I'm interested!") || "Claim request";
    try {
      await api.post(`/products/${productId}/claim`, { message });
      alert("Claim sent!");
      await loadProducts();
      await loadMyClaims();
    } catch (err) {
      alert("Failed to send claim.");
    }
  }

  // Render product cards; click navigates to ProductDetail
  return (
    <div className="max-w-5xl mx-auto p-6 text-left">
      <header className="mb-10">
        <h1 className="text-4xl font-extrabold text-gray-900">My Fridge</h1>
      </header>

      {/* New product form */}
      <section className="bg-white border border-gray-200 p-6 rounded-2xl shadow-sm mb-8">
        <h2 className="text-lg font-bold mb-4 text-gray-700">Add New Product</h2>
        <form onSubmit={addProduct} className="flex flex-wrap gap-4 items-end">
          <div className="flex flex-col flex-1 min-w-[200px]">
            <label className="text-xs font-bold text-gray-400 uppercase mb-1">Product Name</label>
            <input
              type="text"
              className="border border-gray-300 p-2.5 rounded-xl outline-none focus:border-blue-500"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              required
            />
          </div>
          {/* Category and date inputs */}
          <div className="flex flex-col w-48">
            <label className="text-xs font-bold text-gray-400 uppercase mb-1">Category</label>
            <select 
              className="border border-gray-300 p-2.5 rounded-xl bg-white"
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
            >
              <option>Vegetables</option>
              <option>Fruits</option>
              <option>Dairy</option>
              <option>Meat & Fish</option>
              <option>Other</option>
            </select>
          </div>

          <div className="flex flex-col w-48">
            <label className="text-xs font-bold text-gray-400 uppercase mb-1">Expiry Date</label>
            <input
              type="date"
              className="border border-gray-300 p-2.5 rounded-xl"
              value={newExpiry}
              onChange={(e) => setNewExpiry(e.target.value)}
              required
            />
          </div>

          <button type="submit" className="bg-blue-600 text-white px-8 py-2.5 rounded-xl font-bold hover:bg-blue-700 transition-colors">
            Add
          </button>
        </form>
      </section>

      {/* Filters */}
      <div className="flex flex-wrap gap-6 mb-8 p-4 bg-gray-50 rounded-2xl items-center">
        <div className="flex flex-col">
          <label className="text-[10px] font-black text-gray-400 uppercase mb-1">Filter by Category</label>
          <select 
            className="border border-gray-200 p-2 rounded-lg bg-white text-sm"
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
          >
            <option value="All">All Categories</option>
            <option>Vegetables</option>
            <option>Fruits</option>
            <option>Dairy</option>
            <option>Meat & Fish</option>
            <option>Other</option>
          </select>
        </div>

        <div className="flex items-center gap-2 pt-4">
          <input 
            type="checkbox" 
            id="showMine" 
            className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            checked={showOnlyMine}
            onChange={(e) => setShowOnlyMine(e.target.checked)}
          />
          <label htmlFor="showMine" className="text-sm font-bold text-gray-700 cursor-pointer">
            Show only my products
          </label>
        </div>
      </div>

      {/* Product grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredProducts.map((p) => {
          const isOwner = Number(userId) === Number(p.owner_id);
          const alreadyRequested = myClaims.includes(Number(p.id));

          return (
            <div 
              key={p.id} 
              onClick={() => nav(`/products/${p.id}`)}
              className="border border-gray-100 p-5 rounded-2xl shadow-sm bg-white flex flex-col justify-between cursor-pointer hover:shadow-lg hover:border-blue-300 transition-all"
            >
              <div className="mb-4">
                <div className="flex justify-between items-start">
                  <h3 className="font-bold text-xl">{p.name}</h3>
                  <span className="text-[10px] font-black uppercase text-blue-500 bg-blue-50 px-2 py-0.5 rounded">
                    {p.category}
                  </span>
                </div>
                <p className="text-xs text-gray-400 mt-1 font-semibold">Owner: {p.owner_name || `User #${p.owner_id}`}</p>
              </div>

              <div className="pt-4 border-t border-gray-50 space-y-3">
                {/* Owner controls: toggle share + delete */}
                {isOwner && (
                  <div className="flex gap-2">
                    <button 
                      onClick={(e) => { e.stopPropagation(); toggleShare(p.id, p.is_shareable); }}
                      className={`flex-1 text-[11px] font-bold px-3 py-1 rounded-full transition-colors ${p.is_shareable ? "bg-green-500 text-white" : "bg-gray-200 text-gray-600"}`}
                    >
                      {p.is_shareable ? "● PUBLIC" : "○ PRIVATE"}
                    </button>
                    <button 
                    onClick={(e) => deleteProduct(p.id, e)}
                    className="text-[11px] font-bold px-3 py-1 rounded-full bg-red-100 text-red-600 hover:bg-red-600 hover:text-white transition-colors"
                    >
                      Delete
                      </button>
                      </div>
                )}

                {/* Product status and claim button */}
                {p.status === "claimed" ? (
                  <span className="block bg-red-100 text-red-600 px-3 py-1 rounded-lg text-xs font-black uppercase text-center">Reserved</span>
                ) : (
                  !isOwner && p.is_shareable && (
                    alreadyRequested ? (
                      <button disabled className="block w-full bg-gray-100 text-gray-400 px-4 py-1.5 rounded-lg text-xs font-bold">Requested</button>
                    ) : (
                      <button 
                        onClick={(e) => claimProduct(p.id, e)}
                        className="block w-full bg-black text-white px-4 py-1.5 rounded-lg text-xs font-bold hover:bg-gray-800"
                      >
                        Claim
                      </button>
                    )
                  )
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
