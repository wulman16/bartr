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
      const user = await User.findById(req.user.id).select(`-password`);
      const newItem = await new Item({
        user: req.user.id,
        name: req.body.name,
        description: req.body.description,
        category: req.body.category,
        location: user.location,
        ownerName: user.name
      });

      const item = await newItem.save();
      res.json(item);
    } catch (e) {
      console.error(e.message);
      res.status(500).send(`Server error!`);
    }
  }
);

// @route     GET api/items
// @desc      Get everyone else's items
// @access    Private
router.get(`/`, auth, async (req, res) => {
  try {
    let items = await Item.find().sort({ date: -1 });
    items = items.filter(item => item.user.toString() !== req.user.id);
    res.json(items);
  } catch (e) {
    console.error(e.message);
    res.status(500).send(`Server error!`);
  }
});

// @route     GET api/items/:id
// @desc      Get item by id
// @access    Private
router.get(`/:id`, auth, async (req, res) => {
  try {
    const item = await Item.findById(req.params.id);
    if (!item) {
      return res.status(404).json({ msg: `Item not found!` });
    }

    res.json(item);
  } catch (e) {
    console.error(e.message);
    if (e.kind === `ObjectId`) {
      return res.status(404).json({ msg: `Item not found!` });
    }
    res.status(500).send(`Server error!`);
  }
});

// @route     PATCH api/items/:id
// @desc      Update your own item by id
// @access    Private
router.patch(`/:id`, auth, async (req, res) => {
  const updates = Object.keys(req.body);
  const allowedUpdates = [`name`, `description`, `category`];
  const isValidOperation = updates.every(update => {
    return allowedUpdates.includes(update);
  });

  if (!isValidOperation) {
    return res.status(400).json({ msg: `Invalid updates!` });
  }

  try {
    const item = await Item.findById(req.params.id);
    if (!item) {
      return res.status(404).json({ msg: `Item not found!` });
    }
    if (item.user.toString() !== req.user.id) {
      return res.status(401).json({ msg: `User not authorized!` });
    }
    updates.forEach(update => (item[update] = req.body[update]));
    await item.save();
    res.json(item);
  } catch (e) {
    console.error(e.message);
    if (e.kind === `ObjectId`) {
      return res.status(404).json({ msg: `Item not found!` });
    }
    res.status(500).send(`Server error!`);
  }
});

// @route     DELETE api/items/:id
// @desc      Delete item by id
// @access    Private
router.delete(`/:id`, auth, async (req, res) => {
  try {
    const item = await Item.findById(req.params.id);
    if (!item) {
      return res.status(404).json({ msg: `Item not found!` });
    }

    if (item.user.toString() !== req.user.id) {
      return res.status(401).json({ msg: `User not authorized` });
    }

    await item.remove();
    res.json({ msg: `Ìtem removed!` });
  } catch (e) {
    console.error(e.message);
    if (e.kind === `ObjectId`) {
      return res.status(404).json({ msg: `Item not found!` });
    }
    res.status(500).send(`Server error!`);
  }
});

module.exports = router;
