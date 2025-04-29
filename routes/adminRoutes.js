import express from "express";
import { verifyToken } from "../middlewares/verifyToken.js";
import { isAdmin } from "../middlewares/isAdmin.js";
import { getDatabasePool } from "../lib/db.js";

const router = express.Router();

router.get("/", verifyToken, isAdmin, (req, res) => {
    res.json("Admin route accessible");
});

// Ajouter un programme
router.post("/programme", verifyToken, isAdmin, async (req, res) => {
    const {titre} = req.body
    if(!titre){
        return res.status(400).json({message: "titre manquant !"})
    }
    console.log(req.body);
    
    try{
        const db = await getDatabasePool()
        await db.query("INSERT INTO programmes (titre) VALUES (?)", [titre])
        res.status(201).json({message: "Programme ajouté !"})
    }catch(err){
        res.status(500).json({message: err.message})
    }
})

// voir toutes les programmes
router.get("/programmes", verifyToken, isAdmin, async (req, res) => {
    try{
        const db = await getDatabasePool()
        const [programme] = await db.query("SELECT * FROM programmes")
        res.status(200).json(programme)
    }catch(err){
        res.status(500).json({message: err.message})
    }
})

// supprimer programme
router.delete("/programmes/:id", verifyToken, isAdmin, async (req, res) => {
    try {
      const db = await getDatabasePool();
      const [programme] = await db.query("DELETE FROM programmes WHERE id = ?", [req.params.id]);
      res.status(200).json(programme);
    } catch (err) {
      console.error("Erreur suppression programme :", err.message);
      res.status(500).json({ message: err.message });
    }
  })

// recuperer utilisateurs 
router.get("/users", verifyToken, isAdmin, async (req, res) => {
    try {
      const db = await getDatabasePool();
      const [users] = await db.query("SELECT id, nom, prenom, email FROM users WHERE role = 'user'");
      res.status(200).json(users);
    } catch (err) {
      console.error("Erreur récupération users :", err.message);
      res.status(500).json({ message: err.message });
    }
  });

  // supprimer utilisateur
  router.delete("/users/:id", verifyToken, isAdmin, async (req, res) => {
    try {
      const db = await getDatabasePool();
      const [users] = await db.query("DELETE FROM users WHERE id = ?", [req.params.id]);
      res.status(200).json(users);
    } catch (err) {
      console.error("Erreur suppression users :", err.message);
      res.status(500).json({ message: err.message });
    }
  })
  

// voir tous les utilisateurs
router.get("/utilisateurs", verifyToken, isAdmin, async (req, res) => {
    try {
      const db = await getDatabasePool();
      const [users] = await db.query("SELECT id, nom, prenom, email,role FROM users ORDER BY nom ASC");
      res.status(200).json(users);
    } catch (err) {
      console.error("Erreur récupération users :", err.message);
      res.status(500).json({ message: err.message });
    }
  });


  router.get("/stats", verifyToken, isAdmin, async (req, res) => {
    try {
      const db = await getDatabasePool();
  
      const [[{ total_taches }]] = await db.query("SELECT COUNT(*) AS total_taches FROM taches");
      const [[{ total_programmes }]] = await db.query("SELECT COUNT(*) AS total_programmes FROM programmes");
      const [[{ total_users }]] = await db.query("SELECT COUNT(*) AS total_users FROM users");
  
      res.status(200).json({
        taches: total_taches,
        programmes: total_programmes,
        utilisateurs: total_users
      });
    } catch (err) {
      console.error("Erreur récupération stats :", err.message);
      res.status(500).json({ message: err.message });
    }
  });

//   Listes des taches users
  router.get("/users-taches", verifyToken, isAdmin, async (req, res) => {
    try {
      const db = await getDatabasePool();
  
      // Jointure utilisateurs + tâches + programme
      const [rows] = await db.query(`
        SELECT 
          users.id AS user_id,
          users.nom,
          users.prenom,
          users.email,
          users.role,
          taches.id AS tache_id,
          taches.titre AS tache_titre,
          taches.description,
          taches.status,
          programmes.titre AS programme
        FROM users
        LEFT JOIN taches ON users.id = taches.assignee_id
        LEFT JOIN programmes ON taches.programme_id = programmes.id
        WHERE users.role = 'user'
        ORDER BY users.nom ASC
      `);
  
      // Regrouper les tâches par utilisateur
      const usersMap = {};
  
      for (const row of rows) {
        if (!usersMap[row.user_id]) {
          usersMap[row.user_id] = {
            id: row.user_id,
            nom: row.nom,
            prenom: row.prenom,
            email: row.email,
            role: row.role,
            taches: [],
          };
        }
  
        if (row.tache_id) {
          usersMap[row.user_id].taches.push({
            id: row.tache_id,
            titre: row.tache_titre,
            description: row.description,
            status: row.status,
            programme: row.programme,
          });
        }
      }
  
      const users = Object.values(usersMap);
      res.status(200).json(users);
    } catch (err) {
      console.error("Erreur users+tâches :", err.message);
      res.status(500).json({ message: err.message });
    }
  });
  
  
  router.put("/users/:id/role", verifyToken, isAdmin, async (req, res) => {
    const userId = req.params.id;
    const { role } = req.body;
  
    if (!["user", "admin"].includes(role)) {
      return res.status(400).json({ message: "Rôle invalide" });
    }
  
    try {
      const db = await getDatabasePool();
      await db.query("UPDATE users SET role = ? WHERE id = ?", [role, userId]);
  
      res.status(200).json({ message: "Rôle mis à jour avec succès" });
    } catch (err) {
      console.error("Erreur changement rôle :", err.message);
      res.status(500).json({ message: err.message });
    }
  });

  
  router.put("/taches/:id/assign", verifyToken, isAdmin, async (req, res) => {
    const tacheId = req.params.id;
    const { assignee_id } = req.body;
  
    if (!assignee_id) {
      return res.status(400).json({ message: "Utilisateur non spécifié" });
    }
  
    try {
      const db = await getDatabasePool();
  
      await db.query("UPDATE taches SET assignee_id = ? WHERE id = ?", [
        assignee_id,
        tacheId,
      ]);
  
      res.status(200).json({ message: "Tâche assignée avec succès" });
    } catch (err) {
      console.error("Erreur assignation tâche :", err.message);
      res.status(500).json({ message: err.message });
    }
  });
  

export default router;