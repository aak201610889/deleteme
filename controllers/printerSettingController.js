// controllers/printerSettingController.js
const PrinterSetting = require('../models/PrinterSetting');
const logger=require("../middlewares/logger")

const getPrinterSetting = async (req, res) => {
  try {
    logger.info('Fetching printer setting');
    const setting = await PrinterSetting.findOne();
    if (!setting) {
      logger.warn('No printer setting found');
      return res.status(404).json({ message: 'No printer setting found.' });
    }
    logger.info('Printer setting fetched successfully', { setting });

    res.json(setting);
  } catch (error) {
    logger.error('Error fetching printer setting', { error: error.message });

    console.error('Error fetching printer setting:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};


const savePrinterSetting = async (req, res) => {
  const { interface, type } = req.body;

  if (!interface || !type) {
    logger.warn('Interface and type are required for printer setting', { interface, type });

    return res.status(400).json({ message: 'Interface and type are required.' });
  }

  try {
    // Check if a setting exists
    const existingSetting = await PrinterSetting.findOne();
    logger.info('Updating existing printer setting', { interface, type });

    if (existingSetting) {
      // Update existing setting
      existingSetting.interface = interface;
      existingSetting.type = type;
      await existingSetting.save();
      logger.info('Printer setting updated successfully', { setting: existingSetting });

      return res.json({ message: 'Printer setting updated successfully.', setting: existingSetting });
    }
    logger.info('Creating new printer setting', { interface, type });

    // Create a new setting
    const newSetting = new PrinterSetting({ interface, type });
    await newSetting.save();
    logger.info('Printer setting created successfully', { setting: newSetting });

    res.json({ message: 'Printer setting created successfully.', setting: newSetting });
  } catch (error) {
    console.error('Error saving printer setting:', error);
    logger.error('Error saving printer setting', { error: error.message });

    res.status(500).json({ message: 'Internal server error.' });
  }
};

module.exports = { getPrinterSetting, savePrinterSetting };
