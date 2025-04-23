import mysql from 'mysql2'; // Utilisez mysql2/promise directement

// Variable pour stocker le pool
let pool;

// Fonction pour initialiser et retourner le pool
export const getDatabasePool = async () => {
  if (pool) {
    return pool; // Retourne le pool existant si déjà initialisé
  }

  try {
    pool = mysql.createPool({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'projet',
      port: process.env.DB_PORT || 3306,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
      // ssl: {
      //   rejectUnauthorized: true
      // }
    }).promise();

    // Testez la connexion
    const conn = await pool.getConnection();
    console.log('Connexion au pool MySQL établie');
    conn.release(); 

    // Gestion des erreurs globales du pool
    pool.on('error', (err) => {
      console.error('Erreur inattendue dans le pool MySQL:', err);
      if (err.code === 'PROTOCOL_CONNECTION_LOST') {
        pool = null; 
      }
    });

    return pool;
  } catch (error) {
    console.error('Erreur lors de l\'initialisation du pool MySQL:', error);
    throw error;
  }
};