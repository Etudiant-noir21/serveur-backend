import mysql from 'mysql2';

let connexion
export const connexionToDatabase= async ()=>{
  if(!connexion){
    connexion= await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD ,
      database: process.env.DB_NAME,
      port: process.env.DB_PORT || 3306,
      ssl: process.env.DB_SSL ? JSON.parse(process.env.DB_SSL) : null
    }).promise(); 
  }
  return connexion
}

