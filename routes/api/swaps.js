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
      const swaps = await Swap.find({ pending: true });
      for (let swap of swaps) {
        if (
          swap.item1.toString() === req.body.item1 ||
          swap.item2.toString() === req.body.item1 ||
          swap.item1.toString() === req.body.item2 ||
          swap.item1.toString() === req.body.item2
        ) {
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

// @route     PATCH api/swaps/:id
// @desc      Accept or reject a swap by id
// @access    Private
router.patch(`/:id`, auth, async (req, res) => {
  const updates = Object.keys(req.body);
  const allowedUpdates = [`approved`, `rejected`];
  const isValidOperation = updates.every(update => {
    return allowedUpdates.includes(update);
  });

  if (!isValidOperation) {
    return res.status(400).json({ msg: `Invalid updates!` });
  }

  if (updates.length > 1) {
    return res
      .status(400)
      .json({ msg: `Cannot accept and reject the same swap!` });
  }

  try {
    const swap = await Swap.findById(req.params.id);
    if (!swap) {
      return res.status(404).json({ msg: `Item not found!` });
    }
    if (swap.item1User.toString() !== req.user.id) {
      return res.status(401).json({ msg: `User not authorized!` });
    }
    if (!swap.pending) {
      return res.status(401).json({ msg: `Swap is already closed!` });
    }
    updates.forEach(update => (swap[update] = req.body[update]));
    if (swap.approved) {
      const item1User = swap.item1User;
      swap.item1User = swap.item2User;
      swap.item2User = item1User;
    }
    swap.pending = false;
    await swap.save();
    res.json(swap);
  } catch (e) {
    console.error(e.message);
    if (e.kind === `ObjectId`) {
      return res.status(404).json({ msg: `Swap not found!` });
    }
    res.status(500).send(`Server error!`);
  }
});

// @route     DELETE api/swaps/:id
// @desc      Cancel a swap that logged-in user initiated
// @access    Private
router.delete(`/:id`, auth, async (req, res) => {
  try {
    const swap = await Swap.findById(req.params.id);
    if (!swap) {
      return res.status(404).json({ msg: `Item not found!` });
    }

    if (!swap.pending) {
      return res.status(401).json({ msg: `Cannot delete completed swap!` });
    }

    if (swap.item2User.toString() !== req.user.id) {
      return res.status(401).json({ msg: `User not authorized` });
    }

    await swap.remove();
    res.json({ msg: `Swap removed!` });
  } catch (e) {
    console.error(e.message);
    if (e.kind === `ObjectId`) {
      return res.status(404).json({ msg: `Swap not found!` });
    }
    res.status(500).send(`Server error!`);
  }
});

module.exports = router;
