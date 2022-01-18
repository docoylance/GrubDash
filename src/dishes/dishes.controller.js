const path = require("path");

// Use the existing dishes data
const dishes = require(path.resolve("src/data/dishes-data"));

// Use this function to assign ID's when necessary
const nextId = require("../utils/nextId");

// TODO: Implement the /dishes handlers needed to make the tests pass

function errorMessage(type, price = false) {
  const message = `Dish must ${price ? "have" : "include"} a ${
    price ? "price that is an integer greater than 0" : type
  }`;
  return message;
}

function hasData(req, res, next) {
  const { data: { id, name, description, price, image_url } = {} } = req.body;
  if (!name || name.length === 0) {
    next({ status: 400, message: errorMessage("name") });
  }
  if (!description || description.length === 0) {
    next({ status: 400, message: errorMessage("description") });
  }
  if (!price) {
    next({ status: 400, message: errorMessage("price") });
  }
  if (isNaN(price) || Number(price) <= 0 || !Number.isInteger(price)) {
    next({ status: 400, message: errorMessage("price", true) });
  }
  if (!image_url || image_url.length === 0) {
    next({ status: 400, message: errorMessage("image_url") });
  }
  
  if (id) {
    res.locals.id = id;
  }
  res.locals.name = name;
  res.locals.description = description;
  res.locals.price = price;
  res.locals.image_url = image_url;
  next();
}

function dishExists(req, res, next) {
  const dishId = req.params.dishId;
  const foundDish = dishes.find((dish) => dish.id === dishId);
  if (foundDish) {
    res.locals.dishId = dishId;
    res.locals.dish = foundDish;
    return next();
  }
  next({ status: 404, message: `Dish does not exist: ${dishId}.` });
}

function create(req, res) {
  const { name, description, price, image_url } = res.locals;
  newDish = { id: nextId(), name, description, price, image_url };
  dishes.push(newDish);
  res.status(201).json({ data: newDish });
}

function read(req, res) {
  res.json({ data: res.locals.dish });
}

function update(req, res, next) {
  const { id, name, description, price, image_url, dish, dishId } = res.locals;
  dish.name = name;
  dish.description = description;
  dish.price = price;
  dish.image_url = image_url;
  if (id && id !== dishId) {
    next({
      status: 400,
      message: `Dish id does not match route id. Dish: ${id}, Route: ${dishId}`,
    });
  }
  res.json({ data: dish });
}

function list(req, res) {
  res.json({ data: dishes });
}

module.exports = {
  create: [hasData, create],
  read: [dishExists, read],
  update: [dishExists, hasData, update],
  list,
};
