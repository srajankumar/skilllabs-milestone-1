const express = require("express");
const router = express.Router();
const orderController = require("../controller/orderController");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const Order = require("../models/order");
router.post("/placeorder", orderController.placeOrder);
router.post("/feedback/:orderId", orderController.submitFeedback);

router.post("/order", async (req, res) => {
  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: req.body.amount,
      currency: "usd",
    });

    const order = new Order({
      userId: req.body.userId,
      items: req.body.items,
      amount: req.body.amount,
    });
    await order.save();

    res.json({ clientSecret: paymentIntent.client_secret });
  } catch (err) {
    console.error("Error creating payment intent:", err);
    res.status(500).json({ error: "Failed to create payment intent" });
  }
});

module.exports = router;
