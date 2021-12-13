const Product = require("../models/product");
const mongoose = require("mongoose");
mongoose.connect("mongodb://localhost:27017/shoppingDB");

const products = [
  new Product({
    imagePath: "https://assets.shop.loblaws.ca/products/20175355001/b1/en/front/20175355001_front_a01_@2.png",
    title:  "Bananas, Bunch",
    price: "$1.45 (est.) ea",
    priceNum: 1.45
  }),

  new Product({
    imagePath: "https://assets.shop.loblaws.ca/products/20070132001/b1/en/front/20070132001_front_a01_@2.png",
    title:  "English Cucumber",
    price: "$2.49 ea",
    priceNum: 2.49
  }),

  new Product({
    imagePath: "https://assets.shop.loblaws.ca/products/20107500001/b1/en/front/20107500001_front_a01_@2.png",
    title:  "Green Onion",
    price: "$1.45 (est.) ea",
    priceNum: 1.45
  }),

  new Product({
    imagePath: "https://assets.shop.loblaws.ca/products/20026703001/b1/en/front/20026703001_front_a01_@2.png",
    title: "Tomato on the Vine Red" ,
    price: "$3.90 (est.) ea",
    priceNum: 3.90
  }),

  new Product({
    imagePath: "https://assets.shop.loblaws.ca/products/20049778001/b1/en/front/20049778001_front_a01_@2.png",
    title: "Strawberries 1LB" ,
    price: "$5.49 ea",
    priceNum: 5.49
  }),

  new Product({
    imagePath: "https://assets.shop.loblaws.ca/products/20028593001/b1/en/front/20028593001_front_a01_@2.png",
    title:  "Lemon",
    price: "$1.09 ea",
    priceNum: 1.09
  }),

  new Product({
    imagePath: "https://assets.shop.loblaws.ca/products/20142232001/b1/en/front/20142232001_front_a01_@2.png",
    title: "Avocados Bag" ,
    price: "$5.45 (est.) ea",
    priceNum: 5.45
  }),

  new Product({
    imagePath: "https://assets.shop.loblaws.ca/products/20811994001/b1/en/front/20811994001_front_a01_@2.png",
    title:  "Yellow Onions",
    price: "$2.49 ea",
    priceNum: 2.49
  }),

  new Product({
    imagePath: "https://assets.shop.loblaws.ca/products/20152465001/b1/en/front/20152465001_front_a01_@2.png",
    title: "Blueberries" ,
    price: "$3.99 (est.) ea",
    priceNum: 3.99
  }),

  new Product({
    imagePath: "https://assets.shop.loblaws.ca/products/20127708001/b1/en/front/20127708001_front_a01_@2.png",
    title:  "Sweet Potato",
    price: "$2.49 (est.) ea",
    priceNum: 2.49
  })

];

let done = 0;
for(let i = 0; i<products.length; i++) {
  products[i].save(function(err, res) {
    done++;
    if (done === products.length) {
      exit();
    }
  });
}

function exit() {
  mongoose.disconnect();
}
