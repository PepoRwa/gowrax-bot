const mysql = require('mysql2/promise');
require('dotenv').config();

// Création du pool de connexions
const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10, // Idéal pour un hébergement 4Go RAM
    queueLimit: 0
});

// Petit test de connexion au démarrage
pool.getConnection()
    .then(connection => {
        console.log('✅ Base de données MySQL (GOWRAX Empire) connectée avec succès !');
        connection.release();
    })
    .catch(err => {
        console.error('❌ Erreur de connexion à la base de données :', err.message);
    });

module.exports = pool;