const mongoose = require('mongoose');

const productSchema = mongoose.Schema({
    imagePath: {type: String, required: true},
    title: {type: String, required: true},
    price: {type: String, required: true},
    priceNum: {type: Number, required: true}
});

module.exports = new mongoose.model('Product', productSchema);
