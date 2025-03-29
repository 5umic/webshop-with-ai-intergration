import React, { useEffect, useState } from "react";
import Slider from "react-slick";
import axios from "axios";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";

const ProductCarousel = () => {
  // här sparar vi alla produkter som vi hämtar
  const [products, setProducts] = useState([]);

  // hämtar produkterna när sidan laddas
  useEffect(() => {
    axios.get("http://localhost:5000/products")
      .then((response) => setProducts(response.data))
      .catch((error) => console.error("Error fetching products:", error));
  }, []);

  // inställningar för karusellen, pretty basic stuff
  const settings = {
    dots: true,          // små prickar som visar var man är
    infinite: true,      // den rullar för evigt liksom
    speed: 500,         // hur snabbt den glider
    slidesToShow: 1,    // visar en produkt i taget
    centerMode: true,   // centrerar den aktiva produkten
    centerPadding: "0px", // ingen padding på sidorna
    arrows: false,      // inga pilar, clean look
  };

  return (
    <div className="mb-12 max-w-4xl mx-auto px-4">
      <Slider {...settings}>
        {/* visar bara de tre första produkterna för att hålla det kort och sweet */}
        {products.slice(0,3).map((product) => (
          <div key={product.id}>
            {/* varje produkt får sin egen lilla box */}
            <div className="flex flex-col items-center justify-center h-[450px] bg-gray-100 rounded-xl shadow-md">
              {/* bilden får en egen container för att hålla storleken under kontroll */}
              <div className="w-48 h-48 mb-4 overflow-hidden rounded">
                <img
                  src={product.imageUrl}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
              </div>
              {/* produktinfo med namn och pris */}
              <p className="text-xl font-semibold text-center truncate">{product.name}</p>
              <p className="text-gray-600 text-center">SEK: {product.price}</p>
            </div>
          </div>
        ))}
      </Slider>
    </div>
  );
};

export default ProductCarousel;
