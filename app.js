//Module Express
const express = require('express')
const app = express()
//Module Express EJS Layouts
var expressLayouts = require('express-ejs-layouts');
//3rd party Middleware Morgan
var morgan = require('morgan')

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
const flash = require('connect-flash');

//Module multer untuk upload image
const multer  = require('multer')
const path = require('path')

app.use(express.json()) // => req.body

//Information using EJS
app.set('view engine', 'ejs');
app.set('layout', 'layout/layout');
app.use(expressLayouts);
app.use(express.static('public'))
app.use(express.urlencoded({extended: true}))

app.use(cookieParser('secret'));
app.use(
    session({
        cookie: {maxAge: 6000},
        secret: 'secret',
        resave: true,
        saveUninitialized: true,
    })
);
app.use(flash());

//Morgan dev
app.use(morgan('dev'))


//Route untuk halaman utama
app.get('/', (req, res) => {
    res.render('index', 
    {
        nama: "Muhammad Adityo Fathur Rahim",
        title: 'Aplikasi Penjualan Beras',
    });
})

//Route untuk halaman about
app.get('/about', (req, res) => {
    res.render('about', {nama: "Muhammad Adityo Fathur Rahim",
    title: 'About Page'})
})


//ROUTE UNTUK CUSTOMER
//Route untuk halaman customer list
app.get('/customer', customer.loadCustomer)

//Route list tambah data Customer
app.get('/customer/add', (req, res, next) => {
    res.render('customer-add', {title: 'Add Customer Page'})
})

//Route untuk menerima data input dari form Tambah Customer
app.post('/customer', [check('mobile', 'Mobile Phone is invalid!').isMobilePhone('id-ID')],
    customer.addCustomer)

//Route list ketika tombol detail ditekan pada sebuah baris data customer di halaman customer.ejs
app.get('/customer/:id', customer.detailCustomer)

//Route list ketika tombol edit ditekan pada halaman detail data customer
app.get('/customer/edit/:id', customer.editCstPage)

//Menerima data input dari form Edit data customer
app.post('/edit/:id', [
    check('mobile', 'Mobile Phone is invalid!').isMobilePhone('id-ID')],
    customer.updateCustomer)

//Route list ketika tombol delete ditekan pada sebuah baris data customer di halaman customer.ejs
app.get('/customer/delete/:id', customer.deleteCustomer);



//ROUTE UNTUK PRODUCT
//Route untuk halaman product list
app.get('/product', product.loadProduct)

// MULTERRR
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, './public/img')
    },
    filename: function (req, file, cb) {
        console.log();
        cb(null, `image-${Date.now()}` + path.extname(file.originalname))
    }
})

const upload = multer({ storage: storage })

//Route list tambah data Customer
app.get('/product/add', (req, res, next) => {
    res.render('product-add', {title: 'Add Product Page'})
})

//Route untuk menerima data input dari form Tambah Customer
app.post('/product', upload.array('img_product', 1), product.addProduct)
// [body('code_product').custom(product.checkData)], 

//Route list ketika tombol detail ditekan pada sebuah baris data product di halaman product.ejs
app.get('/product/:id', product.detailProduct)

//Route list ketika tombol delete ditekan pada sebuah baris data product di halaman product.ejs
// app.get('/customer/delete/:id', product.deleteProduct);


//Jika url dimasukkan selain routes list yang tersedia
app.use('/', (req,res) => {
    res.status(404)
    res.send('Page not found: 404')
})

app.listen(config.port, () => {
    console.log(`${config.appName} listening on port ${config.port}`)
})