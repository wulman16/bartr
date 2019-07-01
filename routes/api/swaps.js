const express = require(`express`);
const router = express.Router();

// @route     GET api/swaps
// @desc      Test route
// @access    Public
router.get(`/`, (req, res) => {
  res.send(`Swaps route!`);
});

module.exports = router;
