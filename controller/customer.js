//Memanggil database
const pool = require("../models/db")
const { validationResult } = require('express-validator/check');

//Fungsi untuk mengecek data yang dipilih berdasarkan nama ada atau tidak di dalam database
const checkData = async (value) => {
    const query = await pool.query(`SELECT * FROM customer WHERE name = '${value}'`)
    const cst = query.rows[0];
    return cst;
}

//Fungsi untuk mengecek data yang dipilih berdasarkan id ada atau tidak di dalam database
const checkDataId = async (value) => {
    const query = await pool.query(`SELECT * FROM customer WHERE id = '${value}'`)
    const cst = query.rows[0];
    return cst;
}

//Fungsi untuk memuat semua data pada tabel contact dari database
const loadCustomer = async (req, res) => {
    const query = await pool.query('SELECT * FROM customer')
    const cst =  query.rows;
    res.render('customer', {
        nama: "Muhammad Adityo Fathur Rahim",
        title: 'Customer List Page',
        cst,
        msg: req.flash('msg'),          //Parameter untuk menerima pesan flash message
    })
}

//Fungsi untuk menambahkan data customer ke dalam database
const addCustomer = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        res.render('add-customer', {
            title: "Add Customer Form",
            errors: errors.array(),
            tempParams: req.body,
        });
    } else {
        const newCont = req.body;
        //Pesan flash untuk data berhasil ditambahkan
        req.flash('msg', 'Customer Data has been successfully saved!')
        //Kueri untuk menambahkan input tambah data contact ke database
        await pool.query(`INSERT INTO customer (name, mobile, address) 
                        VALUES ('${newCont.name}', '${newCont.mobile}', '${newCont.address}')`)
        // contacts.saveContact(newCont.name, newCont.email, newCont.mobile)
        res.redirect('/customer');
    }
}

// Fungsi untuk menampilkan detail data Customer
const detailCustomer = async (req, res) => {
    //Variabel untuk menyimpan sebuah object dari data Customer yang dipilih berdasarkan id
    const cst = await checkDataId(req.params.id)
    res.render('detail', {title: 'Detail Customer Page', cst})
}

//Fungsi untuk menghapus data yang dipilih dari database
const deleteCustomer = async (req, res) => {
    //Kueri untuk melakukan pengecekan apakah data yang dimasukan pada url ditemukan atau tidak
    const query = await pool.query(`SELECT * FROM customer WHERE id = '${req.params.id}'`)
    const cont = query.rows[0];
    //Pengkondisian apabila data yang dipilih tidak ditemukan atau kosong
    if (!cont) {
        req.flash('msg', 'Contact Data cannot be delete, data is not found!')
    } else {
        //Kueri menghapus data contact yang dipilih
        pool.query(`DELETE FROM customer WHERE id = '${req.params.id}'`)
        req.flash('msg', 'Contact Data has been successfully deleted!')
    }
    res.redirect('/customer')
}



//Export module dari contact.js
module.exports = { checkData, loadCustomer, addCustomer, detailCustomer, deleteCustomer };