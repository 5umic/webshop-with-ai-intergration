import { useState, useEffect } from "react";

function AdminPanel({ close }) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [productId, setProductId] = useState("");
  const [products, setProducts] = useState([]);
  const [action, setAction] = useState("create");
  const [message, setMessage] = useState("");

  // Hämtar produkter om vi ska uppdatera eller ta bort något
  useEffect(() => {
    if (action === "delete" || action === "update") {
      fetch("http://localhost:5000/products")
        .then((res) => res.json())
        .then((data) => setProducts(data))
        .catch(() => setMessage("Error fetching products")); // Om något går fel
    }
  }, [action]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");

    const password = process.env.REACT_APP_ADMIN_PASSWORD;
    let url = "";
    let method = "";
    let body = {};

    if (action === "create") {
      // Skapa ny produkt
      url = "http://localhost:5000/admin/products/create";
      method = "POST";
      body = { password, name, description, price, imageUrl };
    } else if (action === "update") {
      // Uppdatera en produkt
      url = `http://localhost:5000/admin/products/${productId}`;
      method = "PUT";
      body = { password };

      // Kolla om fälten inte är tomma innan vi skickar dem
      if (name.trim() !== "") body.name = name;
      if (description.trim() !== "") body.description = description;
      if (price !== "") body.price = parseFloat(price);
      if (imageUrl.trim() !== "") body.imageUrl = imageUrl;

    } else if (action === "delete") {
      // Ta bort en produkt
      url = `http://localhost:5000/admin/products/delete/${productId}`;
      method = "POST"; 
      body = { password };
    }

    try {
      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage(`✅ ${data.message || "Success!"}`);
        if (action === "delete") {
          // Uppdatera listan om vi tog bort något
          setProducts(products.filter((p) => p.id !== productId));
          setProductId("");
        }
      } else {
        setMessage(`❌ ${data.error || "Something went wrong"}`);
      }
    } catch (error) {
      setMessage("❌ Server error. Try again."); // Om servern inte svarar
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-lg">
        <h2 className="text-2xl font-bold mb-4">Admin Panel</h2>

        {/* Välj vad vi ska göra */}
        <label className="block mb-3">
          Action:
          <select
            className="w-full border p-2 rounded mt-1"
            value={action}
            onChange={(e) => setAction(e.target.value)}
          >
            <option value="create">Add Product</option>
            <option value="update">Update Product</option>
            <option value="delete">Delete Product</option>
          </select>
        </label>

        {/* Om vi ska uppdatera eller ta bort, visa en dropdown med produkter */}
        {(action === "delete" || action === "update") && (
          <label className="block mb-3">
            Select Product:
            <select
              className="w-full border p-2 rounded mt-1"
              value={productId}
              onChange={(e) => setProductId(e.target.value)}
            >
              <option value="">Select a product</option>
              {products.map((product) => (
                <option key={product.id} value={product.id}>
                  {product.name} (ID: {product.id})
                </option>
              ))}
            </select>
          </label>
        )}

        {/* Om vi inte tar bort, visa fält för att fylla i produktinfo */}
        {action !== "delete" && (
          <>
            <label className="block mb-3">
              Name:
              <input
                className="w-full border p-2 rounded mt-1"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Produkt namn"
              />
            </label>
            <label className="block mb-3">
              Description:
              <input
                className="w-full border p-2 rounded mt-1"
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Description"
              />
            </label>
            <label className="block mb-3">
              Price:
              <input
                className="w-full border p-2 rounded mt-1"
                type="number"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="Pris"
              />
            </label>
            <label className="block mb-3">
              Image URL:
              <input
                className="w-full border p-2 rounded mt-1"
                type="text"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="URL"
              />
            </label>
          </>
        )}

        {/* Skicka-knappen */}
        <button
          onClick={handleSubmit}
          className="bg-blue-600 text-white w-full py-2 rounded mt-4"
        >
          Submit
        </button>

        {/* Visa meddelanden */}
        {message && <p className="mt-2 text-center text-sm">{message}</p>}

        {/* Stäng-knappen */}
        <button
          onClick={close}
          className="bg-gray-500 text-white w-full py-2 rounded mt-4"
        >
          Close
        </button>
      </div>
    </div>
  );
}

export default AdminPanel;