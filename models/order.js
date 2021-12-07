const mongoose=require('mongoose');

const order_schema = new mongoose.Schema({
  products: [{
    product: {
        type: Object,
        required: true
    },
    quantity: {
        type: Number,
        required: true
    }
  }],
  user: {
      email:{
        type: String,
        required: true
      },
      userId:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
      }
  }
});

module.exports= mongoose.model('Order', order_schema);