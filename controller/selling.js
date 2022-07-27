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
    let pdt = query.rows[0]
    // console.log(`dari kueri:`);
    // console.log(pdt);
    //Mengecek apakah session cart tersedia atau tidak
    // console.log(`SEBELUM ${req.session.cart}`);
    if (typeof req.session.cart == "undefined") {
        // console.log(`first ${req.session.cart}`);
        req.session.cart = []
        let dateNow = Date.now()
        // console.log(`Middle ${req.session.cart}`);
        //Mengirim informasi session cart
        req.session.cart.push({
            date: dateNow,
            id_product: pdt.id,
            code: codePdt,
            name_product: pdt.name_product,
            cat: pdt.category,
            quantity: 1,
            stock: pdt.stock,
            price: pdt.price_unit,
            imgPdt: pdt.img_product
        })
    } else {
        let cart = req.session.cart
        let newItem = true
        let dateNow = Date.now()
        // console.log(`Sesudah terisi ${JSON.stringify(cart)}`);
        // console.log(`panjang cart ${cart.length}`);
        for (let i = 0; i < cart.length; i++) {
            //Mengecek apakah id_product pada object cart dengan index selanjutnya
            //sama dengan parameter yang diterima
            if (cart[i].id_product == pdt.id) {
                newItem = false
                break
            }
        }

            if (newItem) {
                cart.push({
                    date: dateNow,
                    id_product: pdt.id,
                    code: codePdt,
                    name_product: pdt.name_product,
                    cat: pdt.category,
                    quantity: 1,
                    stock: pdt.stock,
                    price: pdt.price_unit,
                    imgPdt: pdt.img_product
                })
            }
        // console.log(`SESUDAH session sudah ada ${JSON.stringify(req.session.cart)}`);
    }
    // console.log(`SESUDAH ${req.session.cart}`);
    console.log(`SESUDAH ${JSON.stringify(req.session.cart)}`);
    console.log(codePdt);
    res.redirect('back');
}


// Fungsi untuk router checkout
const checkoutPdt = async (req, res) => {
    if (req.session.cart && req.session.cart.length == 0) {
        delete req.session.cart
        res.redirect('/checkout');
    } else {
        res.render('checkout', {
            title: 'Checkout Selling Product',
            cart: req.session.cart,
            user: req.user
        })
    }
}

const updateCheckout = async (req, res) => {
    const codePdt = req.params.code_product
    const query = await pool.query(`SELECT * FROM product WHERE code_product = '${codePdt}'`)
    let pdt = query.rows[0]
    const cart = req.session.cart
    const action = req.query.action

    for (let i = 0; i < cart.length; i++) {
        if (cart[i].id_product == pdt.id) {
            switch (action) {
                case "add":
                    cart[i].quantity++
                    break;
                case "remove":
                    cart[i].quantity--
                    if (cart[i].quantity < 1) {
                        cart.splice(i, 1)
                    }
                    break;
                case "clear":
                    cart.splice(i, 1)
                    if (cart.length == 0) {
                        delete req.session.cart                        
                    }
                    break;
                    
                default:
                    console.log(`update problem`);
                    break;
            }
            break
        }
    }
    res.redirect('/checkout');
}

const clearCheckout = (req, res) => {
    delete req.session.cart;
    res.redirect('/checkout');
}

//Export module yang ada di dalam product.js ini
module.exports = { loadSellProduct, catAllProduct, addCart, checkoutPdt, updateCheckout, clearCheckout }