const LocalStrategy = require("passport-local").Strategy
//Memanggil database
const pool = require("./models/db")
//Module Bcrypt
const bcrypt = require('bcrypt')
const { authenticate } = require("passport")

const initialize = (passport) => {
    const authenticateUser = (email, password, done) => {

        const query = pool.query(`SELECT * FROM public."user" WHERE email = '${email}'`)
        const usr = query.rows[0]
    }
    passport.use(
        new LocalStrategy(
            {
                usernameField: "email",
                passwordField: "password"
            },
            authenticateUser
        )
    )
}