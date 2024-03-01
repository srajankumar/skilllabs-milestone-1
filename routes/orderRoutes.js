const express = require("express");
const router = express.Router();
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const cron = require("node-cron");
const Order = require("../models/order");

cron.schedule("*/20 * * * *", async () => {
  try {
    const twentyMinutesAgo = new Date(Date.now() - 20 * 60 * 1000);
    const ordersToCancel = await Order.find({
      status: "pending",
      createdAt: { $lte: twentyMinutesAgo },
    });

    await Promise.all(
      ordersToCancel.map(async (order) => {
        order.status = "canceled";
        await order.save();
      })
    );

    console.log("Canceled orders:", ordersToCancel);
  } catch (error) {
    console.error("Error canceling orders:", error);
  }
});

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
      status: "pending",
    });
    await order.save();

    res.json({ clientSecret: paymentIntent.client_secret, orderId: order._id });
  } catch (err) {
    console.error("Error creating order and payment intent:", err);
    res
      .status(500)
      .json({ error: "Failed to create order and payment intent" });
  }
});

module.exports = router;
