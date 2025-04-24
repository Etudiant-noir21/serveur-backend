import express from "express";
import { getDatabasePool } from "../lib/db.js";
import bcryptjs from "bcryptjs"
import jwt from "jsonwebtoken"
import { error, log } from "console";

const router = express.Router()

// incription
router.post('/register', async (req, res) => {
    console.log("Données reçues : ", req.body);
    const {name, prenom, password,email} = req.body
 if(!name || !prenom || !password || !email){
    return res.status(400).json({message: "Tous les champs sont obligatoires !"})
 }
    let hashedPassword
    
    try{
      const db = await getDatabasePool()
      const [rows]= await db.query("SELECT * FROM users WHERE email = ?", [email]) 
      if(rows.length > 0){
        return res.status(409).json({message: "Email déjà utilisé !"})
      }

       hashedPassword = await bcryptjs.hash(password, 10)
       console.log("hashedPassword",hashedPassword);
       
      await db.query(
        "INSERT INTO users (nom, prenom, motDePasse, email) VALUES (?, ?, ?, ?)", 
        [name, prenom, hashedPassword, email])
      res.status(201).json({message: "Utilisateur créé !"})
    }
    catch(err){
      console.log(hashedPassword);
      
        res.status(500).json({message: err.message})
        console.error("Erreur inconnue :", err);
        

    }
})

// login
router.post('/login', async (req, res) => {
    const {password,email} = req.body
    console.log("route login appeler");
    console.log("donnes recu", req.body);
    
    try{
      const db = await getDatabasePool()
      onsole.log("✅ Connexion à la BDD réussie");
      const [rows]= await db.query("SELECT * FROM users WHERE email = ?", [email]) 
      console.log("📦 Résultat de la requête :", rows);
      if(rows.length === 0){
        return res.status(404).json({message: "Utilisateur introuvable !"})
      }

      const isPasswordValid = await bcryptjs.compare(password, rows[0].motDePasse)
      if(!isPasswordValid){
        return res.status(401).json({message: "Mot de passe incorrect !"})
      }

      const token = jwt.sign({userId: rows[0].id, role: rows[0].role}, process.env.JWT_KEY, {expiresIn: '7d'})
     return res.status(201).json({token: token, role: rows[0].role})
    }
    catch(err){
        res.status(500).json({message: err.message})
        console.error("Erreur inconnue :", err);
        

    }
})

export default router