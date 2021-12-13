const mongoose = require('mongoose');

const orderSchema = mongoose.Schema({
    user: {type: mongoose.Schema.Types.ObjectId, ref: "User"},
    cart: {type: Object},
    address: {type: String},
    name: {type: String},
    paymentId: {type: String}
});

module.exports = new mongoose.model('Order', orderSchema);
