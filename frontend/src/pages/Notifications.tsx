import { useEffect, useState } from "react";
import api from "../api";

type Notification = {
  id: number;
  type: "new_claim" | "claim_accepted" | "claim_rejected";
  payload: any;
  created_at: string;
  is_read: boolean;
};

export default function Notifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    try {
      const res = await api.get("/notifications");
      setNotifications(res.data);
    } catch (err) {
      console.error("Failed to load notifications");
    }
  };

  // Mark single notification as read and refresh
  const markAsRead = async (id: number) => {
    await api.put(`/notifications/${id}/read`);
    loadNotifications();
  };

  // Convert stored payload into readable message
  const getMessage = (n: Notification) => {
    const data = typeof n.payload === "string" ? JSON.parse(n.payload) : n.payload;
    switch (n.type) {
      case "new_claim":
        return `A user wants to claim your product (ID: ${data.productId}). Check your products!`;
      case "claim_accepted":
        return `Your claim for product ${data.productId} has been ACCEPTED! 🎉`;
      case "claim_rejected":
        return `Sorry, your claim for product ${data.productId} was rejected.`;
      default:
        return "You have a new update.";
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 text-left">
      <header className="mb-8 flex justify-between items-end">
        <div>
          <h1 className="text-4xl font-extrabold text-gray-900">Notifications</h1>
          <p className="text-gray-500 mt-2 font-medium">Stay updated on your product claims.</p>
        </div>
        <button 
          onClick={loadNotifications}
          className="text-sm font-bold text-blue-600 hover:underline"
        >
          Refresh
        </button>
      </header>

      <div className="space-y-4">
        {notifications.length === 0 ? (
          <div className="bg-gray-50 border-2 border-dashed border-gray-200 rounded-2xl p-12 text-center text-gray-400">
            No notifications yet.
          </div>
        ) : (
          notifications.map((n) => (
            <div 
              key={n.id}
              className={`p-5 rounded-2xl border transition-all flex items-start justify-between ${
                n.is_read ? "bg-white border-gray-100 opacity-60" : "bg-blue-50 border-blue-100 shadow-sm"
              }`}
            >
              <div className="flex gap-4">
                <div className={`mt-1 w-3 h-3 rounded-full ${n.is_read ? "bg-gray-300" : "bg-blue-500"}`} />
                <div>
                  <p className={`text-sm ${n.is_read ? "text-gray-600" : "text-gray-900 font-bold"}`}>
                    {getMessage(n)}
                  </p>
                  <p className="text-[10px] text-gray-400 font-black uppercase mt-2">
                    {new Date(n.created_at).toLocaleString()}
                  </p>
                </div>
              </div>

              {!n.is_read && (
                <button 
                  onClick={() => markAsRead(n.id)}
                  className="text-[10px] font-black uppercase tracking-widest text-blue-600 bg-white px-3 py-1 rounded-lg border border-blue-200 hover:bg-blue-600 hover:text-white transition-all"
                >
                  Mark as Read
                </button>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
