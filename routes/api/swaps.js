const express = require(`express`);
const router = express.Router();
const { check, validationResult } = require(`express-validator`);
const auth = require(`../../middleware/auth`);
const Swap = require(`../../models/Swap`);
const Item = require(`../../models/Item`);

// @route     POST api/swaps
// @desc      Propose a new swap
// @access    Private
router.post(
  `/`,
  [
    auth,
    [
      check(`item1`, `First item is required!`)
        .not()
        .isEmpty(),
      check(`item2`, `Second item is required!`)
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
      const item2 = await Item.findById(req.body.item2);
      if (item2.user.toString() !== req.user.id) {
        return res
          .status(400)
          .json({ msg: `Item 2 does not belong to current user!` });
      }
      const newSwap = await new Swap({
        item1: req.body.item1,
        item2: req.body.item2
      });

      const swap = await newSwap.save();
      res.json(swap);
    } catch (e) {
      console.error(e.message);
      res.status(500).send(`Server error!`);
    }
  }
);

module.exports = router;
