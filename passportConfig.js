const LocalStrategy = require("passport-local").Strategy
//Memanggil database
const pool = require("./models/db")
//Module Bcrypt
const bcrypt = require('bcrypt')
const { authenticate } = require("passport")

const initialize = (passport) => {
    const authenticateUser = (email, password, done) => {

        //Mengecek ketersediaan data user berdasarkan email
        pool.query(`SELECT * FROM public."user" WHERE email = $1`,
        [email],
        (err, results) => {
            if (err) {
                throw err
            }

            // console.log(`test ${results.rows[0]}`);
            
            //Pengkondisian apabila data user ditemukan atau tidak
            if (results.rows.length > 0) {
                
                const user = results.rows[0]
                
                //Membandingkan antara pasword yang diinput dengan data password pada database dengan bcrypt
                // const match = bcrypt.compare(password, dataUser.password)
                bcrypt.compare(password, user.password, (err, isMatch) => {
                    if (err) {
                        throw err
                    }
    
                    //Jika sesuai maka tidak ada error yang dikirimkan, dan variabel dataUser dikembalikan ke luar fungsi
                    if (isMatch) {
                        return done(null, user)
                    //Jika tidak sesuai maka pesan message yang akan dikirimkan
                    } else {
                        return done(null, false, {message: "Password is not correct! Try again!"})
                    }
                })
            //Apabila data user tidak ditemukan/kosong
            } else {
                //Maka pesan yang akan dikirimkan dari fungsi
                return done(null, false, {message: "Email is not registered!"})
            }
        }
        )   
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

    passport.serializeUser((user, done) => done(null, user.id))

    passport.deserializeUser((id, done) => {
        pool.query(`SELECT * FROM public."user" WHERE id = $1`, [id], (err, results) => {
            if (err) {
                throw err
            }
            // console.log(`ID is ${JSON.stringify(results.rows[0])}`);
            return done(null, results.rows[0])
        })
    })
}

module.exports = initialize