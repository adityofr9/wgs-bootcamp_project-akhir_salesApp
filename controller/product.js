//Module untuk pemanggilan database
const pool = require("../models/db")
//Module express-validator
const { validationResult } = require('express-validator');

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
        const img = req.files[0].filename
        //Pesan flash untuk data berhasil ditambahkan
        req.flash('msg', 'Product Data has been successfully saved!')
        //Kueri untuk menambahkan input tambah data contact ke database
        await pool.query(`INSERT INTO product (
                            code_product, name_product, 
                            price_unit, price_sack, 
                            stock, category, img_product)
                            VALUES ('${newCont.code_product}','${newCont.name_product}','${newCont.price_unit}', '${newCont.price_sack}', '${newCont.stock}','${newCont.category}','${img}')`)
        res.redirect('/product');
    }
}

//Export module yang ada di dalam customer.js ini
module.exports = { loadProduct, addProduct }