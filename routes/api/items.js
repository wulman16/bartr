const express = require(`express`);
const router = express.Router();
const { check, validationResult } = require(`express-validator`);
const auth = require(`../../middleware/auth`);
const User = require(`../../models/User`);
const Item = require(`../../models/Item`);

// @route     POST api/items
// @desc      Create a new item to swap
// @access    Private
router.post(
  `/`,
  [
    auth,
    [
      check(`name`, `Name is required!`)
        .not()
        .isEmpty(),
      check(`description`, `Description is required!`)
        .not()
        .isEmpty(),
      check(`category`, `Category is required!`)
        .not()
        .isEmpty()
    ]
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      // const user = await User.findById(req.user.id).select(`-password`);
      const newItem = await new Item({
        user: req.user.id,
        name: req.body.name,
        description: req.body.description,
        category: req.body.category
      });

      const item = await newItem.save();
      res.json(item);
    } catch (e) {
      console.error(e.message);
      res.status(500).send(`Server error!`);
    }
  }
);

module.exports = router;
