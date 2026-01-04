import { useEffect, useState } from "react";
import api from "../api";

export default function PendingClaims() {
  const [incomingClaims, setIncomingClaims] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  const loadIncomingClaims = async () => {
    setError(null);
    try {
      const res = await api.get("/claims/incoming");
      setIncomingClaims(res.data);
    } catch (err: any) {
      if (err.response?.status === 401) {
        window.location.href = "/login";
        return;
      }
      setError("Failed to load incoming claims.");
      setIncomingClaims([]);
    }
  };

  useEffect(() => {
    loadIncomingClaims();
  }, []);

  // Accept or reject claim: backend enforces ownership
  const handleAction = async (claimId: number, status: "accepted" | "rejected") => {
    try {
      await api.put(`/claims/${claimId}`, { status });
      alert(`Claim ${status}!`);
      loadIncomingClaims();
    } catch (err: any) {
      alert("Error updating claim");
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h2 className="text-3xl font-extrabold mb-8 text-gray-900">Pending Product Requests</h2>

      {error && <div className="text-red-500 mb-4">{error}</div>}

      {incomingClaims.length === 0 ? (
        <div className="bg-gray-50 border-2 border-dashed border-gray-200 rounded-3xl p-16 text-center text-gray-400">
          No pending requests at the moment.
        </div>
      ) : (
        <div className="space-y-4">
          {incomingClaims.map((claim: any) => (
            <div key={claim.id} className="p-6 border border-gray-100 rounded-2xl bg-white shadow-sm flex justify-between items-center transition-all hover:shadow-md">
              <div>
                <p className="text-xs font-black text-blue-500 uppercase mb-1">Product Request</p>
                <p className="font-bold text-xl text-gray-800">{claim.product_name}</p>
                <div className="mt-2 space-y-1">
                  <p className="text-sm text-gray-500">From: <span className="font-semibold text-gray-700">{claim.claimer_name}</span></p>
                  <p className="text-sm text-gray-600">"{claim.message}"</p>
                </div>
              </div>
              <div className="flex gap-3">
                <button 
                  onClick={() => handleAction(claim.id, "accepted")}
                  className="bg-green-500 text-white px-6 py-2 rounded-xl font-bold hover:bg-green-600 transition-colors"
                >
                  Accept
                </button>
                <button 
                  onClick={() => handleAction(claim.id, "rejected")}
                  className="bg-gray-100 text-gray-600 px-6 py-2 rounded-xl font-bold hover:bg-red-50 hover:text-red-600 transition-colors"
                >
                  Reject
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
