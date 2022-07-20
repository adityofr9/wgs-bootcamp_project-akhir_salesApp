const Pool = require('pg').Pool

//Function pool
const pool = new Pool({
    user: "postgres",
    password: "12345",
    database: "db_salesApp",
    host: "localhost",
    port:5432
})

module.exports = pool