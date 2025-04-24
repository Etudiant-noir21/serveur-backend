import express from "express";
import cors from "cors"
import router from "./routes/authRoutes.js";
import dotenv from "dotenv";
import adminRoutes from "./routes/adminRoutes.js";
import tachesRoutes from "./routes/tachesRoutes.js"
import usersRoutes from "./routes/usersRoutes.js"
import livraisonRoutes from "./routes/livraisonRoutes.js"

dotenv.config();
const app = express();
app.use(cors({
    origin: 'https://dashboard-original.onrender.com',
    credentials: true 
  }));
app.use(express.json());
app.use("/uploads", express.static("uploads"));
app.use("/auth", router);
app.use("/admin", adminRoutes);
app.use("/admin",tachesRoutes)
app.use("/user",usersRoutes)
app.use("/user",livraisonRoutes)

const port = process.env.DB_PORT
app.listen(3000, () => {
    console.log("Serveur démarré sur le port 3000");
})