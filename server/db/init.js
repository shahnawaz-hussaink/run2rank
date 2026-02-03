// Database initialization script
require('dotenv').config();
const { initDatabase } = require('./database');

console.log('🚀 Initializing database...');
initDatabase();
console.log('✅ Database initialization complete!');
process.exit(0);
