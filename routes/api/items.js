const express = require(`express`);
const router = express.Router();

// @route     GET api/items
// @desc      Test route
// @access    Public
router.get(`/`, (req, res) => {
  res.send(`Items route!`);
});

module.exports = router;
