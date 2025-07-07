const express = require("express");
const mongoSanitize = require("express-mongo-sanitize");
const productRoutes=require('./routes/ProductRoutes')
const orderRoutes=require('./routes/OrderRoutes')
const ratingRoutes=require('./routes/RatingRoutes')
const cookieParser = require("cookie-parser");
const UserRoutes=require('./routes/UserRoutes')
const categoryRoutes=require('./routes/categoryRoutes')
const path = require('path'); 
require('dotenv').config() 

const logger = require('./middlewares/logger');
const printerSettingRoutes = require('./routes/printerSettingRoutes');


 module.exports = async (app) => {
  


  

  app.use(mongoSanitize()); 
  app.use(express.json());
   app.use(cookieParser());
  app.use(express.urlencoded({ extended: true }));
  app.use(express.static(path.join(__dirname, 'build')));


  app.use("/uploads", express.static("uploads"));
  app.use((req, res, next) => {
    logger.info(`Incoming request: ${req.method} ${req.url}`);
    next();
  });
  app.use('/product',productRoutes)
  app.use('/order',orderRoutes)
  app.use('/user',UserRoutes)
  app.use('/ratings', ratingRoutes);
  app.use('/category', categoryRoutes);
  app.use('/printer-settings', printerSettingRoutes);


  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'build', 'index.html'));
  });
  app.get('/order', (req, res) => {
    res.sendFile(path.join(__dirname, 'build', 'index.html'));
  });
};
