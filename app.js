const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const ejs = require("ejs");
const session = require('express-session');
const passport = require('passport');
const passportLocalMongoose = require("passport-local-mongoose");
const MongoStore = require('connect-mongo');
const Product = require(__dirname + '/models/product.js');
const Cart = require(__dirname + "/models/cart.js");
require("dotenv").config()
const Order = require(__dirname + "/models/order.js");
const endpointSecret = "whsec_6umTtXGDYVJFQeu6kur8Lhofl4Wh2O8z";
const stripe = require("stripe")(process.env.STRIPE_PRIVATE_KEY);
//const stripe = require("stripe")("sk_test_51K4wE1DNG19kYQKM1s2sRuQJYC4n0VJe8j5WCyx5kzVGS4YXanLswGPUhiUBiTuGjx2wFpoGo1S2NBIttOHPfQDK00aP33wcVJ");
const app = express();
let orderInf = {};

app.use(express.static("public"));
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(
  bodyParser.json({
    verify: (req, res, buf) => {
      const url = req.originalUrl;
      if (url.startsWith('/api/stripe/webhook')) {
        req.rawBody = buf.toString();
      }
    }
  })
);
app.use(express.json());
app.use(bodyParser.json());
app.use(session({
  secret: "our little secret",
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({
    mongoUrl: 'mongodb://localhost:27017/shopping',
    ttl: 180 * 60 * 1000
  })
}));

app.use(function(req, res, next) {
  //res.locals.login = req.isAuthenticated();
  res.locals.session = req.session;
  res.locals.session.cart = new Cart(req.session.cart ? req.session.cart : {
    items: {}
  });
  next();
});

app.use(passport.initialize());
app.use(passport.session());

mongoose.connect("mongodb://localhost:27017/shoppingDB");
const User = require(__dirname + '/models/user.js');

passport.use(User.createStrategy());

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.get("/", function(req, res) {

  res.render("home", {
    isLoggedIn: req.isAuthenticated()
  });

});

app.get("/account", (req, res) => {
  Order.find({
    user: req.user
  }, (err, orders) => {
    if(err) {
      console.log(err);
    } else {
      let cart;
      orders.forEach((order) => {
        cart = new Cart(order.cart);
        order.items = cart.generateArray();
        console.log(order.items);
      });

      res.render("account", {
        isLoggedIn: req.isAuthenticated(),
        orders: orders
      });
    }
  });

})

app.get("/items", function(req, res) {
  if (req.isAuthenticated()) {
    const products = Product.find((err, products) => {
      //console.log(products);
      res.render("items", {
        isLoggedIn: req.isAuthenticated(),
        products: products
      });
    });

  } else {
    res.redirect("/login");
  }
});

app.get("/login", function(req, res) {
  res.render("login", {
    isLoggedIn: req.isAuthenticated()
  });
});

app.post("/login", (req, res) => {
  const user = new User({
    username: req.body.username,
    password: req.body.password
  });

  req.login(user, function(err) {
    if (err) {
      console.log(err);
    } else {
      passport.authenticate("local")(req, res, function() {
        res.redirect("items");
      })
    }
  })
});

app.get("/register", function(req, res) {
  res.render("register", {
    isLoggedIn: req.isAuthenticated()
  });
});

app.post("/register", function(req, res) {
  User.register({
    username: req.body.username
  }, req.body.password, function(err, user) {
    if (err) {
      console.log(err);
      res.redirect("/register");
    } else {
      passport.authenticate("local")(req, res, function() {
        res.redirect("/items")
      });
    }
  });
});

app.get("/logout", (req, res) => {
  req.logout();
  res.redirect("/");
});

app.get("/add-to-cart/:id", (req, res) => {
  const productId = req.params.id;
  let cart = new Cart(req.session.cart);

  Product.findById(productId, function(err, product) {
    if (err) {
      console.log("error");
      return res.redirect("/");
    }
    //console.log(product);
    cart.add(product, productId);
    req.session.cart = cart;
    //console.log(req.session.cart);
    res.redirect('/items');
  });
});

app.get("/reduce/:id", (req, res) => {
  const productId = req.params.id;
  let cart = new Cart(req.session.cart);

  cart.reduceByOne(productId);
  req.session.cart = cart;

  res.redirect("/shopping-cart");
});

app.get("/remove/:id", (req, res) => {
  const productId = req.params.id;
  let cart = new Cart(req.session.cart);

  cart.removeItem(productId);
  req.session.cart = cart;

  res.redirect("/shopping-cart");
});

app.get('/shopping-cart', function(req, res, next) {
  if (req.session.cart.generateArray().length === 0) {
    return res.render('shopping-cart', {
      products: null,
      isLoggedIn: req.isAuthenticated()
    });
  }

  const cart = new Cart(req.session.cart);
  //console.log(cart.generateArray());
  res.render('shopping-cart', {
    products: cart.generateArray(),
    totalPrice: cart.totalPrice,
    isLoggedIn: req.isAuthenticated()
  });
});

///////////////////////////////CHECKOUT/////////////////////////////////////
app.get("/success", (req, res) => {
  const cart = req.session.cart;
  const order = new Order({
    paymentId: orderInf.id,
    address: orderInf.shipping.address.line1,
    name: orderInf.shipping.name,
    user: req.user,
    cart: cart
  });
  console.log(order);
  order.save();
  // Order.findOne();
  req.session.cart = new Cart({
    items: {}
  });
  res.render("success", {
    isLoggedIn: req.isAuthenticated()
  });
});

app.post('/create-checkout-session', async (req, res) => {
  const cart = new Cart(req.session.cart);
  const products = cart.generateArray();
  try {
    const session = await stripe.checkout.sessions.create({
      customer_email: req.user.username,
      billing_address_collection: 'auto',
      shipping_address_collection: {
        allowed_countries: ['US', 'CA'],
      },
      line_items: products.map(product => {
        const storeItem = product.item;
        return {
          price_data: {
            currency: "usd",
            product_data: {
              name: storeItem.title,
            },
            unit_amount: Math.floor(storeItem.priceNum * 100),
          },
          quantity: product.qty,
        }
      }),
      mode: 'payment',
      success_url: 'http://localhost:3000/success',
      cancel_url: `http://localhost:3000/shopping-cart`,
    });

    res.redirect(303, session.url);
  } catch (e) {
    res.status(500).json({
      error: e.message
    })
  }

});

const fulfillOrder = (orderDetail) => {
  // const order = new Order({
  //   paymentId: orderDetail.id,
  //   address: orderDetail.shipping.address.line1,
  //   name: orderDetail.shipping.name
  // });
  // order.save();
  console.log("Fulfilling order", orderDetail);
}

app.post('/webhook',
  bodyParser.raw({
    type: 'application/json'
  }),
  async (req, res) => {
    const payload = req.body
    const sig = req.headers['stripe-signature']
    const payloadString = JSON.stringify(payload, null, 2);
    const secret = 'webhook_secret';
    const header = stripe.webhooks.generateTestHeaderString({
      payload: payloadString,
      secret,
    });

    let event;
    try {
      event = stripe.webhooks.constructEvent(payloadString, header, secret);
      //console.log(event);
      // console.log(event.data.object.customer_details);
      // console.log(event.data.object.shipping);
    } catch (err) {
      //console.log(`Webhook Error: ${err.message}`)
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    if (event.type === 'checkout.session.completed') {
      const orderDetail = event.data.object;
      orderInf = orderDetail;
      // Fulfill the purchase...
      fulfillOrder(orderDetail);
    }

    res.sendStatus(200);
  });

let port = process.env.PORT;
if (port == null || port == "") {
  port = 3000;
}

app.listen(port, function() {
  console.log("Server has started succesfully");
});
