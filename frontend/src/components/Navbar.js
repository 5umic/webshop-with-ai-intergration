import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import AdminModal from "./AdminModal";
import AdminPanel from "./AdminPanel";
import axios from "axios";

import { MapPinIcon, ShoppingCartIcon, HomeIcon, MagnifyingGlassIcon } from "@heroicons/react/24/outline";

export default function Navbar() {
  const [showModal, setShowModal] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showPanel, setShowPanel] = useState(false);
  const [search, setSearch] = useState("");
  const [products, setProducts] = useState([]);
  const [filtered, setFiltered] = useState([]);

  const handleAuthenticate = () => {
    setIsAdmin(true);
    setShowModal(false);
    setShowPanel(true);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    console.log("Sökning på:", search);
  };
  const handleLocationClick = () => {
    if (!navigator.geolocation) {
      alert("Din webbläsare stödjer inte platstjänster.");
      return;
    }
  
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        alert(`📍 Din position:\nLatitud: ${latitude}\nLongitud: ${longitude}`);
      },
      (error) => {
        alert("Kunde inte hämta plats. Kontrollera att platstjänster är aktiverade.");
        console.error(error);
      }
    );
  };
  

  useEffect(() => {
    axios.get("http://localhost:5000/products")
      .then((res) => setProducts(res.data))
      .catch((err) => console.error("Kunde inte hämta produkter", err));
  }, []);

  useEffect(() => {
    const results = products.filter((p) =>
      p.name.toLowerCase().includes(search.toLowerCase())
    );
    setFiltered(results.slice(0, 5));
  }, [search, products]);
  
  return (
    <>
      <nav className="bg-white text-white px-6 py-4 flex items-center justify-between">
        {/* Vänster */}
        <div className="flex items-center space-x-6 ">
        <Link
            to="/"
            className="flex items-center gap-1 text-lg font-semibold"
            style={{ color: "#021753" }}
          >
            <HomeIcon className="w-5 h-5" />
            Home
          </Link>
          <Link
            to="/cart"
            className="flex items-center gap-1 text-lg font-semibold"
            style={{ color: "#021753" }}
          >
            <ShoppingCartIcon className="w-5 h-5" />
            Cart
          </Link>
        </div>

        {/* Mitten */}
        <form onSubmit={handleSearch} className="relative flex items-center space-x-3 flex-1 justify-center max-w-md">
          <div className="flex items-center gap-2 bg-[#f4f5f4] px-3 py-2 rounded-full w-full">
            <MagnifyingGlassIcon className="w-5 h-5 text-gray-500" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Sök produkter..."
              className="bg-transparent outline-none w-full text-black"
            />
  </div>

  {/* 🔽 Dropdown visas om sökning matchar */}
  {search.length > 0 && filtered.length > 0 && (
    <div className="absolute top-14 left-0 bg-white w-full rounded-lg shadow z-50">
      {filtered.map((product) => (
        <Link
          to={`/product/${product.id}`}
          key={product.id}
          className="flex items-center p-3 border-b hover:bg-gray-100"
          onClick={() => setSearch("")}
        >
          <img
            src={product.imageUrl}
            alt={product.name}
            className="w-12 h-12 object-cover rounded mr-3"
          />
          <div>
            <p className="font-semibold text-sm text-gray-800">{product.name}</p>
            <p className="text-sm text-gray-500">SEK {product.price}</p>
          </div>
        </Link>
      ))}
    </div>
  )}

          <button
            type="button"
            onClick={handleLocationClick}
            className="flex items-center gap-1 text-lg font-semibold px-4 py-2 rounded whitespace-nowrap"
            style={{ color: "#021753" }}
          >
            <MapPinIcon className="w-5 h-5" />
            Hitta butik
          </button>
      </form>



        {/* Höger */}
        <div className="flex items-center space-x-4">
          {!isAdmin && (
            <button
              onClick={() => setShowModal(true)}
              className="px-4 py-2 rounded text-lg font-semibold"
              style={{ color: "#021753" }}
            >
              Admin Panel
            </button>
          )}
        </div>
      </nav>

      {/* Modal + Panel */}
      {showModal && (
        <AdminModal onClose={() => setShowModal(false)} onAuthenticate={handleAuthenticate} />
      )}
      {isAdmin && showPanel && <AdminPanel close={() => setShowPanel(false)} />}
    </>
  );
}
