const path = require("path");

// Use the existing order data
const orders = require(path.resolve("src/data/orders-data"));

// Use this function to assigh ID's when necessary
const nextId = require("../utils/nextId");

// TODO: Implement the /orders handlers needed to make the tests pass

function errorMessage(type, dishes = false) {
  const message = `Order must include ${
    dishes ? "at least one dish" : `a ${type}`
  }`;
  return message;
}

function hasData(req, res, next) {
  const { data: { id, deliverTo, mobileNumber, status, dishes } = {} } =
    req.body;
  if (!deliverTo || deliverTo.length === 0) {
    next({ status: 400, message: errorMessage("deliverTo") });
  }
  if (!mobileNumber || mobileNumber.length === 0) {
    next({ status: 400, message: errorMessage("mobileNumber") });
  }
  if (!dishes) {
    next({ status: 400, message: errorMessage("dishes") });
  }
  if (!Array.isArray(dishes) || dishes.length === 0) {
    next({ status: 400, message: errorMessage("dishes", true) });
  }
  dishes.forEach((dish, index) => {
    if (
      !dish.quantity ||
      dish.quantity <= 0 ||
      !Number.isInteger(dish.quantity)
    ) {
      next({
        status: 400,
        message: `Dish ${index} must have a quantity that is an integer greater than 0`,
      });
    }
  });

  res.locals.values = { deliverTo, mobileNumber, status, dishes };
  if (id) {
    res.locals.values.id = id;
  }
  next();
}

function orderExists(req, res, next) {
  const orderId = req.params.orderId;
  const foundOrder = orders.find((order) => order.id === orderId);
  if (foundOrder) {
    res.locals.orderId = orderId;
    res.locals.order = foundOrder;
    return next();
  }
  next({ status: 404, message: `Order does not exist: ${orderId}.` });
}

function create(req, res) {
  const { deliverTo, mobileNumber, dishes } = res.locals.values;
  newOrder = { id: nextId(), deliverTo, mobileNumber, dishes };
  orders.push(newOrder);
  res.status(201).json({ data: newOrder });
}

function read(req, res) {
  res.json({ data: res.locals.order });
}

function update(req, res, next) {
  const { id, deliverTo, mobileNumber, status, dishes } = res.locals.values;
  const orderId = res.locals.orderId;
  let order = res.locals.order;
  const statuses = ["pending", "preparing", "out-for-delivery"];
  order = { ...order, deliverTo, mobileNumber, dishes };
  if (id && id !== orderId) {
    next({
      status: 400,
      message: `Order id does not match route id. Order: ${id}, Route: ${orderId}`,
    });
  }
  if (!status || status.length === 0 || !statuses.includes(status)) {
    next({
      status: 400,
      message:
        status === "delivered"
          ? "A delivered order cannot be changed"
          : "Order must have a status of pending, preparing, out-for-delivery, delivered",
    });
  }
  res.json({ data: order });
}

function destroy(req, res, next) {
  if (res.locals.order.status !== "pending") {
    next({
      status: 400,
      message: "An order cannot be deleted unless it is pending",
    });
  }
  const index = orders.findIndex((order) => order.id === res.locals.orderId);
  if (index > -1) {
    orders.splice(index, 1);
  }
  res.sendStatus(204);
}

function list(req, res, next) {
  res.json({ data: orders });
}

module.exports = {
  create: [hasData, create],
  read: [orderExists, read],
  update: [orderExists, hasData, update],
  delete: [orderExists, destroy],
  list,
};
