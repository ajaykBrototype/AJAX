import express from "express";
import path from "path";
import dotenv from "dotenv";
dotenv.config();
import userRoutes from "./routes/userRoutes.js";
import adminRoutes from "./routes/adminRoutes.js"
import connectDB from "./config/db.js";
import session from "express-session"; 
import morgan from "morgan";
import passport from "passport";


console.log("ENV TEST:", process.env.GOOGLE_CLIENT_ID);
import "./config/passport.js";

const app = express();

connectDB();

   app.use(
  session({
    secret: "secret123",
    resave: false,
    saveUninitialized: false,
     cookie: {
       secure: false,
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000
  }
  })
);

app.use(morgan('dev'))
app.use(express.urlencoded({ extended: true }));
app.use(express.json());


import { fileURLToPath } from "url";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));


app.use(express.static("public"));
app.use("/uploads", express.static("public/uploads"));

app.use(passport.initialize());
app.use(passport.session());

import Cart from "./models/user/cartModel.js";
import Wishlist from "./models/user/wishlistModel.js";

app.use(async (req, res, next) => {
  res.locals.user = req.session.userId || null;
  res.locals.cartCount = 0;
  res.locals.wishlistCount = 0;
  
  if (req.session.userId) {
    try {
      const [cart, wishlist] = await Promise.all([
        Cart.findOne({ user: req.session.userId }),
        Wishlist.findOne({ user: req.session.userId })
      ]);
      
      if (cart) res.locals.cartCount = cart.items.length;
      if (wishlist) res.locals.wishlistCount = wishlist.items.length;
    } catch (err) {
      console.error("Locals Middleware Error:", err);
    }
  }
  next();
});


app.use("/", userRoutes);
app.use("/admin", adminRoutes);


console.log(process.env.MONGO_URI);

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});