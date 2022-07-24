//Memanggil database
const pool = require("../models/db")
const { validationResult } = require('express-validator');

//Fungsi untuk mengecek data yang dipilih berdasarkan id ada atau tidak di dalam database
const checkDataId = async (value) => {
    const query = await pool.query(`SELECT * FROM customer WHERE id = '${value}'`)
    const cst = query.rows[0];
    return cst;
}

//Fungsi untuk memuat semua data pada tabel customer dari database
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
        res.render('customer-add', {
            title: "Add Customer Form",
            errors: errors.array(),
            tempParams: req.body,
        });
    } else {
        const newCont = req.body;
        //Pesan flash untuk data berhasil ditambahkan
        req.flash('msg', 'Customer Data has been successfully saved!')
        //Kueri untuk menambahkan input tambah data customer ke database
        await pool.query(`INSERT INTO customer (name, mobile, address) 
                        VALUES ('${newCont.name}', '${newCont.mobile}', '${newCont.address}')`)
        res.redirect('/customer');
    }
}

//Fungsi untuk mengupdate data customer yang dipilih
const updateCustomer = async (req, res) => {
    const errors = validationResult(req);
    //Variabel untuk menyimpan sebuah object dari data Customer yang dipilih berdasarkan id
    const cst = await checkDataId(req.params.id)
    // console.log(errors)
    if (!errors.isEmpty()) {
        res.render('customer-edit', {
            title: "Add Customer Data Form",
            errors: errors.array(),
            cst,
        });
    } else {
        //Object untuk menampung value dari form inputan yang diterima
        const {name, mobile, address} = req.body
        //Variabel untuk menampung parameter id dari url
        const paramsCst = req.params.id
        //Kueri untuk menambahkan input tambah data customer ke database
        await pool.query(`UPDATE customer SET 
                            name = '${name}', 
                            mobile = '${mobile}', 
                            address = '${address}'
                            WHERE id = '${paramsCst}'`)
        req.flash('msg', 'Customer Data has been successfully updated!')
        res.redirect('/customer')
    }
}

// Fungsi untuk menampilkan detail data Customer
const detailCustomer = async (req, res) => {
    //Variabel untuk menyimpan sebuah object dari data Customer yang dipilih berdasarkan id
    const cst = await checkDataId(req.params.id)
    res.render('customer-detail', {title: 'Detail Customer Page', cst})
}

//Fungsi untuk menghapus data yang dipilih dari database
const deleteCustomer = async (req, res) => {
    //Kueri untuk melakukan pengecekan apakah data yang dimasukan pada url ditemukan atau tidak
    const cst = await checkDataId(req.params.id)
    //Pengkondisian apabila data yang dipilih tidak ditemukan atau kosong
    if (!cst) {
        req.flash('msg', 'Customer Data cannot be delete, data is not found!')
    } else {
        //Kueri menghapus data customer yang dipilih
        pool.query(`DELETE FROM customer WHERE id = '${req.params.id}'`)
        req.flash('msg', 'Customer Data has been successfully deleted!')
    }
    res.redirect('/customer')
}

//Fungsi untuk mengupdate data yang dipilih
const editCstPage = async (req, res) => {
    //Variabel untuk menyimpan sebuah object dari data customer yang dipilih
    const cst = await checkDataId(req.params.id)
    res.render('customer-edit', {title: 'Edit Customer Page', cst})
}

//Export module yang ada di dalam customer.js ini
module.exports = { 
    checkDataId, 
    loadCustomer, 
    addCustomer, 
    updateCustomer, 
    editCstPage, 
    detailCustomer, 
    deleteCustomer,
};