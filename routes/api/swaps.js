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
      // Check that item2 is owned by logged-in user
      const item1 = await Item.findById(req.body.item1);
      const item2 = await Item.findById(req.body.item2);
      if (item2.user.toString() !== req.user.id) {
        return res
          .status(400)
          .json({ msg: `Item 2 does not belong to current user!` });
      }

      // Check for items already in a pending swap
      const swaps = [];
      swaps.push(await Swap.find({ item1: req.body.item1 }));
      swaps.push(await Swap.find({ item2: req.body.item1 }));
      swaps.push(await Swap.find({ item1: req.body.item2 }));
      swaps.push(await Swap.find({ item2: req.body.item2 }));
      for (let swap of swaps) {
        if (swap.length) {
          return res
            .status(400)
            .json({ msg: `Cannot swap items already in a pending swap!` });
        }
      }

      const newSwap = await new Swap({
        item1: req.body.item1,
        item2: req.body.item2,
        item1User: item1.user,
        item2User: item2.user
      });

      const swap = await newSwap.save();
      res.json(swap);
    } catch (e) {
      console.error(e.message);
      res.status(500).send(`Server error!`);
    }
  }
);

// @route     GET api/swaps
// @desc      Get your swap history
// @access    Private
router.get(`/`, auth, async (req, res) => {
  try {
    let swaps = await Swap.find().sort({ date: -1 });
    swaps = swaps.filter(
      swap =>
        swap.item1User.toString() === req.user.id ||
        swap.item2User.toString() === req.user.id
    );
    res.json(swaps);
  } catch (e) {
    console.error(e.message);
    res.status(500).send(`Server error!`);
  }
});

module.exports = router;
