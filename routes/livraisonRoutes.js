import multer from "multer";
import path from "path";
import fs from "fs";
import express from "express";
import { verifyToken } from "../middlewares/verifyToken.js";
import { isAdmin } from "../middlewares/isAdmin.js";
import { connexionToDatabase } from "../lib/db.js";
const router = express.Router();
// 📁 Création du dossier si pas présent
const uploadDir = "uploads";
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);

// ⚙️ Config Multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  }
});
const upload = multer({ storage });

// ✅ Route pour livrer une tâche
router.post(
    "/livraison",
    verifyToken,
    upload.array("captures", 5),
    async (req, res) => {
      const { programme_id, description, tache_id } = req.body;
      const userId = req.user.userId;
  
      if (!programme_id || !tache_id) {
        return res.status(400).json({ message: "Programme ou tâche manquant" });
      }
  
      const files = req.files.map((file) => file.filename);
  
      try {
        const db = await connexionToDatabase();
  
        // ✅ Enregistrement de la livraison
        await db.query(
          `INSERT INTO livraisons (user_id, programme_id, description, fichiers, date)
           VALUES (?, ?, ?, ?, NOW())`,
          [userId, programme_id, description || "", JSON.stringify(files)]
        );
  
        // ✅ Mise à jour du statut de la tâche
        await db.query(
          `UPDATE taches SET status = 'terminee' WHERE id = ? AND assignee_id = ?`,
          [tache_id, userId]
        );
  
        res.status(201).json({ message: "Livraison enregistrée ✅" });
  
      } catch (err) {
        console.error("Erreur livraison :", err.message);
        res.status(500).json({ message: err.message });
      }
    }
  );
  

// recuperation de toutes les livraisons 
router.get("/livraisons", verifyToken, async (req, res) => {
    try {
      const db = await connexionToDatabase();
  
      const [livraisons] = await db.query(`
        SELECT l.id, l.description, l.date, l.fichiers,
               u.nom, u.prenom,
               p.titre AS programme
        FROM livraisons l
        INNER JOIN users u ON u.id = l.user_id
        INNER JOIN programmes p ON p.id = l.programme_id
        ORDER BY l.date DESC
      `);
   
      const parsedLivraisons = livraisons.map((l) => ({
        ...l,
        fichiers: JSON.parse(l.fichiers)
      }));
//    console.log("--", parsedLivraisons);
   
      res.status(200).json(parsedLivraisons);

    } catch (err) {
      console.error("Erreur chargement livraisons :", err.message);
      res.status(500).json({ message: err.message });
    }
  });
  
//   recuperer mes livraisons 
router.get("/mes-livraisons", verifyToken, async (req, res) => {
    try {
      const db = await connexionToDatabase();
      const userId = req.user.userId;
  
      const [livraisons] = await db.query(`
        SELECT l.id, l.description, l.date, l.fichiers,
               p.titre AS programme
        FROM livraisons l
        INNER JOIN programmes p ON p.id = l.programme_id
        WHERE l.user_id = ?
        ORDER BY l.date DESC
      `, [userId]);
  
      const parsed = livraisons.map((l) => ({
        ...l,
        fichiers: JSON.parse(l.fichiers)
      }));
  
      res.status(200).json(parsed);
    } catch (err) {
      console.error("Erreur mes livraisons :", err.message);
      res.status(500).json({ message: "Erreur serveur" });
    }
  });
  

export default router