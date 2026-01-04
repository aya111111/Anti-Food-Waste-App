import { useEffect, useState } from "react";
import api from "../api";

type Group = { id: number; name: string; description: string };
type Member = { id: number; name: string; role: string; preferences: string };
type User = { id: number; name: string };

// The Groups page component
export default function Groups() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  

  const [newGroupName, setNewGroupName] = useState("");
  const [selectedFriendId, setSelectedFriendId] = useState("");
  const [foodPreference, setFoodPreference] = useState("");
  const [editingPreferences, setEditingPreferences] = useState<{ [key: number]: string }>({});

  useEffect(() => {
    loadGroups();
    loadUsers();
  }, []);

  // Fetch groups that the current user belongs to
  const loadGroups = () => {
    api.get("/groups/my-groups").then((r) => setGroups(r.data));
  };

  // Fetch all users (for invitation dropdown)
  const loadUsers = () => {
    api.get("/users").then((r) => setAllUsers(r.data)).catch(() => console.log("Users route not found"));
  };

  // View members of a group
  const viewGroup = async (group: Group) => {
    setSelectedGroup(group);
    const res = await api.get(`/groups/${group.id}/members`);
    setMembers(res.data);
    setEditingPreferences({});
  };

  // Create a new group
  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    await api.post("/groups", { name: newGroupName });
    setNewGroupName("");
    loadGroups();
  };

  // Invite a friend to the selected group with preference label
  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGroup || !selectedFriendId) return;

    try {
      await api.post(`/groups/${selectedGroup.id}/invite`, {
        friendId: parseInt(selectedFriendId),
        preferences: foodPreference 
      });

      // Optimistically update UI: add or update the member in local state.
      const newMember: Member = {
        id: parseInt(selectedFriendId),
        name: allUsers.find(u => u.id === parseInt(selectedFriendId))?.name || "",
        role: "member",
        preferences: foodPreference
      };
      
      setMembers(prev => {
        const existing = prev.findIndex(m => m.id === newMember.id);
        if (existing >= 0) {
          const updated = [...prev];
          updated[existing] = newMember;
          return updated;
        }
        return [...prev, newMember];
      });

      alert("Friend invited!");
      setSelectedFriendId("");
      setFoodPreference("");
    } catch (err) {
      alert("Failed to invite friend.");
    }
  };

  // Handle updating food preference input
  const handleUpdatePreference = (memberId: number, value: string) => {
    setEditingPreferences(prev => ({
      ...prev,
      [memberId]: value
    }));
  };


  return (
    <div className="max-w-6xl mx-auto p-6 text-left">
      <header className="mb-10">
        <h1 className="text-4xl font-extrabold text-gray-900">Groups</h1>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Sidebar with group list and create form */}
        <div className="space-y-6">
          <section className="bg-white border border-gray-200 p-5 rounded-2xl shadow-sm">
            <h2 className="text-sm font-black text-gray-400 uppercase mb-4">New Group</h2>
            <form onSubmit={handleCreateGroup} className="flex flex-col gap-3">
              <input
                type="text"
                placeholder="Group Name"
                className="border border-gray-300 p-2.5 rounded-xl outline-none focus:border-blue-500"
                value={newGroupName}
                onChange={(e) => setNewGroupName(e.target.value)}
                required
              />
              <button className="bg-blue-600 text-white py-2.5 rounded-xl font-bold hover:bg-blue-700 transition-colors">
                Create Group
              </button>
            </form>
          </section>

          {/* Existing groups */}
          <div className="space-y-3">
            <h2 className="text-sm font-black text-gray-400 uppercase">My Groups</h2>
            {groups.map((g) => (
              <div 
                key={g.id} 
                onClick={() => viewGroup(g)}
                className={`p-4 rounded-2xl border cursor-pointer transition-all ${selectedGroup?.id === g.id ? "border-blue-500 bg-blue-50 shadow-md" : "bg-white border-gray-100 hover:border-gray-300"}`}
              >
                <h3 className="font-bold text-gray-800">{g.name}</h3>
              </div>
            ))}
          </div>
        </div>

        {/* Right column: selected group details */}
        <div className="lg:col-span-2">
          {selectedGroup ? (
            <div className="bg-white border border-gray-100 p-8 rounded-3xl shadow-sm">
              <div className="flex justify-between items-center mb-8">
                <h2 className="text-3xl font-bold text-gray-900">{selectedGroup.name}</h2>
                <span className="bg-gray-100 text-gray-500 text-xs font-bold px-3 py-1 rounded-full uppercase">
                  {members.length} Members
                </span>
              </div>

              {/* Invite form */}
              <div className="bg-gray-50 p-6 rounded-2xl mb-8">
                <h3 className="text-sm font-black text-gray-400 uppercase mb-4">Invite & Label Friend</h3>
                <form onSubmit={handleInvite} className="flex flex-wrap gap-4 items-end">
                  <div className="flex flex-col flex-1 min-w-[150px]">
                    <label className="text-[10px] font-bold text-gray-400 uppercase mb-1">Select Friend</label>
                    <select 
                      className="border border-gray-300 p-2 rounded-xl bg-white"
                      value={selectedFriendId}
                      onChange={(e) => setSelectedFriendId(e.target.value)}
                      required
                    >
                      <option value="">Choose a user</option>
                      {allUsers.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                    </select>
                  </div>
                  <div className="flex flex-col flex-1 min-w-[150px]">
                    <label className="text-[10px] font-bold text-gray-400 uppercase mb-1">Food Preference</label>
                    <input 
                      type="text"
                      className="border border-gray-300 p-2 rounded-xl"
                      value={foodPreference}
                      onChange={(e) => setFoodPreference(e.target.value)}
                    />
                  </div>
                  <button className="bg-black text-white px-6 py-2 rounded-xl font-bold hover:bg-gray-800">
                    Invite
                  </button>
                </form>
              </div>

              {/* Members list, with inline preference edit if empty */}
              <div className="space-y-4">
                <h3 className="text-sm font-black text-gray-400 uppercase">Current Members</h3>
                <div className="grid gap-3">
                  {members.map((m) => (
                    <div key={m.id} className="flex justify-between items-center p-4 border border-gray-50 bg-white rounded-2xl shadow-sm">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold text-xs">
                          {m.name[0]}
                        </div>
                        <div>
                          <p className="font-bold text-gray-800">{m.name}</p>
                          <p className="text-[10px] text-gray-400 uppercase font-black">{m.role}</p>
                        </div>
                      </div>

                      <div className="text-right">
                        {m.preferences ? (
                          <span className="bg-green-100 text-green-700 text-[10px] font-black px-3 py-1 rounded-full uppercase">
                             {m.preferences}
                          </span>
                        ) : (
                          <input 
                            type="text"
                            placeholder="Add preference"
                            className="border border-gray-300 p-2 rounded-xl text-xs"
                            value={editingPreferences[m.id] || ""}
                            onChange={(e) => handleUpdatePreference(m.id, e.target.value)}
                          />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center border-2 border-dashed border-gray-200 rounded-3xl p-20 text-center">
              <p className="text-gray-400 font-medium">Select a group from the list to manage members and see their food labels.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
