const mongoose=require("mongoose");

const user_schema=new mongoose.Schema({
  email:{
    type: String,
    required: true
  },

  // for password reset
  resetToken: String,
  tokenExp: Date,

  password:{
    type: String,
    required: true
  },

  cart:{    //object of array of object
    item: [{
      prodId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true
      },

      quantity: {
        type: Number,
        required: true
      }
    }]
  }

});

user_schema.methods.add_to_cart = function(one_prod){
  // console.log(this);
  const cart_item=[...this.cart.item];
  const product_index=cart_item.findIndex((ech) => {
    return ech.prodId.toString() === one_prod._id.toString();   //why type change
  });
  // console.log('product_inex ', product_index);

  if(product_index>=0){
    cart_item[product_index].quantity++;
  }else{
    cart_item.push({
      prodId: one_prod._id,
      quantity: 1
    });
  }

  const updated_cart={
    item: cart_item
  };

  this.cart=updated_cart;   //object copy(by value)  array copy(by reference)
  return this.save();
};

user_schema.methods.delete_item = function(one_prod){
  var updated_item = this.cart.item.filter((ech) => {
    return one_prod.toString() !== ech.prodId.toString();
  });

  // this.cart.item=updated_item;   
  const updated_cart={
    item: updated_item
  };
  this.cart=updated_cart;

  return this.save();
};

user_schema.methods.clear_cart= function(){
  const updated_cart={
    item: []
  };

  this.cart=updated_cart;
  return this.save();
};

module.exports=mongoose.model('User', user_schema);

