import mysql from 'mysql2';

let connexion
export const connexionToDatabase= async ()=>{
  if(!connexion){
    connexion= await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME
    }).promise(); 
  }
  return connexion
}

