import { Request, Response, NextFunction } from "express";
import { redis, redisTTL } from "../app.js";
import { TryCatch } from "../middlewares/error.js";
import { Order } from "../models/order.js";
import { NewOrderRequestBody } from "../types/types.js";
import { invalidateCache, reduceStock } from "../utils/features.js";
import ErrorHandler from "../utils/utility-class.js";
import { ParamsDictionary } from "express-serve-static-core";
import { ParsedQs } from "qs";

// Custom request type
interface CustomRequest<Params = ParamsDictionary, Query = ParsedQs, Body = any> extends Request<Params, any, Body, Query> {}

// Middleware to fetch user orders
export const myOrders = TryCatch(async (req: CustomRequest<{ id: string }>, res: Response, next: NextFunction) => {
  const userId = req.query.id;
  if (!userId || typeof userId !== 'string') {
    return next(new ErrorHandler("Invalid user ID", 400));
  }

  const key = `my-orders-${userId}`;

  let orders = await redis.get(key);

  if (orders) {
    orders = JSON.parse(orders);
  } else {
    orders = await Order.find({ user: userId });
    await redis.setex(key, redisTTL, JSON.stringify(orders));
  }

  return res.status(200).json({
    success: true,
    orders,
  });
});

// Middleware to fetch all orders
export const allOrders = TryCatch(async (_req: Request, res: Response, next: NextFunction) => {
  const key = `all-orders`;

  let orders = await redis.get(key);

  if (orders) {
    orders = JSON.parse(orders);
  } else {
    orders = await Order.find().populate("user", "name");
    await redis.setex(key, redisTTL, JSON.stringify(orders));
  }

  return res.status(200).json({
    success: true,
    orders,
  });
});

// Middleware to fetch a single order
export const getSingleOrder = TryCatch(async (req: CustomRequest<{ id: string }>, res: Response, next: NextFunction) => {
  const { id } = req.params;
  if (!id) {
    return next(new ErrorHandler("Order ID is required", 400));
  }

  const key = `order-${id}`;

  let order = await redis.get(key);

  if (order) {
    order = JSON.parse(order);
  } else {
    order = await Order.findById(id).populate("user", "name");
    if (!order) return next(new ErrorHandler("Order not found", 404));

    await redis.setex(key, redisTTL, JSON.stringify(order));
  }

  return res.status(200).json({
    success: true,
    order,
  });
});

// Middleware to create a new order
export const newOrder = TryCatch(async (req: CustomRequest<{}, {}, NewOrderRequestBody>, res: Response, next: NextFunction) => {
  const { shippingInfo, orderItems, user, subtotal, tax, shippingCharges, discount, total } = req.body;

  if (!shippingInfo || !orderItems || !user || !subtotal || !tax || !total) {
    return next(new ErrorHandler("Please enter all required fields", 400));
  }

  const order = await Order.create({
    shippingInfo,
    orderItems,
    user,
    subtotal,
    tax,
    shippingCharges,
    discount,
    total,
  });

  await reduceStock(orderItems);
  await invalidateCache({
    product: true,
    order: true,
    admin: true,
    userId: user,
    productId: order.orderItems.map((i) => String(i.productId)),
  });

  return res.status(201).json({
    success: true,
    message: "Order placed successfully",
  });
});

// Middleware to process an order
export const processOrder = TryCatch(async (req: CustomRequest<{ id: string }>, res: Response, next: NextFunction) => {
  const { id } = req.params;
  if (!id) {
    return next(new ErrorHandler("Order ID is required", 400));
  }

  const order = await Order.findById(id);

  if (!order) return next(new ErrorHandler("Order not found", 404));

  switch (order.status) {
    case "Processing":
      order.status = "Shipped";
      break;
    case "Shipped":
      order.status = "Delivered";
      break;
    default:
      order.status = "Delivered";
      break;
  }

  await order.save();
  await invalidateCache({
    product: false,
    order: true,
    admin: true,
    userId: order.user,
    orderId: String(order._id),
  });

  return res.status(200).json({
    success: true,
    message: "Order processed successfully",
  });
});

// Middleware to delete an order
export const deleteOrder = TryCatch(async (req: CustomRequest<{ id: string }>, res: Response, next: NextFunction) => {
  const { id } = req.params;
  if (!id) {
    return next(new ErrorHandler("Order ID is required", 400));
  }

  const order = await Order.findById(id);

  if (!order) return next(new ErrorHandler("Order not found", 404));

  await order.deleteOne();
  await invalidateCache({
    product: false,
    order: true,
    admin: true,
    userId: order.user,
    orderId: String(order._id),
  });

  return res.status(200).json({
    success: true,
    message: "Order deleted successfully",
  });
});
