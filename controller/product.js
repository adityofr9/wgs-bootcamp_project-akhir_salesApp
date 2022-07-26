//Module untuk pemanggilan database
const pool = require("../models/db")
//Module express-validator
const { validationResult } = require('express-validator');
//Module File System
const fs = require('fs')

//Fungsi untuk mengecek data yang dipilih berdasarkan id ada atau tidak di dalam database
const checkDataId = async (value) => {
    const query = await pool.query(`SELECT * FROM product WHERE id = '${value}'`)
    const pdt = query.rows[0];
    return pdt;
}

//Memuat database apakah sudah terisi atau kosong
const resetIdSeq = async () => {
    const query1 = await pool.query('SELECT * FROM product')
    const pdt1 =  query1.rows;
    //Pengkondisian apabila data kosong maka kueri untuk mengubah urutan kembali dari 1 dijalankan
    if (pdt1.length < 1) {
        await pool.query('ALTER SEQUENCE product_id_seq RESTART WITH 1')
    }
}

//Fungsi untuk mengecek data kode product tertinggi berdasarkan kategori produknya
const newCodeProduct = async (value) => {
    //Statement switch untuk menghasilkan inisial kode produk
    //Berdasarkan kategori produknya
    let initCode
    switch (value) {
        case "Beras Putih":
            //Inisial kode untuk kategori produk Beras Putih
            initCode = 'BPU'
            break; 
        case "Beras Merah":
            //Inisial kode untuk kategori produk Beras Merah
            initCode = 'BME'
            break;
        case "Beras Ketan":
            //Inisial kode untuk kategori produk Beras Ketan
            initCode = 'BKE'
            break;
        case "Beras Hitam":
            //Inisial kode untuk kategori produk Beras Hitam
            initCode = 'BHI'
            break;
    }
    //Query untuk mencari nilai kode produk tertinggi berdarasarkan katgori dari database
    const query = await pool.query(`SELECT max(code_product) FROM product WHERE category = '${value}'`)
    //Variabel untuk menyimpan objek/nilai max dari kueri
    const cd = query.rows[0];
    if (cd.max) {
        //Mengambil 3 angka/karakter dari belakang
        let tmpNumber = cd.max.slice(-3)
        //Mengubah string value tmpNumber menjadi integer lalu ditambahkan 1
        let newNumber = parseInt(tmpNumber) + 1
        //Variable untuk menampung kode produk yang baru
        newCode = initCode + newNumber.toString().padStart(3, '0')
    } else {
        //Nilai default jika nilai kode produk tertinggi tidak ada/null
        newCode = `${initCode}001`
    }
    return newCode;
}

//Fungsi untuk memuat semua data pada tabel product dari database
const loadProduct = async (req, res) => {
    // Pengkondisian apabila user role super admin mencoba mengakses halaman user list
    if (req.user.role == "super admin") {
        res.redirect(`/`)
        return
    }

    const query = await pool.query('SELECT * FROM product')
    const pdt =  query.rows;
    res.render('product', {
        nama: "Muhammad Adityo Fathur Rahim",
        title: 'Product List Page',
        pdt,
        msg: req.flash('msg'),          //Parameter untuk menerima pesan flash message
        user: req.user
    })
}

//Fungsi untuk menambahkan data customer ke dalam database
const addProduct = async (req, res) => {
    // Pengkondisian apabila user role super admin mencoba mengakses halaman user list
    if (req.user.role == "super admin") {
        res.redirect(`/`)
        return
    }

    const errors = validationResult(req)
    if (!errors.isEmpty()) {
        res.render('product-add', {
            title: "Add Product Form",
            errors: errors.array(),
            tempParams: req.body,
            user: req.user
        });
    } else {
        //Variabel untuk menampung semua input dari form
        const newCont = req.body
        //Variabel untuk menyimpan nama file image yang diupload
        const img = req.files[0].filename
        // const img2 = req.files[0]
        // console.log(img2);
        //Deklarasi variable untuk kode produk baru
        let newCode
        //Fungsi untuk mengubah urutan Id data melalui kueri
        await resetIdSeq()
        //Memanggil fungsi newCodeProduct lalu disimpan di variabel newCode
        newCode = await newCodeProduct(req.body.category)
        // console.log(`Final code ${newCode}`)
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
        //Pesan flash untuk data berhasil ditambahkan
        req.flash('msg', 'Product Data has been successfully saved!')
        res.redirect('/product');
    }
}

// Fungsi untuk menampilkan detail data Product
const detailProduct = async (req, res) => {
    // Pengkondisian apabila user role super admin mencoba mengakses halaman user list
    if (req.user.role == "super admin") {
        res.redirect(`/`)
        return
    }

    //Variabel untuk menyimpan sebuah object dari data Product yang dipilih berdasarkan id
    const pdt = await checkDataId(req.params.id)
    res.render('product-detail', {title: 'Detail Product Page', pdt, user: req.user})
}

// Fungsi untuk menghapus data product
const deleteProduct = async (req, res) => {
    // Pengkondisian apabila user role super admin mencoba mengakses halaman user list
    if (req.user.role == "super admin") {
        res.redirect(`/`)
        return
    }

    //Kueri untuk melakukan pengecekan apakah data yang dimasukan pada url ditemukan atau tidak
    const pdt = await checkDataId(req.params.id)
    //Pengkondisian apabila data yang dipilih tidak ditemukan atau kosong
    if (!pdt) {
        req.flash('msg', 'Product Data cannot be delete, data is not found!')
    } else {
        //Kueri menghapus data contact yang dipilih
        fs.unlinkSync(`./public/img/${pdt.img_product}`)
        pool.query(`DELETE FROM product WHERE id = '${req.params.id}'`)
        req.flash('msg', 'Product Data has been successfully deleted!')
    }
    res.redirect('/product')
}

//Fungsi untuk mengupdate data yang dipilih
const editPdtPage = async (req, res) => {
    // Pengkondisian apabila user role super admin mencoba mengakses halaman user list
    if (req.user.role == "super admin") {
        res.redirect(`/`)
        return
    }

    //Variabel untuk menyimpan sebuah object dari data product yang dipilih
    const pdt = await checkDataId(req.params.id)
    res.render('product-edit', {title: 'Edit Product Page', pdt, user: req.user})
}

//Fungsi untuk mengupdate data product yang dipilih
const updateProduct = async (req, res) => {
    // Pengkondisian apabila user role super admin mencoba mengakses halaman user list
    if (req.user.role == "super admin") {
        res.redirect(`/`)
        return
    }

    const errors = validationResult(req);
    //Variabel untuk menyimpan sebuah object dari data product yang dipilih berdasarkan id
    const pdt = await checkDataId(req.params.id)
    console.log(pdt.added_date.toLocaleString('id-ID'));
    // console.log(errors)
    if (!errors.isEmpty()) {
        res.render('product-edit', {
            title: "Add Product Data Form",
            errors: errors.array(),
            pdt,
            user: req.user
        });
    } else {
        // console.log(req.body);
        //Object untuk menampung value dari form inputan yang diterima
        const { name_product, price_unit, price_sack, stock, added_date} = req.body
        //Variabel untuk menampung parameter id dari url
        const paramsPdt = req.params.id
        //Variabel untuk menyimpan nama file image yang diupload
        let img
        if (!req.files[0]) {
            img = ''
            await pool.query(`UPDATE product SET 
                            name_product = '${name_product}', 
                            price_unit = '${price_unit}', 
                            price_sack = '${price_sack}',
                            stock = '${stock}',
                            added_date = '${added_date}'
                            WHERE id = '${paramsPdt}'`)
        } else {
            //Variabel untuk menyimpan nama file image yang diupload
            fs.unlinkSync(`./public/img/${pdt.img_product}`)
            img = req.files[0].filename
            img2 = req.files[0]
            console.log(img2);
            await pool.query(`UPDATE product SET 
                                name_product = '${name_product}', 
                                price_unit = '${price_unit}', 
                                price_sack = '${price_sack}',
                                stock = '${stock}',
                                added_date = '${added_date}',
                                img_product = '${img}'
                                WHERE id = '${paramsPdt}'`)
        }
        //Pengkondisian apabila ada input file image baru
        // if (pdt.img_product !== img) {
            
        // }
        //Kueri untuk menambahkan input tambah data product ke database
        // await pool.query(`UPDATE product SET 
        //                     name_product = '${name_product}', 
        //                     price_unit = '${price_unit}', 
        //                     price_sack = '${price_sack}',
        //                     stock = '${stock}',
        //                     added_date = '${added_date}'
        //                     WHERE id = '${paramsPdt}'`)
        req.flash('msg', 'Product Data has been successfully updated!')
        res.redirect('/product')
    }
}

//Export module yang ada di dalam product.js ini
module.exports = { loadProduct, addProduct, detailProduct, deleteProduct, editPdtPage, updateProduct}