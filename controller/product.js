//Module untuk pemanggilan database
const pool = require("../models/db")
//Module express-validator
const { validationResult } = require('express-validator');

//Fungsi untuk mengecek data yang dipilih berdasarkan id ada atau tidak di dalam database
const checkDataId = async (value) => {
    const query = await pool.query(`SELECT * FROM product WHERE id = '${value}'`)
    const pdt = query.rows[0];
    return pdt;
}

//Fungsi untuk mengecek data kode product tertinggi berdasarkan kategori produknya
const checkMaxCode = async (value) => {
    const query = await pool.query(`SELECT max(code_product) FROM product WHERE category = '${value}'`)
    const cd = query.rows[0];
    return cd;
}

//Fungsi untuk memuat semua data pada tabel product dari database
const loadProduct = async (req, res) => {
    const query = await pool.query('SELECT * FROM product')
    const pdt =  query.rows;
    res.render('product', {
        nama: "Muhammad Adityo Fathur Rahim",
        title: 'Product List Page',
        pdt,
        msg: req.flash('msg'),          //Parameter untuk menerima pesan flash message
    })
}

//Fungsi untuk menambahkan data customer ke dalam database
const addProduct = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        res.render('product-add', {
            title: "Add Product Form",
            errors: errors.array(),
            tempParams: req.body,
        });
    } else {
        const newCont = req.body
        //Variabel untuk kode produk baru
        let newCode
        //Pengkondisian untuk menghasilkan kode-product penambahan otomatis
        //Berdasarkan kategori produknya
        if (req.body.category == 'Beras Putih') {
            //Kode produk tertinggi ditampung pada variabel cd
            let cd = await checkMaxCode(req.body.category)
            if (cd) {
                //Mengambil 3 angka/karakter dari belakang
                let tmpNumber = cd.max.slice(-3)
                //Mengubah string value tmpNumber menjadi integer lalu ditambahkan 1
                let newNumber = parseInt(tmpNumber) + 1
                //Variable untuk menampung kode produk yang baru
                newCode = 'BPU' + newNumber.toString().padStart(3, '0')
            } else {
                newCode = 'BPU001'
            }
        } else if (req.body.category == 'Beras Merah') {
            let cd = await checkMaxCode(req.body.category)
            if (cd) {
                let tmpNumber = cd.max.slice(-3)
                let newNumber = parseInt(tmpNumber) + 1
                newCode = 'BME' + newNumber.toString().padStart(3, '0')
            } else {
                newCode = 'BME001'
            }
        } else if (req.body.category == 'Beras Ketan') {
            let cd = await checkMaxCode(req.body.category)
            if (cd) {
                let tmpNumber = cd.max.slice(-3)
                let newNumber = parseInt(tmpNumber) + 1
                newCode = 'BKE' + newNumber.toString().padStart(3, '0')
            } else {
                newCode = 'BKE001'
            }
        } else {
            let cd = await checkMaxCode(req.body.category)
            if (cd) {
                let tmpNumber = cd.max.slice(-3)
                let newNumber = parseInt(tmpNumber) + 1
                newCode = 'BHI' + newNumber.toString().padStart(3, '0')
            } else {
                newCode = 'BHI001'
            }
        }
        //Variabel untuk menyimpan nama file image yang diupload
        const img = req.files[0].filename
        //Pesan flash untuk data berhasil ditambahkan
        req.flash('msg', 'Product Data has been successfully saved!')
        //Kueri untuk menambahkan input tambah data contact ke database
        await pool.query(`INSERT INTO product (
                            code_product, name_product, 
                            price_unit, price_sack, 
                            stock, category, 
                            added_date, img_product)
                            VALUES ('${newCode}',
                            '${newCont.name_product}',
                            '${newCont.price_unit}',
                            '${newCont.price_sack}',
                            '${newCont.stock}',
                            '${newCont.category}',
                            '${newCont.added_date}',
                            '${img}')`)
        res.redirect('/product');
    }
}

// Fungsi untuk menampilkan detail data Product
const detailProduct = async (req, res) => {
    //Variabel untuk menyimpan sebuah object dari data Product yang dipilih berdasarkan id
    const pdt = await checkDataId(req.params.id)
    res.render('product-detail', {title: 'Detail Product Page', pdt})
}

//Export module yang ada di dalam product.js ini
module.exports = { loadProduct, addProduct, detailProduct }