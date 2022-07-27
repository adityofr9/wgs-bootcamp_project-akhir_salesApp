//Memanggil database
const pool = require("../models/db")
const { validationResult } = require('express-validator');
const passport = require("passport")
//Module Bcrypt
const bcrypt = require('bcrypt')

//Fungsi untuk login
const loginUsr = async (req, res) => {
    res.render('login', {title: 'Login Page', layout: 'layout/login-layout'})
}

//Fungsi untuk logout
const logoutUsr = (req, res) => {
    req.logOut(
        function(err) {
            if (err) {
                return next(err)
            }
            req.flash('success_msg', "You have been logged out!")
            res.redirect('/login')
        }
    )
}

//Fungsi untuk route list user 
const listUsr = async (req, res) => {
    // Pengkondisian apabila user role admin mencoba mengakses halaman user list
    if (req.user.role == "admin") {
        res.redirect(`/`)
        return
    }

    const query = await pool.query('SELECT * FROM public."user" ORDER BY id ASC')
    const usr =  query.rows;
    res.render('user', {
        title: 'Users List Page',
        usr, 
        success_msg: req.flash('success_msg'),
        msg: req.flash('msg'),      //Parameter untuk menerima pesan flash message
        user: req.user
    })
}

//Fungsi untuk route tambah user
const addUsr = (req, res) => {
    // Pengkondisian apabila user role admin mencoba mengakses halaman user list
    if (req.user.role == "admin") {
        res.redirect(`/`)
        return
    }

    res.render('user-add', {nama: "Muhammad Adityo Fathur Rahim",
    title: 'Add User Page', 
    success_msg: req.flash('success_msg'),
    warning_msg: req.flash('warning_msg'),
    user: req.user
    })
}

//Fungsi untuk route detail user
const detailUsr = async (req, res) => {
    //Variabel untuk menyimpan sebuah object dari data User yang dipilih berdasarkan id
    const query = await pool.query(`SELECT * FROM public."user" WHERE id = '${req.params.id}'`)
    const usr = query.rows[0];
    res.render('user-detail', {title: 'Detail User Page', usr, user: req.user})
}

//Fungsi untuk route menerima input tambah user
const addInputUsr = async (req, res) => {
    // Pengkondisian apabila user role admin mencoba mengakses halaman user list
    if (req.user.role == "admin") {
        res.redirect(`/`)
        return
    }

    let { name, email, password } = req.body
    const role = "admin"
    // console.log({ name, email, password, password2 });
    const errors = validationResult(req);
    // console.log(errors);
    if (!errors.isEmpty()) {
        res.render('user-add', {
        title: 'Add User Page', errors: errors.array(), tempParams: req.body,
        success_msg: req.flash('success_msg'),
        warning_msg: req.flash('warning_msg'),
        user: req.user
        })
    } else {
        let hashPass = await bcrypt.hash(password, 10)
        //Mengecek input data email apabila terjadi duplikat pada database
        //public."user" karena aturan dari postgres untuk tabel bernama user
        const query = await pool.query(`SELECT * FROM public."user" WHERE email = '${email}'`)
        const usr = query.rows[0]
        // console.log(usr);
        if (usr) {
            req.flash('warning_msg', 'Email has been used!')
            // console.log(`data email sudah ada`);
        } else {
            await pool.query(`INSERT INTO public."user" (name, email, password, role, undeleted) 
                        VALUES ('${name}', '${email}', '${hashPass}', '${role}', 'false')`)
            req.flash('success_msg', 'New user has been added successfully!')
        }
        res.redirect('/users/add')
    }
}

//Fungsi untuk route halaman edit user
const editUsr = async (req, res) => {
    //Variabel untuk menyimpan sebuah object dari data User yang dipilih berdasarkan id
    const query = await pool.query(`SELECT * FROM public."user" WHERE id = '${req.params.id}'`)
    const usr = query.rows[0];
    res.render('user-edit', {
        title: 'Edit User Page',
        warning_msg: req.flash('warning_msg'),
        usr, 
        user: req. user})
}

//Fungsi untuk route menerima input edit user
const editInputUsr = async (req, res) => {
    const errors = validationResult(req)
    //Variabel untuk menyimpan sebuah object dari data User yang dipilih berdasarkan id
    const query = await pool.query(`SELECT * FROM public."user" WHERE id = '${req.params.id}'`)
    const usr = query.rows[0];
    console.log(usr);
    
    if (!errors.isEmpty()) {
        res.render('user-edit', {
            title: 'Edit User Page',
            errors: errors.array(),
            warning_msg: req.flash('warning_msg'),
            usr,
            user: req.user,
        })
        return
    }
        
    const { name, email, password, password2, role } = req.body
    const hashPass = await bcrypt.hash(password, 10)
    const paramsUsr = req.params.id
    //Mengecek input data email apabila terjadi duplikat pada database
    //public."user" karena aturan dari postgres untuk tabel bernama user
    const query2 = await pool.query(`SELECT * FROM public."user" WHERE email = '${email}'`)
    const emailUsr = query2.rows[0]
    if (emailUsr) {
        if (usr.email != email) {   
            req.flash('warning_msg', `Email: ${email} has been used!`)
            res.redirect(`/users/edit/${paramsUsr}`)
            return
        }
    } 
    if (password == '' || password2 == '') {
        // console.log('password kosong');
        await pool.query(`UPDATE public."user" SET
                        name = '${name}', 
                        email ='${email}', 
                        role = '${role}'
                        WHERE id = '${paramsUsr}'`)
        req.flash('success_msg', `User: ${usr.name} has been updated successfully!`)
    } else {
        // console.log('password terisi');
        await pool.query(`UPDATE public."user" SET
                        name = '${name}', 
                        email ='${email}', 
                        password = '${hashPass}', 
                        role = '${role}'
                        WHERE id = '${paramsUsr}'`)
        req.flash('success_msg', `User: ${usr.name} has been updated successfully!`)
    }
    res.redirect('/users')
}

// Fungsi untuk rout delete user
const deleteUsr = async (req, res) => {
    // Pengkondisian apabila user role admin mencoba mengakses halaman user list
    if (req.user.role == "admin") {
        res.redirect(`/`)
        return
    }
    
    //Variabel untuk menyimpan sebuah object dari data User yang dipilih berdasarkan id
    const query = await pool.query(`SELECT * FROM public."user" WHERE id = '${req.params.id}'`)
    const usr = query.rows[0];
    //Pengkondisian apabila data yang dipilih tidak ditemukan atau kosong
    if (!usr) {
        req.flash('msg', 'User Data cannot be delete, data is not found!')
    } else {
        //Kueri menghapus data user yang dipilih
        pool.query(`DELETE FROM public."user" WHERE id = '${req.params.id}'`)
        req.flash('msg', 'Customer Data has been successfully deleted!')
    }
    res.redirect('/users')
}


//Export module yang ada di dalam customer.js ini
module.exports = { 
    logoutUsr, 
    loginUsr, 
    listUsr, 
    addUsr, 
    detailUsr, 
    addInputUsr,
    editUsr,
    editInputUsr,
    deleteUsr
};