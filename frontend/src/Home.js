import React, { useEffect, useState } from "react";
import ProductCarousel from "./components/ProductCarousel";
import axios from "axios";
import { Link } from "react-router-dom";
import {
  Card,
  CardContent,
  CardMedia,
  Typography,
  Grid,
  Rating,
  CardActionArea,
  Alert,
  Container,
  Box,
} from "@mui/material";

function Home() {
  const [products, setProducts] = useState([]);

  useEffect(() => {
    axios.get("http://localhost:5000/products")
      .then(response => setProducts(response.data))
      .catch(error => console.error("Error fetching products:", error));
  }, []);

  return (
    <Container maxWidth="lg" className="mt-6">
      {/* Hero/Header */}
      <Box className="text-center mb-10">
        <Typography variant="h2" component="h1" gutterBottom>
          Välkommen till vår webshopp!
        </Typography>
        <Typography variant="h6" color="textSecondary">
          Upptäck våra produkter, betygsätt favoriter och handla smidigt!
        </Typography>
      </Box>
<ProductCarousel />

      {/* Produktgrid */}
      <Grid container spacing={4}>
        {products.map((product) => (
          <Grid item xs={12} sm={6} md={4} key={product.id}>
            <Card
              className="hover:shadow-lg transition-shadow duration-300"
              sx={{ height: "100%", display: "flex", flexDirection: "column" }}
            >
              <CardActionArea
                component={Link}
                to={`/product/${product.id}`}
                sx={{ display: "flex", flexDirection: "column", height: "100%" }}
              >
                <CardMedia
                  component="img"
                  image={product.imageUrl}
                  alt={product.name}
                  sx={{ height: 200, width: "100%", objectFit: "cover" }}
                />
                <CardContent sx={{ flexGrow: 1 }}>
                  <Typography variant="h6" gutterBottom>
                    {product.name}
                  </Typography>
                  <Typography color="textSecondary">
                    SEK {product.price}
                  </Typography>
                  <Rating
                    name="read-only"
                    value={product.averageRating || 0}
                    readOnly
                    precision={0.5}
                    className="mt-1"
                  />
                </CardContent>
              </CardActionArea>
            </Card>

          </Grid>
        ))}
      </Grid>
    </Container>
  );
}

export default Home;
