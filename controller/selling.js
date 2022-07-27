//Module untuk pemanggilan database
const pool = require("../models/db")

//Fungsi untuk mengecek data yang dipilih berdasarkan id ada atau tidak di dalam database
const checkDataId = async (value) => {
    const query = await pool.query(`SELECT * FROM selling WHERE id = '${value}'`)
    const sel = query.rows[0];
    return sel;
}


//Fungsi untuk memuat semua data pada tabel product dari database
const loadSellProduct = async (req, res) => {
    // Pengkondisian apabila user role super admin mencoba mengakses halaman user list
    if (req.user.role == "super admin") {
        res.redirect(`/`)
        return
    }

    const query = await pool.query('SELECT category FROM product GROUP BY category')
    const catPdt = query.rows;

    const query2 = await pool.query('SELECT * FROM product')
    const selAll = query2.rows;
    res.render('selling-productAll', {
        title: 'Selling All Product',
        selAll, catPdt,
        msg: req.flash('msg'),
        user: req.user
    })
}

const catAllProduct = async (req, res) => {
    // Pengkondisian apabila user role super admin mencoba mengakses halaman user list
    if (req.user.role == "super admin") {
        res.redirect(`/`)
        return
    }

    const query = await pool.query('SELECT category FROM product GROUP BY category')
    const catPdt = query.rows;
    
    const paramsCat = req.params.category
    const params = decodeURIComponent(paramsCat)
    console.log(params);
    const query1 = await pool.query(`SELECT category FROM product WHERE category = '${params}'`)
    const cat = query1.rows[0];
    console.log(cat);
    
    const query2 = await pool.query(`SELECT * FROM product WHERE category = '${cat.category}'`)
    const selPdtCat = query2.rows;
    console.log(selPdtCat);
    res.render('selling-productCat', {
        title: 'Selling Category Product',
        selPdtCat, catPdt,
        msg: req.flash('msg'),
        user: req.user
    })

}


const addCart = async (req, res) => {
    const codePdt = req.params.code_product
    const query = await pool.query(`SELECT * FROM product WHERE code_product = '${codePdt}'`)
    // console.log(query.rows);
    console.log(`SEBELUM ${req.session.cart}`);
    if (typeof req.session.cart === "undefined") {
        req.session.cart = []
        let dateNow = Date.now()
        //Mengirim informasi session cart
        req.session.cart.push({
            date : dateNow,
            quantity : 0
        })
    } else {
        let cart = req.session.cart
    }
    console.log(`SEBELUM ${req.session.cart}`);
}

//Export module yang ada di dalam product.js ini
module.exports = { loadSellProduct, catAllProduct, addCart }