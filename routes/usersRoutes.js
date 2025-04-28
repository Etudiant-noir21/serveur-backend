import express from "express";
import { verifyToken } from "../middlewares/verifyToken.js";
import { isAdmin } from "../middlewares/isAdmin.js";
import { getDatabasePool } from "../lib/db.js";

const router = express.Router();

router.get("/mes-taches", verifyToken, async (req, res) => {
    try {
      const db = await getDatabasePool();
      const userId = req.user.userId;
  
      const [taches] = await db.query(`
        SELECT taches.*, 
               programmes.titre AS programme,
               EXISTS (
                 SELECT 1 FROM livraisons l 
                 WHERE l.programme_id = taches.programme_id 
                 AND l.user_id = taches.assignee_id 
                 AND l.tache_id = taches.id
               ) AS livraison
        FROM taches
        LEFT JOIN programmes ON taches.programme_id = programmes.id
        WHERE assignee_id = ?
      `, [userId]);
  
      res.status(200).json(taches);
    } catch (err) {
      console.error("Erreur mes-taches :", err.message);
      res.status(500).json({ message: err.message });
    }
  });
  
  
    
  router.get("/mes-programmes", verifyToken, async (req, res) => {
    const userId = req.user.userId;
  
    try {
      const db = await getDatabasePool();
  
      // Sélectionne les programmes auxquels l'utilisateur a des tâches assignées
      const [programmes] = await db.query(
        `
        SELECT DISTINCT p.id, p.titre
        FROM programmes p
        INNER JOIN taches t ON t.programme_id = p.id
        WHERE t.assignee_id = ?
        `,
        [userId]
      );
  
      res.status(200).json(programmes);
    } catch (err) {
      console.error("Erreur récupération programmes :", err.message);
      res.status(500).json({ message: err.message });
    }
  });

  // ✅ Route pour démarrer une tâche
router.put("/taches/:id/start", verifyToken, async (req, res) => {
    try {
      const db = await getDatabasePool();
      const userId = req.user.userId;
      const tacheId = req.params.id;
  
      console.log("id tache", req.params.id);
      
      const [result] = await db.query(
        `UPDATE taches SET status = 'en_cours' WHERE id = ? AND assignee_id = ?`,
        [tacheId, userId]
        
    );
    console.log(tacheId);
  
      if (result.affectedRows === 0) {
        return res.status(403).json({ message: "Tâche introuvable ou non autorisée" });
      }
  
      res.status(200).json({ message: "Tâche démarrée avec succès" });
    } catch (err) {
      console.error("Erreur démarrage tâche :", err.message);
      res.status(500).json({ message: "Erreur serveur" });
    }
  });
  
//   route pour afficher les statistique 
router.get("/dashboard", verifyToken, async (req, res) => {
    try {
      const db = await getDatabasePool();
      const userId = req.user.userId;
  
      // Total des tâches
      const [[{ totalTaches }]] = await db.query(
        `SELECT COUNT(*) AS totalTaches FROM taches WHERE assignee_id = ?`,
        [userId]
      );
  
      // Tâches terminées
      const [[{ tachesTerminees }]] = await db.query(
        `SELECT COUNT(*) AS tachesTerminees FROM taches WHERE assignee_id = ? AND status = 'terminee'`,
        [userId]
      );
  
      // Programmes distincts liés aux tâches
      const [[{ totalProgrammes }]] = await db.query(
        `SELECT COUNT(DISTINCT programme_id) AS totalProgrammes FROM taches WHERE assignee_id = ?`,
        [userId]
      );
  
      res.status(200).json({
        totalTaches,
        tachesTerminees,
        totalProgrammes,
      });
    } catch (err) {
      console.error("Erreur dashboard user :", err.message);
      res.status(500).json({ message: "Erreur serveur" });
    }
  });
  
  // Like et dislike 
  router.post("/vote", verifyToken, async (req, res) => {
    const userId = req.user.userId;
    const { livraisonId, voteType } = req.body;
  
    try {
      const db = await getDatabasePool();
  
      // Vérifie si l'utilisateur a déjà voté pour cette livraison
      const [existingVote] = await db.query(
        "SELECT * FROM votes WHERE user_id = ? AND livraison_id = ?", 
        [userId, livraisonId]
      );
  
      if (existingVote.length > 0) {
        // Mise à jour du vote existant
        await db.query(
          "UPDATE votes SET vote_type = ?, created_at = NOW() WHERE user_id = ? AND livraison_id = ?",
          [voteType, userId, livraisonId]
        );
      } else {
        // Création d'un nouveau vote
        await db.query(
          "INSERT INTO votes (user_id, livraison_id, vote_type) VALUES (?, ?, ?)",
          [userId, livraisonId, voteType]
        );
      }
  
      res.status(200).json({ message: "Vote enregistré avec succès" });
  
    } catch (err) {
      console.error("Erreur survenue :", err);
      res.status(500).json({ message: "Erreur serveur" });
    }
  });
  
    
export default router