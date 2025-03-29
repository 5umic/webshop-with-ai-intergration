// laddar in nödvändiga paket och konfigurerar servern
const sequelize = require("./database");
const express = require("express");
const cors = require("cors");
require("dotenv").config();
const PORT = process.env.PORT || 5000;
const axios = require("axios");
const { Op } = require("sequelize");

const app = express();

app.use(cors());
app.use(express.json());

// importerar modellerna för databasen
const User = require("./models/User");
const Product = require("./models/Product");
const Cart = require("./models/Cart");
const Cart_Row = require("./models/Cart_Row");
const Rating = require("./models/Rating");

// enkel route för att kolla om servern funkar
app.get("/", (req, res) => {
  res.send("Server is running!");
});

// hämtar alla användare, används typ inte just nu
app.get("/users", async (req, res) => {
  try {
    const users = await User.findAll();
    res.json(users);
  } catch (error) {
    console.error("error när användare hämtas:", error);
    res.status(500).json({ error: "något gick fel" });
  }
});

// hämtar alla produkter
app.get("/products", async (req, res) => {
  try {
    const products = await Product.findAll({
      include: [Rating],
      distinct: true,
    });

    // lägger till snittbetyg för varje produkt
    const enriched = products.map((product) => {
      const ratings = product.Ratings || [];
      const averageRating =
        ratings.length > 0
          ? ratings.reduce((sum, r) => sum + r.score, 0) / ratings.length
          : 0;

      return {
        ...product.toJSON(),
        averageRating: averageRating,
      };
    });

    res.json(enriched);
  } catch (error) {
    console.error("error när produkter hämtas:", error);
    res.status(500).json({ error: "något gick fel" });
  }
});

// hämtar en produkt baserat på id
app.get("/products/:id", async (req, res) => {
  try {
    const product = await Product.findByPk(req.params.id);
    if (!product) {
      return res.status(404).json({ error: "produkten hittades inte" });
    }
    res.json(product);
  } catch (error) {
    console.error("error när produkt hämtas:", error);
    res.status(500).json({ error: "något gick fel" });
  }
});

// Get all ratings for a product
app.get("/products/:productId/ratings", async (req, res) => {
  try {
    const product = await Product.findByPk(req.params.productId, {
      include: {
        model: Rating,
        include: { model: User, attributes: ["username", "email"] },
      },
    });

    if (!product) return res.status(404).json({ error: "Product not found" });

    res.json(product.Ratings);
  } catch (error) {
    console.error("Error fetching ratings:", error);
    res.status(500).json({ error: "Something went wrong" });
  }
});

// skaffa average rating
app.get("/products/:productId/average-rating", async (req, res) => {
  try {
    const product = await Product.findByPk(req.params.productId, {
      include: { model: Rating },
    });

    if (!product) return res.status(404).json({ error: "Product not found" });

    const ratings = product.Ratings;
    if (ratings.length === 0) return res.json({ averageRating: "No ratings yet" });

    const averageRating =
      ratings.reduce((sum, rating) => sum + rating.score, 0) / ratings.length;

    res.json({ averageRating: averageRating.toFixed(2) });
  } catch (error) {
    console.error("Error calculating average rating:", error);
    res.status(500).json({ error: "Something went wrong" });  
  }
});

// lägga till product till cart
app.post("/cart/:userId/add", async (req, res) => {
  try {
    const { userId } = req.params;
    const { productId, quantity } = req.body;

    let cart = await Cart.findOne({ where: { UserId: userId } });
    if (!cart) {
      cart = await Cart.create({ UserId: userId });
    }

    const product = await Product.findByPk(productId);
    if (!product) {
      return res.status(400).json({ error: "Product does not exist" });
    }

    const existingRow = await Cart_Row.findOne({
      where: { CartId: cart.id, ProductId: productId },
    });

    if (existingRow) {
      existingRow.quantity += quantity || 1;
      await existingRow.save();
      return res.json({ message: "Quantity updated", cartRow: existingRow });
    } else {
      const newRow = await Cart_Row.create({
        CartId: cart.id,
        ProductId: productId,
        quantity: quantity || 1,
      });
      return res.json({ message: "Item added", cartRow: newRow });
    }
  } catch (error) {
    console.error("Error adding to cart:", error);
    res.status(500).json({ error: error.message });
  }
});
;

// öka quantity for a product in cart
app.put("/cart/:userId/update/:productId", async (req, res) => {
  try {
    const { userId, productId } = req.params;
    const { delta } = req.body;

    const cart = await Cart.findOne({ where: { UserId: userId } });
    if (!cart) return res.status(404).json({ error: "Cart not found" });

    const row = await Cart_Row.findOne({
      where: { CartId: cart.id, ProductId: productId },
    });

    if (!row) return res.status(404).json({ error: "Item not found in cart" });

    row.quantity += delta;

    if (row.quantity <= 0) {
      await row.destroy();
      return res.json({ message: "Item removed" });
    } else {
      await row.save();
      return res.json({ message: "Quantity updated", quantity: row.quantity });
    }
  } catch (error) {
    console.error("Error updating cart quantity:", error);
    res.status(500).json({ error: "Something went wrong" });
  }
});


// skaffa cart contents
app.get("/cart/:userId", async (req, res) => {
  try {
    const cart = await Cart.findOne({
      where: { UserId: req.params.userId },
      include: { model: Product, through: { attributes: ["quantity"] } },
    });

    if (!cart) return res.json({ message: "Cart is empty" });
    res.json(cart.Products);
  } catch (error) {
    console.error("Error fetching cart:", error);
    res.status(500).json({ error: "Something went wrong" });
  }
});

// ta bort product från cart
app.delete("/cart/:userId/remove/:productId", async (req, res) => {
  const { userId, productId } = req.params;

  try {
    const cart = await Cart.findOne({ where: { UserId: userId } });
    if (!cart) return res.status(404).json({ error: "Cart not found" });

    //debugging 4 AI mostly
    console.log("Cart ID:", cart.id);
    console.log(" Product ID som ska tas bort:", productId);

    const row = await Cart_Row.findOne({ where: { CartId: cart.id, ProductId: productId } });
    //debugging 4 AI mostly
    if (!row) {
      console.log("❌ Kunde inte hitta produkten i kundvagnen. Kontrollera CartId och ProductId.");
      return res.status(404).json({ error: "Product not found in cart" });
    }

    await row.destroy();
    res.json({ message: "Product removed from cart" });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});


// lägga rating
app.post("/products/:productId/rate", async (req, res) => {
  try {
    const { productId } = req.params;
    const { userId, score } = req.body;

    const user = await User.findByPk(userId);
    if (!user) return res.status(404).json({ error: "User not found" });

    const product = await Product.findByPk(productId);
    if (!product) return res.status(404).json({ error: "Product not found" });

    const rating = await Rating.create({ score, UserId: userId, ProductId: productId });

    res.status(201).json({ message: "Rating added!", rating });
  } catch (error) {
    console.error("Error adding rating:", error);
    res.status(500).json({ error: "Something went wrong" });
  }
});


// admin autentisering
app.post("/admin/auth", (req, res) => {
  console.log("auth request mottagen:", req.body);

  const { password } = req.body;
  if (password === process.env.ADMIN_PASSWORD) {
    console.log("✅ rätt lösenord");
    res.json({ success: true });
  } else {
    console.log("❌ fel lösenord");
    res.status(401).json({ error: "fel lösenord" });
  }
});

// admin route för att skapa en produkt
app.post("/admin/products/create", async (req, res) => {
  const { password, name, description, price, imageUrl } = req.body;

  if (password !== process.env.ADMIN_PASSWORD) {
    return res.status(403).json({ error: "obehörig" });
  }

  try {
    const newProduct = await Product.create({
      name,
      description,
      price,
      imageUrl,
    });
    res.status(201).json(newProduct);
  } catch (error) {
    console.error("error när produkt skapas:", error);
    res.status(500).json({ error: "något gick fel" });
  }
});

// admin route för att uppdatera en produkt
app.put("/admin/products/:id", async (req, res) => {
  const { password, name, description, price, imageUrl } = req.body;

  if (password !== process.env.ADMIN_PASSWORD) {
    return res.status(403).json({ error: "obehörig" });
  }

  try {
    const product = await Product.findByPk(req.params.id);
    if (!product) {
      return res.status(404).json({ error: "produkten hittades inte" });
    }

    if (name !== undefined) product.name = name;
    if (description !== undefined) product.description = description;
    if (price !== undefined) product.price = price;
    if (imageUrl !== undefined) product.imageUrl = imageUrl;

    await product.save();

    res.json({ message: "produkten uppdaterades", product });
  } catch (error) {
    console.error("error när produkt uppdateras:", error);
    res.status(500).json({ error: "något gick fel" });
  }
});

// admin route för att ta bort en produkt
app.post("/admin/products/delete/:id", async (req, res) => {
  const { password } = req.body;

  console.log("Lösenord från request:", password);
  console.log("Lösenord från .env:", process.env.ADMIN_PASSWORD);

  if (password !== process.env.ADMIN_PASSWORD) {
    return res.status(403).json({ error: "Unauthorized" });
  }

  try {
    const product = await Product.findByPk(req.params.id);
    if (!product) {
      return res.status(404).json({ error: "Produkten hittades inte" });
    }

    await product.destroy();
    res.json({ message: "Produkten togs bort" });
  } catch (error) {
    console.error("Error när produkt tas bort:", error);
    res.status(500).json({ error: "Något gick fel" });
  }
});

app.post("/api/chat", async (req, res) => {
  const { messages } = req.body;

  try {
    const products = await Product.findAll();
    const productList = products.map(p => `• ${p.name} – ${p.price} kr`).join("\n");

    const systemMessage = {
      role: "system",
      content: `
    Du är en butiksassistent som kan både svara på kunders frågor och hantera deras kundvagn.
    
    🛒 Om kunden vill LÄGGA TILL något i kundvagnen:
    ✅ Du får INTE skriva någon vanlig mening.
    ✅ Du får INTE förklara vad du gör.
    ✅ Du ska ENDAST svara så här exakt:
    ACTION: add-to-cart | id: [produktens ID]
    
    🗑️ Om kunden vill TA BORT något från kundvagnen:
    ❗️ Samma sak gäller: INGA vanliga meningar, INGEN förklaring.
    ✅ Du svarar ENDAST så här exakt:
    ACTION: remove-from-cart | id: [produktens ID]
    
    Exempel:
    Fel: "Jag har lagt till produkten åt dig!"
    Rätt: ACTION: add-to-cart | id: 5
    
    Fel: "Wireless har tagits bort från din kundvagn."
    Rätt: ACTION: remove-from-cart | id: 5
    
    📚 Om kunden ställer vanliga frågor, som "Vad kostar produkten?" eller "Vad har ni?", då svarar du artigt och informativt på svenska.
    
    Här är produktlistan:
    ${productList}
    `.trim()
    };
    
    
    

    const fullMessages = [systemMessage, ...messages];

    const response = await axios.post("http://localhost:11434/api/chat", {
      model: "llama3.2",
      messages: fullMessages,
      stream: false,
    });

    const content = response.data.message?.content || "";

    try {
      const parsed = JSON.parse(content);

      if (parsed.action === "add_to_cart") {
        const product = await Product.findOne({
          where: {
            name: { [Op.iLike]: `%${parsed.product_name}%` },
          },
        });

        if (!product) {
          return res.json({ answer: `❌ Produkten '${parsed.product_name}' hittades inte.` });
        }

        let cart = await Cart.findOne({ where: { UserId: 1 } });
        if (!cart) cart = await Cart.create({ UserId: 1 });

        const existing = await Cart_Row.findOne({
          where: { CartId: cart.id, ProductId: product.id },
        });

        if (existing) {
          existing.quantity += parsed.quantity || 1;
          await existing.save();
        } else {
          await Cart_Row.create({
            CartId: cart.id,
            ProductId: product.id,
            quantity: parsed.quantity || 1,
          });
        }

        return res.json({ answer: `✅ '${product.name}' har lagts till i din kundvagn.` });
      }

    } catch (jsonError) {
      return res.json({ answer: content });
    }

  } catch (error) {
    console.error("Chatbot-fel:", error.response?.data || error.message);
    res.status(500).json({ error: "❌ Något gick fel. Kontrollera att Ollama är igång." });
  }
});

// startar servern och skapar testdata
sequelize.sync().then(async () => {
  console.log("alla tabeller är synkade ✅");

  const [user, createdUser] = await User.findOrCreate({
    where: { email: "test@example.com" },
    defaults: {
      username: "testuser",
      email: "test@example.com",
    },
  });
  if (createdUser) {
    console.log("✅ testanvändare skapad");
  } else {
    console.log("✅ testanvändare finns redan");
  }

  const [product, createdProduct] = await Product.findOrCreate({
    where: { name: "Test Product" },
    defaults: {
      description: "detta är en testprodukt.",
      price: 10.99,
      imageUrl: "https://example.com/product.jpg",
    },
  });
  if (createdProduct) {
    console.log("✅ testprodukt skapad");
  } else {
    console.log("✅ testprodukt finns redan");
  }
});

app.listen(PORT, () => {
  console.log(`servern körs på port ${PORT}`);
});
