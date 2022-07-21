//Module Express
const express = require('express')
const app = express()
//Module Express EJS Layouts
var expressLayouts = require('express-ejs-layouts');
//3rd party Middleware Morgan
var morgan = require('morgan')

//Import semua fungsi dari contact.js
const customer = require('./controller/customer.js');
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
//Route yang dituju, fungsi dari customer.js yang dipanggil
app.get('/customer', customer.loadCustomer)

//Route list tambah data Customer
app.get('/customer/add', (req, res, next) => {
    res.render('add-customer', {title: 'Add Customer Page'})
})

//Route untuk menerima data input dari form Tambah Customer
app.post('/customer', [
    // body('name').custom(customer.checkData),
    check('mobile', 'Mobile Phone is invalid!').isMobilePhone('id-ID')],
    customer.addCustomer)

//Route list ketika tombol detail ditekan pada sebuah baris data contact di halaman contact.ejs
app.get('/customer/:id', customer.detailCustomer)

//Route list ketika tombol edit ditekan pada halaman detail data contact
app.get('/customer/edit/:id', customer.editCstPage)

//Menerima data input dari form Edit data contact
app.post('/edit/:id', [
    check('mobile', 'Mobile Phone is invalid!').isMobilePhone('id-ID')],
    customer.updateCustomer)

//Route list ketika tombol delete ditekan pada sebuah baris data contact di halaman customer.ejs
app.get('/delete/:id', customer.deleteCustomer);



//ROUTE UNTUK PRODUCT


//Jika url dimasukkan selain routes list yang tersedia
app.use('/', (req,res) => {
    res.status(404)
    res.send('Page not found: 404')
})

app.listen(config.port, () => {
    console.log(`${config.appName} listening on port ${config.port}`)
})