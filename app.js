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


//ROUTE LIST
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

//Route untuk halaman customer list
//Route yang dituju, fungsi dari customer.js yang dipanggil
app.get('/customer', customer.loadCustomer)

//Route list tambah data Customer
app.get('/customer/add', (req, res, next) => {
    res.render('add-customer', {title: 'Add Customer Page'})
})

//Route untuk menerima data input dari form Tambah Customer
app.post('/customer', [
    body('name').custom(customer.checkData),
    check('mobile', 'Mobile Phone is invalid!').isMobilePhone('id-ID')],
    customer.addCustomer)

//Route list ketika tombol detail ditekan pada sebuah baris data contact di halaman contact.ejs
app.get('/customer/:id', customer.detailCustomer)

//Route list ketika tombol edit ditekan pada halaman detail data contact
app.get('/customer/edit/:id', async (req, res) => {
    //Variabel untuk menyimpan sebuah object dari data contact yang dipilih
    const query = await pool.query(`SELECT * FROM contacts WHERE name = '${req.params.name}'`)
    const cont =  query.rows[0];
    res.render('edit-contact', {title: 'Edit Contact Page', cont})
})

//Menerima data input dari form Edit data contact
app.post('/edit/:name', [
    body('name').custom(async (value, {req}) => {
        const query = await pool.query(`SELECT * FROM contacts WHERE lower(name) = lower('${value}')`)
        const duplikat = query.rows[0];
        // const duplikat = contacts.checkDuplicate(value);
        // console.log(duplikat.name);
        if (duplikat) {
            // Pengkondisian input nama baru yang tidak sama dengan parameter namun duplikat dengan data nama yang lain
            // Sehingga apabila input nama baru yang duplikat namun masih sama dengan paramater (data itu sendiri)
            // maka fungsi dibawah tidak dijalankan
            if (req.params.name != value) {
                throw new Error('Contact name is already used!');
            }
        }
        return true;
    }),
    check('email', 'Email is invalid!').isEmail(),
    check('mobile', 'Mobile Phone is invalid!').isMobilePhone('id-ID')],
    async (req, res) => {
    const errors = validationResult(req);
    // Memanggil kembali object dari data yang dipilih
    // const cont = contacts.detailContact(req.params.name);
    const query = await pool.query(`SELECT * FROM contacts WHERE name = '${req.params.name}'`)
    const cont =  query.rows[0];
    // console.log(errors)
    if (!errors.isEmpty()) {
        res.render('edit-contact', {
            title: "Add Contact Form",
            errors: errors.array(),
            cont,
        });
    } else {
        const newCont = req.body
        const paramsCont = req.params.name
        // console.log(newCont);
        // console.log(paramsCont)

        // contacts.updateContact(paramsCont, newCont.name, newCont.email, newCont.mobile)
        //Kueri untuk menambahkan input tambah data contact ke database
        await pool.query(`UPDATE contacts SET 
                            name = '${newCont.name}', 
                            mobile = '${newCont.mobile}', 
                            emaiL = '${newCont.email}'
                            WHERE lower(name) = lower('${paramsCont}') `)
        req.flash('msg', 'Contact Data has been successfully updated!')
        res.redirect('/contact')
    }
})

//Route list ketika tombol delete ditekan pada sebuah baris data contact di halaman customer.ejs
app.get('/delete/:id', customer.deleteCustomer);

//Jika url dimasukkan selain routes list yang tersedia
app.use('/', (req,res) => {
    res.status(404)
    res.send('Page not found: 404')
})

app.listen(config.port, () => {
    console.log(`${config.appName} listening on port ${config.port}`)
})