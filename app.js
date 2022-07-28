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
const userCtrl = require('./controller/users.js');
const selling = require('./controller/selling.js');
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

//Middleware untuk logger/pencatatan aktivitas log pada sistem
app.use('/', async (req, res, next) => {
    let userName;
    let role;
    if (req.user === undefined) {
        userName = "Unregistered user"
        role = '-'
    } else {
        userName = req.user.name
        role = req.user.role
    }
    // console.log(req.user);
    await pool.query(`INSERT INTO public.log(
        name, role, url, method, date, time)
        VALUES ('${userName}', '${role}', '${req.url}', '${req.method}', now(), now())`)
    
    next()
})

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
        user: req.user
    });
})

app.get('*', (req, res, next) => {
    res.locals.cart =  req.session.cart
    next()
})


//ROUTE UNTUK CUSTOMER
//Route untuk halaman customer list
app.get('/customer', checkNotAuthenticated, customer.loadCustomer)

//Route list tambah data Customer
app.get('/customer/add', checkNotAuthenticated, (req, res, next) => {
    // Pengkondisian apabila user role super admin mencoba mengakses halaman user list
    if (req.user.role == "super admin") {
        res.redirect(`/`)
        return
    }
    res.render('customer-add', {title: 'Add Customer Page', user: req.user})
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
    res.render('product-add', {title: 'Add Product Page', user: req.user})
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



//ROUTE SELLING
app.get('/sellproduct', checkNotAuthenticated, selling.loadSellProduct)
app.get('/sellproduct/:category', checkNotAuthenticated, selling.catAllProduct)

//Route Cart
app.get('/cart/add/:code_product', checkNotAuthenticated, selling.addCart)
app.get('/checkout', checkNotAuthenticated, selling.checkoutPdt)
app.get('/checkout/update/:code_product', selling.updateCheckout)
app.get('/checkout/clear', selling.clearCheckout)



//ROUTE LOGIN & SUPER ADMIN
//Login
app.get('/login', checkAuthenticated, userCtrl.loginUsr)

app.post('/login', passport.authenticate('local', {
    successRedirect: "/",
    failureRedirect: "/login",
    failureFlash: true,
    successFlash: true
}))

//Route untuk tombol logout
app.get("/users/logout", userCtrl.logoutUsr)


//Halaman list user
app.get('/users', checkNotAuthenticated, userCtrl.listUsr)

//Tambah User
app.get('/users/add', checkNotAuthenticated, userCtrl.addUsr)

//Route list ketika tombol detail ditekan pada sebuah baris data user di halaman user.ejs
app.get('/users/:id', checkNotAuthenticated, userCtrl.detailUsr)

//Menerima input dari form tambah user
app.post('/users/add', [
    body('password2').custom(async (value, {req}) => {
        if (value !== req.body.password) {
            throw new Error('Password do not match');
        }
        return true;
    }),
    check('email', 'Email is invalid!').isEmail()], userCtrl.addInputUsr)

//Edit User
app.get('/users/edit/:id', checkNotAuthenticated, userCtrl.editUsr)

//Menerima input edit User
app.post('/users/edit/:id', [
    body('password2').custom(async (value, {req}) => {
        if (value !== req.body.password) {
            throw new Error('Password do not match');
        }
        return true;
    }),
    check('email', 'Email is invalid!').isEmail()], userCtrl.editInputUsr)

//Route list ketika tombol delete ditekan pada sebuah baris data customer di halaman customer.ejs
app.get('/users/delete/:id', checkNotAuthenticated, userCtrl.deleteUsr)


app.get('/log', checkNotAuthenticated, async (req, res) => {
    const query = await pool.query('SELECT * FROM public.log ORDER BY time ASC')
    const log =  query.rows;
    res.render('log', {
        title: 'Log Page',
        log,
        user: req.user
    })
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