const { Mongoose } = require('mongoose');
const Product = require('../models/product');
const fileUtil = require('../util/file');

const ITEMS_PAGE = 2;

exports.getAddProduct = (req, res, next) => {
  res.render('admin/edit-product', {
    pageTitle: 'Add Product',
    path: '/admin/add-product',
    editing: false,
    errorMessage: ''
  });
};

exports.postAddProduct = (req, res, next) => {
  const title = req.body.title;
  const imageUrl = req.file;
  const price = req.body.price;
  const description = req.body.description;
  if(!imageUrl){
    return res.status(422).render('admin/edit-product', {
      pageTitle: 'Add Product',
      path: '/admin/add-product',
      editing: true,
      product: {
        title: title,
        price: price,
        description: description
      },
      errorMessage: 'Attached file is not an image!' 
    });
  }
  const product = new Product({
    title: title,
    price: price,
    imageUrl: imageUrl.path,
    description: description,
    user_id: req.user     //self extract ._id
  });
  console.log(imageUrl);


  product
    .save()
    .then(result => {
      // console.log(result);
      console.log('Created Product');
      res.redirect('/admin/products');
    })
    .catch(err => {
      console.log(err);
      const error= new Error(err);
      error.httpStatusCode=500;
      next(error);
    });
};

exports.getEditProduct = (req, res, next) => {
  const editMode = req.query.edit;
  if (!editMode) {
    return res.redirect('/');
  }
  const prodId = req.params.productId;
  Product.findById(prodId)
    .then(product => {
      if (!product) {
        return res.redirect('/');
      }
      res.render('admin/edit-product', {
        pageTitle: 'Edit Product',
        path: '/admin/edit-product',
        editing: editMode,
        product: product,
        errorMessage: '' 
      });
    })
    .catch(err => {
      console.log(err);
      const error= new Error(err);
      error.httpStatusCode=500;
      next(error);
    });
};

exports.postEditProduct = (req, res, next) => {
  const prodId = req.body.productId;
  const updatedTitle = req.body.title;
  const updatedPrice = req.body.price;
  const updatedImageUrl = req.file;
  const updatedDesc = req.body.description;
  
  Product.findById(prodId)
    .then(product => {
      if(product.user_id.toString() !== req.user._id.toString()){   //user authorisation
        return res.redirect('/');
      }
      product.title = updatedTitle;
      product.price = updatedPrice;
      product.description = updatedDesc;
      if(updatedImageUrl){
        fileUtil.fileDelete(product.imageUrl);
        product.imageUrl = updatedImageUrl.path;
      }
      return product.save()
      .then(result => {
        console.log('UPDATED PRODUCT!');
        res.redirect('/admin/products');
      });
    })
    .catch(err => {
      console.log(err);
      const error= new Error(err);
      error.httpStatusCode=500;
      next(error);
    });
};

// display page having edit and delete button
exports.getProducts = (req, res, next) => {
  let page=+req.query.page || 1;
  let totalItems=0;
  Product.find({user_id : req.user._id})          // authorized person to see
    .countDocuments()
    .then((prodCount) => {
      totalItems=prodCount;
      console.log(totalItems);
      return Product.find({user_id : req.user._id})
                    .skip((page-1)*ITEMS_PAGE)
                    .limit(ITEMS_PAGE);
    })
    .then(products => {
      res.render('admin/products', {
        prods: products,
        pageTitle: 'Admin Products',
        path: '/admin/products',
        hasNext: totalItems > page*ITEMS_PAGE,
        hasPrev: page > 1,
        page: page,
        lastPage: Math.ceil(totalItems/ITEMS_PAGE) 
      });
    })
    .catch(err => {
      console.log(err);
      const error= new Error(err);
      error.httpStatusCode=500;
      next(error);
    });
};

exports.postDeleteProduct = (req, res, next) => {
  const prodId = req.body.productId;
  Product.findById(prodId)
    .then((prod) => {
      fileUtil.fileDelete(prod.imageUrl);
      return Product.deleteOne({_id: prodId, user_id : req.user._id})    // user authorization
    })
    .then(result => {
      console.log('DESTROYED PRODUCT');
      res.redirect('/admin/products');
    })
    .catch(err => {
      console.log(err);
      const error= new Error(err);
      error.httpStatusCode=500;
      next(error);
    });
};
