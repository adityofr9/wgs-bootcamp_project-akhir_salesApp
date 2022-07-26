//Module Express
const express = require('express')
const app = express()
//Module Express EJS Layouts
var expressLayouts = require('express-ejs-layouts');
//3rd party Middleware Morgan
var morgan = require('morgan')
//Module Bcrypt
const bcrypt = require('bcrypt')
//Module passport
const passport = require("passport")
const initializePassport = require('./passportConfig')
initializePassport(passport)

//Module dari controller
const customer = require('./controller/customer.js');
const product = require('./controller/product.js');
//Module Config
const config = require('./config')
//Memanggil database
const pool = require("./models/db")
//Express Validator
const { body, validationResult, check } = require('express-validator');
const { default: isEmail } = require('validator/lib/isEmail.js');

//Module untuk flash message
const session = require('express-session');
const cookieParser = require('cookie-parser');
// const flash = require('connect-flash');
const flash = require('express-flash');

//Module multer untuk upload image
const multer  = require('multer')
const path = require('path')

app.use(express.json()) // => req.body

//Information using EJS
app.set('view engine', 'ejs');
app.set('layout', 'layout/layout', 'layout/login-layout');
app.use(expressLayouts);
app.use(express.static('public'))
app.use(express.urlencoded({extended: false}))

app.use(cookieParser('secret'));
app.use(
    session({
        // cookie: {maxAge: 6000},
        secret: 'secret',
        resave: true,
        saveUninitialized: true,
    })
);

//Konfigurasi passport
app.use(passport.initialize())
app.use(passport.session())

app.use(flash());

//Morgan dev
app.use(morgan('dev'))

//Multer untuk input image
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, './public/img')
    },
    filename: function (req, file, cb) {
        cb(null, `product-${Date.now()}` + path.extname(file.originalname))
    }
})

const upload = multer({ storage: storage })


//Route untuk halaman utama
app.get('/', checkNotAuthenticated, (req, res) => {
    res.render('index', 
    {
        title: 'Aplikasi Penjualan Beras',
        user: req.user.name
    });
})

//Route untuk halaman about
// app.get('/about', checkNotAuthenticated, (req, res) => {
//     res.render('about', {nama: "Muhammad Adityo Fathur Rahim",
//     title: 'About Page'})
// })


//ROUTE UNTUK CUSTOMER
//Route untuk halaman customer list
app.get('/customer', checkNotAuthenticated, customer.loadCustomer)

//Route list tambah data Customer
app.get('/customer/add', checkNotAuthenticated, (req, res, next) => {
    res.render('customer-add', {title: 'Add Customer Page'})
})

//Route untuk menerima data input dari form Tambah Customer
app.post('/customer', [check('mobile', 'Mobile Phone is invalid!').isMobilePhone('id-ID')],
    customer.addCustomer)

//Route list ketika tombol detail ditekan pada sebuah baris data customer di halaman customer.ejs
app.get('/customer/:id', checkNotAuthenticated, customer.detailCustomer)

//Route list ketika tombol edit ditekan pada halaman detail data customer
app.get('/customer/edit/:id', checkNotAuthenticated, customer.editCstPage)

//Menerima data input dari form Edit data customer
app.post('/customer/edit/:id', [
    check('mobile', 'Mobile Phone is invalid!').isMobilePhone('id-ID')],
    customer.updateCustomer)

//Route list ketika tombol delete ditekan pada sebuah baris data customer di halaman customer.ejs
app.get('/customer/delete/:id', checkNotAuthenticated, customer.deleteCustomer);



//ROUTE UNTUK PRODUCT
//Route untuk halaman product list
app.get('/product', checkNotAuthenticated, product.loadProduct)

//Route list tambah data Customer
app.get('/product/add', checkNotAuthenticated, (req, res, next) => {
    res.render('product-add', {title: 'Add Product Page'})
})

//Route untuk menerima data input dari form Tambah Customer
app.post('/product', upload.array('img_product', 1), product.addProduct)
// [body('code_product').custom(product.checkData)], 

//Route list ketika tombol detail ditekan pada sebuah baris data product di halaman product.ejs
app.get('/product/:id', checkNotAuthenticated, product.detailProduct)

//Route list ketika tombol edit ditekan pada halaman detail data product
app.get('/product/edit/:id', checkNotAuthenticated, product.editPdtPage)

//Menerima data input dari form Edit data product
app.post('/product/edit/:id', upload.array('img_product', 1), product.updateProduct)

//Route list ketika tombol delete ditekan pada sebuah baris data product di halaman product.ejs
app.get('/product/delete/:id', checkNotAuthenticated, product.deleteProduct);



//ROUTE LOGIN & SUPER ADMIN
//Login
app.get('/login', checkAuthenticated, async (req, res) => {
    res.render('login', {title: 'Login Page', layout: 'layout/login-layout'})
})

app.post('/login', passport.authenticate('local', {
    successRedirect: "/",
    failureRedirect: "/login",
    failureFlash: true,
    successFlash: true
}))

//Route untuk tombol logout
app.get("/users/logout", (req, res) => {
    req.logOut(
        function(err) {
            if (err) {
                return next(err)
            }
            req.flash('success_msg', "You have been logged out!")
            res.redirect('/login')
        }
    )
})

//Halaman list user
app.get('/users', checkNotAuthenticated, async (req, res) => {
    const query = await pool.query('SELECT * FROM public."user" ORDER BY id ASC')
    const usr =  query.rows;
    if (req.user.role == "admin") {
        res.redirect(`/users/${req.user.id}`)
    }
    res.render('user', {
        title: 'Users List Page',
        usr, 
        success_msg: req.flash('success_msg'),
        msg: req.flash('msg'),      //Parameter untuk menerima pesan flash message
        user: req.user
    })
})

//Tambah User
app.get('/users/add', checkNotAuthenticated, (req, res) => {
    res.render('user-add', {nama: "Muhammad Adityo Fathur Rahim",
    title: 'Add User Page', 
    success_msg: req.flash('success_msg'),
    warning_msg: req.flash('warning_msg')
    })
})

//Route list ketika tombol detail ditekan pada sebuah baris data user di halaman user.ejs
app.get('/users/:id', checkNotAuthenticated, async (req, res) => {
    //Variabel untuk menyimpan sebuah object dari data User yang dipilih berdasarkan id
    const query = await pool.query(`SELECT * FROM public."user" WHERE id = '${req.params.id}'`)
    const usr = query.rows[0];
    res.render('user-detail', {title: 'Detail User Page', usr, user: req.user})
})

//Menerima input dari form tambah user
app.post('/users/add', [
    body('password2').custom(async (value, {req}) => {
        if (value !== req.body.password) {
            throw new Error('Password do not match');
        }
        return true;
    }),
    check('email', 'Email is invalid!').isEmail()],
async (req, res) => {
    let { name, email, password, password2 } = req.body
    const role = "admin"
    // console.log({ name, email, password, password2 });
    const errors = validationResult(req);
    // console.log(errors);
    if (!errors.isEmpty()) {
        res.render('user-add', {
        title: 'Add User Page', errors: errors.array(), tempParams: req.body,
        success_msg: req.flash('success_msg'),
        warning_msg: req.flash('warning_msg')
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
            await pool.query(`INSERT INTO public."user" (name, email, password, role) 
                        VALUES ('${name}', '${email}', '${hashPass}', '${role}')`)
            req.flash('success_msg', 'New user has been added successfully!')
        }
        res.redirect('/users/add')
    }
})

//Edit User
app.get('/users/edit/:id', checkNotAuthenticated, async (req, res) => {
    //Variabel untuk menyimpan sebuah object dari data User yang dipilih berdasarkan id
    const query = await pool.query(`SELECT * FROM public."user" WHERE id = '${req.params.id}'`)
    const usr = query.rows[0];
    res.render('user-edit', {
        title: 'Edit User Page',
        warning_msg: req.flash('warning_msg'),
        usr, 
        user: req. user})
})

//Menerima input edit User
app.post('/users/edit/:id', [
    body('password2').custom(async (value, {req}) => {
        if (value !== req.body.password) {
            throw new Error('Password do not match');
        }
        // console.log('ini apa??');
        //     console.log(err);
        return true;
    }),
    check('email', 'Email is invalid!').isEmail()], 
async (req, res) => {
    const errors = validationResult(req)
    //Variabel untuk menyimpan sebuah object dari data User yang dipilih berdasarkan id
    const query = await pool.query(`SELECT * FROM public."user" WHERE id = '${req.params.id}'`)
    const usr = query.rows[0];
    
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
    console.log('Ini email');
    console.log(email);
    console.log('Ini email lama');
    console.log(usr.email);
    if (emailUsr) {
        if (usr.email != email) {   
            console.log('Email udah dipake');
            req.flash('warning_msg', `Email: ${email} has been used!`)
            res.redirect(`/users/edit/${paramsUsr}`)
            return
        }
    } 
    if (password == '' || password2 == '') {
        console.log('password kosong');
        await pool.query(`UPDATE public."user" SET
                        name = '${name}', 
                        email ='${email}', 
                        role = '${role}'
                        WHERE id = '${paramsUsr}'`)
        req.flash('success_msg', `User: ${usr.name} has been added successfully!`)
    } else {
        console.log('password terisi');
        await pool.query(`UPDATE public."user" SET
                        name = '${name}', 
                        email ='${email}', 
                        password = '${hashPass}', 
                        role = '${role}'
                        WHERE id = '${paramsUsr}'`)
        req.flash('success_msg', `User: ${usr.name} has been added successfully!`)
    }
    res.redirect('/users')
})

//Route list ketika tombol delete ditekan pada sebuah baris data customer di halaman customer.ejs
app.get('/users/delete/:id', checkNotAuthenticated, async (req, res) => {
    //Variabel untuk menyimpan sebuah object dari data User yang dipilih berdasarkan id
    const query = await pool.query(`SELECT * FROM public."user" WHERE id = '${req.params.id}'`)
    const usr = query.rows[0];
    //Pengkondisian apabila data yang dipilih tidak ditemukan atau kosong
    if (!usr) {
        req.flash('msg', 'Customer Data cannot be delete, data is not found!')
    } else {
        //Kueri menghapus data user yang dipilih
        pool.query(`DELETE FROM public."user" WHERE id = '${req.params.id}'`)
        req.flash('msg', 'Customer Data has been successfully deleted!')
    }
    res.redirect('/users')
})

//Fungsi authenticated untuk melindungi akses ke route
function checkAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
        return res.redirect("/")
    }
    next()
}

//Fungsi not authenticated untuk melindungi akses ke route
function checkNotAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
        return next()
    }
    res.redirect("/login")
}

//Jika url dimasukkan selain routes list yang tersedia
app.use('/', (req,res) => {
    res.status(404)
    res.send('Page not found: 404')
})

app.listen(config.port, () => {
    console.log(`${config.appName} listening on port ${config.port}`)
})