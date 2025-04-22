import express from "express";
import { verifyToken } from "../middlewares/verifyToken.js";
import { isAdmin } from "../middlewares/isAdmin.js";
import { getDatabasePool } from "../lib/db.js";

const router = express.Router();

// ajout des taches
router.post("/tasks", verifyToken, isAdmin, async (req, res) => {
    const {titre, description, programmeId, assigneeId} = req.body
    if(!titre || !description || !programmeId || !assigneeId){
        return res.status(400).json({message: "donnes Manquant"})
    }
    console.log("mes donnes envoyer ",req.body);

    try{
      const db= await getDatabasePool()
    //   inserer les donnes dans la base de donnes
    await db.query(
        "INSERT INTO taches (titre, description,programme_id,assignee_id) VALUES (?, ?, ?, ?)",
        [titre,description,programmeId,assigneeId])
        res.status(201).json({message: "taches Ajouter"})
    }catch(err){
        res.status(500).json({message: err.message})
        console.error("erreur survenu: ", err.message);
        
    }
    
})

router.get("/taches", verifyToken, isAdmin, async (req, res) => {
    try {
      const db = await getDatabasePool();
  
      const [taches] = await db.query(`
        SELECT 
          taches.id,
          taches.titre,
          taches.description,
          taches.status,
          taches.programme_id,
          programmes.titre AS programme,
          users.nom AS assignee_nom,
          users.prenom AS assignee_prenom
        FROM taches
        LEFT JOIN programmes ON taches.programme_id = programmes.id
        LEFT JOIN users ON taches.assignee_id = users.id
        ORDER BY taches.created_at DESC
      `);
  
      res.status(200).json(taches);
    } catch (err) {
      console.error("Erreur récupération tâches :", err.message);
      res.status(500).json({ message: err.message });
    }
  });
  




export default router