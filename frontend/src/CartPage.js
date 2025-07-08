import { useState, useEffect } from "react";

function CartPage() {
  // states för att hålla koll på varukorgen och meddelanden
  const [cartItems, setCartItems] = useState([]);
  const [message, setMessage] = useState("");


  useEffect(() => {
    fetch("http://localhost:5000/cart/1")
      .then((res) => res.json())
      .then((data) => {
        if (data.message === "Cart is empty") {
          setCartItems([]);
        } else {
          setCartItems(data);
        }
      })
      .catch((error) => console.error("Error fetching cart:", error));
  }, []);


  const handleRemoveFromCart = async (productId) => {
    try {
      const response = await fetch(`http://localhost:5000/cart/1/remove/${productId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setCartItems(cartItems.filter((item) => item.id !== productId));
        setMessage("pryl borttagen från varukorgen");
      } else {
        setMessage("kunde inte ta bort prylen");
      }
    } catch (error) {
      console.error("Error removing from cart:", error);
      setMessage("något gick fel");
    }
  };
  

  const updateQuantity = async (productId, delta) => {
    try {
      const response = await fetch(`http://localhost:5000/cart/1/update/${productId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ delta }),
      });
  
      if (response.ok) {        setCartItems((prev) =>
          prev
            .map((item) =>
              item.id === productId
                ? {
                    ...item,
                    Cart_Row: {
                      ...item.Cart_Row,
                      quantity: item.Cart_Row.quantity + delta,
                    },
                  }
                : item
            )
            .filter((item) => item.Cart_Row.quantity > 0)
        );
      } else {
        setMessage("kunde inte uppdatera antalet");
      }
    } catch (error) {
      console.error("Error updating quantity:", error);
      setMessage("något gick fel");
    }
  };
  

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-4">Your Cart</h1>

      {cartItems.length === 0 ? (
        <p className="text-gray-600">varukorgen är tom</p>
      ) : (
        <>

          <ul className="divide-y divide-gray-200">
            {cartItems.map((item) => (
              <li key={item.id} className="flex items-center justify-between p-4">
                <div>
                  <h2 className="font-bold text-lg">{item.name}</h2>
                  <p className="text-gray-600">Pris: ${item.price}</p>

                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => updateQuantity(item.id, -1)}
                      className="bg-gray-300 px-2 rounded"
                    >−</button>
                    <span>Antal: {item.Cart_Row.quantity}</span>
                    <button
                      onClick={() => updateQuantity(item.id, 1)}
                      className="bg-gray-300 px-2 rounded"
                    >+</button>
                  </div>  
                </div>

                <button
                  className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 transition"
                  onClick={() => handleRemoveFromCart(item.id)}
                  >
                  Ta bort
                </button>
              </li>
            ))}
          </ul>
  

          <div className="text-right mt-4 text-xl font-semibold">
            Totalt: $
            {cartItems.reduce((sum, item) => sum + item.price * item.Cart_Row.quantity, 0).toFixed(2)}
          </div>
        </>
      )}

      <p className="text-green-600 mt-2">{message}</p>
    </div>
  );
}

export default CartPage;
