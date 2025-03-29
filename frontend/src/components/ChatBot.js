import { useState } from "react";
import axios from "axios";
import { ChatBubbleLeftRightIcon, XMarkIcon } from "@heroicons/react/24/solid";

export default function ChatBot() {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  const handleSend = async () => {
    if (!message.trim()) return;
  
    const userMessage = { role: "user", content: message };
    const newMessages = [...messages, userMessage];
  
    setMessages(newMessages);
    setMessage("");
    setLoading(true);
  
    try {
      const res = await axios.post("http://localhost:5000/api/chat", {
        messages: newMessages,
      });
  
      const raw = res.data.answer;
      //debugging
      console.log("ai:", raw);
  
      if (raw.startsWith("ACTION: add-to-cart")) {
        const idPart = raw.split("id:")[1];
        let productId = parseInt(idPart);
        //debugging
        console.log("prod:Id ", productId);
  
        const productRes = await axios.get("http://localhost:5000/products");
        const products = productRes.data;
  
        let match = products.find((p) => p.id === productId);
  
        if (!match) {
          console.log("⚠️ ID stämmer inte – söker efter namn i AI-svaret...");
          const lowerInput = message.toLowerCase();
          match = products.find((p) => {
            const name = p.name?.toLowerCase().replace(/\s+/g, "");
            return lowerInput.replace(/\s+/g, "").includes(name);
          });
          
          
  
          if (match) {
            productId = match.id;
            console.log(`Använder produkt-ID ${productId} från namnmatchning.`);
          }
        }
  
        if (!match) {
          return setMessages((prev) => [
            ...prev,
            { role: "assistant", content: `❌ Ingen matchande produkt hittades.` },
          ]);
        }
  
        await addToCart(productId);
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: `✅ '${match.name}' har lagts till i din kundvagn.` },
        ]);
      } 
      else if (raw.startsWith("ACTION: remove-from-cart")) {
        const idPart = raw.split("id:")[1];
        let productId = parseInt(idPart);
        //debug
        console.log("Produkt att ta bort:", productId);
      
        const productRes = await axios.get("http://localhost:5000/products");
        const products = productRes.data;
      
        let match = products.find((p) => p.id === productId);
      
        if (!match) {
          const lowerInput = message.toLowerCase();
          match = products.find((p) => {
            const name = p.name?.toLowerCase().replace(/\s+/g, "");
            return lowerInput.replace(/\s+/g, "").includes(name);
          });
      
          if (match) {
            productId = match.id;
          }
        }
      
        if (!match) {
          return setMessages((prev) => [
            ...prev,
            { role: "assistant", content: `❌ Produkten kunde inte hittas.` },
          ]);
        }
      
        await removeFromCart(productId);
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: `❌ '${match.name}' har tagits bort från kundvagnen.` },
        ]);
      }
      else {
        setMessages((prev) => [...prev, { role: "assistant", content: raw }]);
      }
    } catch (err) {
      console.error("❌ Fel i handleSend:", err);
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "❌ Något gick fel. Kontrollera att Ollama är igång." },
      ]);
    } finally {
      setLoading(false);
    }
  };
  
  
  const removeFromCart = async (productId) => {
    try {
      await axios.delete(`http://localhost:5000/cart/1/remove/${productId}`);
      alert("❌ Produkten har tagits bort från kundvagnen.");
    } catch (err) {
      console.error("Fel vid borttagning:", err);
      alert("❌ Gick inte att ta bort produkten.");
    }
  };

  const addToCart = async (productId) => {
    try {
      //debugging
      console.log("Skickar produkt-ID som:", productId, typeof productId);
  
      const res = await axios.post("http://localhost:5000/cart/1/add", {
        productId: parseInt(productId), // säkerställ att det är ett nummer
        quantity: 1,
      });
  
      alert("✅ Produkt har lagts till i din kundvagn!");
    } catch (err) {
      console.error("❌ Fel i addToCart:", err.response?.data || err.message);
      alert("❌ Misslyckades lägga till i kundvagnen.");
    }
  };
  
  

  return (
    <div>
    {/* Toggle Button */}
      {open && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40"></div>
    )}
        <button
        onClick={() => setOpen(!open)}
        className="fixed bottom-4 right-4 z-50 bg-blue-600 text-white p-4 rounded-full shadow-lg hover:bg-blue-700 transition"
        >
        {open ? <XMarkIcon className="w-6 h-6" /> : <ChatBubbleLeftRightIcon className="w-6 h-6" />}
      </button>

      {/* Chat Window */}
      {open && (
        <div className="fixed bottom-20 right-4 w-80 h-[576px] bg-white border border-gray-300 rounded-lg shadow-lg flex flex-col z-50">
          <div className="p-4 border-b">
            <h2 className="text-lg font-bold">Fråga butiksassistenten</h2>
          </div>

          {/* Messages */}
          <div className="flex-1 p-3 overflow-y-auto text-sm space-y-2">
            {messages.map((m, i) => (
              <div
                key={i}
                className={`p-2 rounded ${
                  m.role === "user" ? "bg-blue-100 text-right" : "bg-gray-100 text-left"
                }`}
              >
                {m.content}
              </div>
            ))}
          </div>

          {/* Input */}
          <div className="p-3 border-t">
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Skriv din fråga här..."
              rows={2}
              className="w-full border p-2 rounded text-sm mb-2"
            />
            <button
              onClick={handleSend}
              disabled={loading}
              className="w-full bg-blue-600 text-white py-2 rounded text-sm hover:bg-blue-700 transition"
            >
              {loading ? "Tänker..." : "Skicka"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
