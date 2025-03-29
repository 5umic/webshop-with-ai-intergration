import { useParams } from "react-router-dom";
import { useState, useEffect } from "react";
import { Rating } from "@mui/material";

function ProductPage() {
  // tar emot produkt-id från url:en
  const { id } = useParams();
  // states för att hålla koll på grejerna
  const [product, setProduct] = useState(null);
  const [ratings, setRatings] = useState([]);
  const [rating, setRating] = useState(5);
  const [message, setMessage] = useState("");
  const [cartMessage, setCartMessage] = useState("");
  const [averageRating, setAverageRating] = useState(null);

  // hämtar all info när sidan laddas
  useEffect(() => {
    // fixar produktinfon
    fetch(`http://localhost:5000/products/${id}`)
      .then((res) => res.json())
      .then((data) => setProduct(data))
      .catch((error) => console.error("Error fetching product:", error));

    // hämtar alla ratings
    fetch(`http://localhost:5000/products/${id}/ratings`)
      .then((res) => res.json())
      .then((data) => setRatings(data))
      .catch((error) => console.error("Error fetching ratings:", error));

    // kollar snittbetyget
    fetch(`http://localhost:5000/products/${id}/average-rating`)
      .then((res) => res.json())
      .then((data) => setAverageRating(data.averageRating))
      .catch((error) => console.error("Error fetching average rating:", error));
  }, [id]);

  // när någon ger ett betyg
  const handleSubmitRating = async () => {
    try {
      const response = await fetch(`http://localhost:5000/products/${id}/rate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: 1, score: rating }),
      });
  
      if (response.ok) {
        setMessage("nice, betyget är sparat!");
        setRatings([...ratings, { User: { username: "Anonymous" }, score: rating }]);
  
        // uppdaterar snittbetyget direkt
        const avgRes = await fetch(`http://localhost:5000/products/${id}/average-rating`);
        const avgData = await avgRes.json();
        setAverageRating(avgData.averageRating);
      } else {
        setMessage("oj, något gick fel med betyget.");
      }
    } catch (error) {
      console.error("Error submitting rating:", error);
      setMessage("oops, något strulade.");
    }
  };
  
  // lägger till i varukorgen
  const handleAddToCart = async () => {
    try {
      const response = await fetch(`http://localhost:5000/cart/1/add`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId: product.id, quantity: 1 }),
      });

      if (response.ok) {
        setCartMessage("najs, produkten är i varukorgen!");
      } else {
        setCartMessage("kunde inte lägga till produkten :/");
      }
    } catch (error) {
      console.error("Error adding to cart:", error);
      setCartMessage("något gick snett.");
    }
  };

  // loading-state medan vi väntar
  if (product === null) {
    return <p className="text-center mt-10">laddar...</p>;
  }
  
  // om produkten inte finns
  if (!product.id) {
    return <p className="text-center mt-10 text-red-600 font-semibold">hittar inte produkten :/</p>;
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-4xl font-bold mb-2">{product.name}</h1>
      {averageRating && (
        <p className="text-lg text-yellow-600 font-semibold mb-4">
            Omdömme : {Math.round(averageRating * 2) / 2} / 5
        </p>
      )}
      <img src={product.imageUrl} alt={product.name} className="w-64 h-64 object-cover mb-4 rounded" />
      <p className="text-gray-700 mb-2">{product.description}</p>
      <p className="text-lg font-semibold mb-4">Pris: SEK{product.price}</p>

      <button
        className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition"
        onClick={handleAddToCart}
      >
        Lägg till i varukorgen
      </button>
      <p className="text-green-600 mt-2">{cartMessage}</p>

      <h2 className="text-xl font-bold mt-6">Lämna Omdömme:</h2>
      <div className="flex items-center mt-2">
        <Rating
          name="user-rating"
          value={rating}
          onChange={(e, newValue) => setRating(newValue)}
        />
        <button
          onClick={handleSubmitRating}
          className="ml-4 bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
        >
          Skicka betyg
        </button>
      </div>

      <p className="text-green-600 mt-2">{message}</p>

      <h2 className="text-xl font-bold mt-6">Rating:</h2>
        <ul>
          {Array.isArray(ratings) && ratings.map((rating, index) => (
            <li key={index} className="mt-1">
              <strong>{rating.User?.username || "Anonymous"}:</strong> {rating.score} / 5
            </li>
          ))}
        </ul>

    </div>
  );
}

export default ProductPage;
