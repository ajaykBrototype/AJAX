import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();

// Mute console.log from other files if possible, but let's just import
import { loadCategoryPage } from "./controllers/user/product.controller.js";

async function run() {
  await mongoose.connect(process.env.MONGO_URI);
  
  const req = {
    params: { name: "sample" },
    query: {},
    session: { userId: null }
  };
  
  const res = {
    redirect: (path) => console.log("REDIRECTED TO:", path),
    render: (view, data) => {
      console.log("RENDERED VIEW:", view);
      console.log("PRODUCTS LENGTH:", data.products.length);
      console.log("TARGET CATEGORY:", data.targetCategory.name);
      if (data.products.length > 0) {
        console.log("FIRST PRODUCT:", data.products[0].name);
      }
    }
  };

  await loadCategoryPage(req, res);
  process.exit(0);
}

run();
