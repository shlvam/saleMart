const fs = require('fs');
const path = require('path');

const stripe = require('stripe')('sk_test_51JrLRqSHGVrzBpCiEcmhFkqLRmwWW7dlPUZx71MvUry2eKl3ndy2eMZ2tNxneasPrjoME5I4FZLhscseHvKYXfet00G8E3dMHQ');
const pdfDoc = require('pdfkit');

const Product = require('../models/product');
const Order = require('../models/order');
const order = require('../models/order');

const ITEMS_PAGE = 2;

exports.getProducts = (req, res, next) => {
  let page=+req.query.page || 1;
  let totalItems=0;
  Product.find()
    .countDocuments()
    .then((prodCount) => {
      totalItems=prodCount;
      console.log(totalItems);
      return Product.find()
                    .skip((page-1)*ITEMS_PAGE)
                    .limit(ITEMS_PAGE);
    })
    .then(products => {
      res.render('shop/product-list', {
        prods: products,
        pageTitle: 'All Products',
        path: '/products',
        hasNext: totalItems > page*ITEMS_PAGE,
        hasPrev: page > 1,
        page: page,
        lastPage: Math.ceil(totalItems/ITEMS_PAGE)
      });
    })
    .catch(err => {
      console.log(err);
      const error = new Error(err);
      error.httpStatusCode = 500;
      next(error);
    });
};

exports.getProduct = (req, res, next) => {
  const prodId = req.params.productId;

  Product.findById(prodId)
    .then(product => {
      res.render('shop/product-detail', {
        product: product,
        pageTitle: product.title,
        path: '/products'
      });
    })
    .catch(err => {
      console.log(err);
      const error = new Error(err);
      error.httpStatusCode = 500;
      next(error);
    });
};

exports.getIndex = (req, res, next) => {
  let page=+req.query.page || 1;
  let totalItems=0; 
  
  Product.find()
    .countDocuments()
    .then((prodCount) => {
      totalItems=prodCount;
      return Product.find()
                    .skip((page-1)*ITEMS_PAGE)
                    .limit(ITEMS_PAGE);
      
    })
    .then(products => {
      res.render('shop/index', {
        prods: products,
        pageTitle: 'Shop',
        path: '/',
        // totalItems: totalItems,
        hasNext: totalItems > page*ITEMS_PAGE,
        hasPrev: page > 1,
        page: page,
        lastPage: Math.ceil(totalItems/ITEMS_PAGE)
      });
    })
    .catch(err => {
      console.log(err);
    });
};

exports.getCart = (req, res, next) => {
  req.user
    .populate('cart.item.prodId')
    .execPopulate()
    .then((user) => {
      const products = user.cart.item;
      // console.log(user);
      res.render('shop/cart', {
        path: '/cart',
        pageTitle: 'Your Cart',
        products: products
      });
    })
    .catch(err => {
      console.log(err);
      const error = new Error(err);
      error.httpStatusCode = 500;
      next(error);
    });
};

exports.postCart = (req, res, next) => {
  const prodId = req.body.productId;
  Product.findById(prodId)
    .then((product) => {
      return req.user.add_to_cart(product);       // a method in User model
    })
    .then((result) => {
      // console.log('in shop controller');
      // console.log(result.cart);
      res.redirect('/cart');
    })
    .catch(err => {
      console.log(err);
      const error = new Error(err);
      error.httpStatusCode = 500;
      next(error);
    });
};

exports.getCheckout = (req, res, next) => {
  let products;
  let total=0;

  req.user
    .populate('cart.item.prodId')
    .execPopulate()
    .then((user) => {
      products = user.cart.item;
      // console.log(user);
      products.forEach((p) => {
        total+=p.quantity*p.prodId.price;
      });
      return stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: products.map((p) => {
          return {
            name: p.prodId.title,
            quantity: p.quantity,
            currency: 'inr',
            amount: p.prodId.price*100,
            description: p.prodId.description
          };
        }),
        success_url: req.protocol+'://'+req.get('host')+'/checkout/success',
        cancel_url: req.protocol+'://'+req.get('host')+'/checkout/cancel'
      });
    })
    .then((session) => {
      res.render('shop/checkout', {
        path: '/checkout',
        pageTitle: 'Checkout',
        products: products,
        totalPrice: total.toFixed(2),
        sessionId: session.id
      });
    })
    .catch(err => {
      console.log(err);
      const error = new Error(err);
      error.httpStatusCode = 500;
      next(error);
    });
}; 

exports.postCartDeleteProduct = (req, res, next) => {
  const prodId = req.body.productId;
  req.user
    .delete_item(prodId)
    .then((result) => {
      res.redirect('/cart');
    })
    .catch(err => {
      console.log(err);
      const error = new Error(err);
      error.httpStatusCode = 500;
      next(error);
    });
};

exports.getCheckoutSuccess = (req, res, next) => {
  req.user
    .populate('cart.item.prodId')
    .execPopulate()     //populate can't give a callback function, so use execPopulate
    .then((user) => {
      // console.log('User data:');
      // console.log(user.cart.item);
      const order_arr = user.cart.item.map((ech_obj) => {
        return {
          product: { ...ech_obj.prodId._doc },  // ._doc => useful data
          quantity: ech_obj.quantity
        };
      });

      const order = new Order({
        products: order_arr,
        user: {
          email: req.user.email,
          userId: req.user
        }
      });
      return order.save();
    })
    .then((result) => {
      req.user.clear_cart();
      res.redirect('/orders');
    })
    .catch(err => {
      console.log(err);
      const error = new Error(err);
      error.httpStatusCode = 500;
      next(error);
    });
};

exports.getOrders = (req, res, next) => {
  Order.find({ 'user.userId': req.user._id })
    .then(orders => {   //orders->collection
      res.render('shop/orders', {
        path: '/orders',
        pageTitle: 'Your Orders',
        orders: orders
      });
    })
    .catch(err => {
      console.log(err);
      const error = new Error(err);
      error.httpStatusCode = 500;
      next(error);
    });
};

// make invoice downloadable
exports.getInvoice = (req, res, next) => {
  const orderId = req.params.orderId;
  Order.findById(orderId)
    .then((order) => {
      if (!order) {
        return next(new Error("Order not exist."));
      }
      if (order.user.userId.toString() !== req.user._id.toString()) {
        return next(new Error("unauthorized access"));
      }

      const invoiceName = 'invoice-' + orderId + '.pdf';
      const invoicePath = path.join('data', 'invoice', invoiceName);

      const invoicePdf = new pdfDoc();
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `inline; filename="${invoiceName}"`);
      invoicePdf.pipe(fs.createWriteStream(invoicePath));
      invoicePdf.pipe(res);
      invoicePdf
        .font('Times-Bold')
        .fontSize(35)
        .text('PURCHASE INVOICE', {
          underline: true
        });
      invoicePdf
        .font('Times-Roman')
        .fontSize(14)
        .text(`Email: ${order.user.email}`);
      invoicePdf.text('__________________________________________________');
      invoicePdf.text('Product Name   ->    Quantity      Price');
      let total=0;
      order.products.forEach(elem => {
        total+=elem.quantity*elem.product.price;
        invoicePdf.text(`${elem.product.title}                 ->  ${elem.quantity}        x           ${elem.product.price}`);
      });
      invoicePdf.text('__________________________________________________');
      invoicePdf.text(`Total Price:                                $ ${total}`);
      // invoicePdf.text("Hello Shivam!");
      invoicePdf.end();

      // // // creating a stream flow from file to res
      // const file=fs.createReadStream(invoicePath);        
      // res.setHeader('Content-Type', 'application/pdf');
      // res.setHeader('Content-Disposition', `attachment; filename="${invoiceName}"`);
      // file.pipe(res);

      // // downloading static files
      // fs.readFile(invoicePath, (err, data) => {
      //   if(err){
      //     return next(err);
      //   }

      //   // works well in firefox not in chrome
      //   res.setHeader('Content-Type', 'application/pdf');
      //   res.setHeader('Content-Disposition', `attachment; filename="${invoiceName}"`);
      //   res.send(data);
      // })
    }).catch(err => {
      console.log(err);
      const error = new Error(err);
      error.httpStatusCode = 500;
      next(error);
    });
};