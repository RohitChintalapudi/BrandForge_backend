const mongoose = require("mongoose");

/**
 * Middleware factory to validate MongoDB ObjectId in request params or body
 * @param {string[]} paramNames - List of param keys to check (e.g., ['id', 'campaignId'])
 */
const validateObjectId = (paramNames = ["id"]) => {
  return (req, res, next) => {
    for (const param of paramNames) {
      const id = req.params[param] || req.body[param];
      if (id && !mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({
          message: `Invalid ID format for parameter: ${param}`,
        });
      }
    }
    next();
  };
};

module.exports = validateObjectId;
