import { useState } from "react";

function AdminModal({ onClose, onAuthenticate }) {  // ✅ Updated prop names
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");  // ✅ Reset the error state
  
    try {
      const response = await fetch("http://localhost:5000/admin/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
  
      const data = await response.json();
  
      if (response.ok && data.success) {
        //Debugging
        console.log("✅ Authentication successful");
        setError(""); 
        onAuthenticate();
        onClose();
      }
       else {
        setError(data.error || "Authentication failed");
      }
    } catch (err) {
      setError("Server error. Try again.");
    }
  };
  

  return (
    <div className="fixed inset-0 bg-gray-900 bg-opacity-50 backdrop-blur-sm flex justify-center items-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-lg w-80">
        <h2 className="text-xl font-bold mb-4 text-center">Lösenord</h2>
        {error && <p className="text-red-500 text-sm mb-2">{error}</p>}
        <form onSubmit={handleSubmit}>
          <input
            type="password"
            className="border p-2 rounded w-full mb-4"
            placeholder="Lösenord"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <div className="flex justify-between">
            <button type="button" className="bg-gray-500 text-white px-4 py-2 rounded" onClick={onClose}>
              Avbryt
            </button>
            <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded">
              Logga in
            </button>
          </div>
        </form>
      </div>
    </div>
  );  
}

export default AdminModal;
