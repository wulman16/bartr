const express = require(`express`);
const router = express.Router();
const auth = require(`../../middleware/auth`);
const gravatar = require(`gravatar`);
const bcrypt = require(`bcryptjs`);
const jwt = require(`jsonwebtoken`);
const config = require(`config`);
const { check, validationResult } = require(`express-validator`);
const User = require(`../../models/User`);
const Item = require(`../../models/Item`);

// @route     POST api/users
// @desc      Register user
// @access    Public
router.post(
  `/`,
  [
    check(`name`, `Name is required`)
      .not()
      .isEmpty(),
    check(`email`, `Please include a valid email address`).isEmail(),
    check(
      `password`,
      `Please enter a password with 6 or more characters`
    ).isLength({ min: 6 }),
    check(`location`, `Location is required`)
      .not()
      .isEmpty()
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, email, password, location } = req.body;

    try {
      let user = await User.findOne({ email });

      if (user) {
        return res
          .status(400)
          .json({ errors: [{ msg: `User already exists!` }] });
      }

      const avatar = gravatar.url(email, {
        s: `200`,
        r: `pg`,
        d: `mm`
      });

      user = new User({
        name,
        email,
        avatar,
        password,
        location
      });

      const salt = await bcrypt.genSalt(10);

      user.password = await bcrypt.hash(password, salt);

      await user.save();

      const payload = {
        user: {
          id: user.id
        }
      };

      jwt.sign(
        payload,
        config.get(`jwtSecret`),
        // TODO: Change expiration to 3600 seconds for production
        { expiresIn: 360000 },
        (error, token) => {
          if (error) throw error;
          res.json({ token });
        }
      );
    } catch (e) {
      console.error(e.message);
      res.status(500).send(`Server error!`);
    }
  }
);

// @route     GET api/users/me
// @desc      Get current user's profile
// @access    Private
router.get(`/me`, auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select(`-password`);
    if (!user) {
      return res.status(400).json({ msg: `User cannot be found!` });
    }
    const items = await Item.find({ user: req.user.id });
    res.json([user, items]);
  } catch (e) {
    console.error(e.message);
    res.status(500).send(`Server error!`);
  }
});

// @route     GET api/users
// @desc      Get all profiles
// @access    Public
router.get(`/`, auth, async (req, res) => {
  try {
    const users = await User.find().select(`name avatar location`);
    res.json(users);
  } catch (e) {
    console.error(e.message);
    res.status(500).send(`Server error!`);
  }
});

// @route     GET api/users/:id
// @desc      Get profile by user id
// @access    Public
router.get(`/:id`, auth, async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select(
      `name avatar location`
    );
    if (!user) {
      return res.status(400).json({ msg: `User cannot be found!` });
    }
    res.json(user);
  } catch (e) {
    console.error(e.message);
    if (e.kind === `ObjectId`) {
      return res.status(400).json({ msg: `User cannot be found!` });
    }
    res.status(500).send(`Server error!`);
  }
});

// @route     PATCH api/users/me
// @desc      Edit logged-in user's profile
// @access    Private
router.patch(`/me`, auth, async (req, res) => {
  const updates = Object.keys(req.body);
  const allowedUpdates = [`name`, `email`, `location`];
  const isValidOperation = updates.every(update => {
    return allowedUpdates.includes(update);
  });

  if (!isValidOperation) {
    return res.status(400).json({ msg: `Invalid updates!` });
  }

  try {
    const user = await User.findById(req.user.id).select(`-password`);
    updates.forEach(update => (user[update] = req.body[update]));
    await user.save();
    res.json(user);
  } catch (e) {
    console.error(e.message);
    res.status(500).send(`Server error!`);
  }
});

// @route     DELETE api/users/me
// @desc      Delete your account and your items
// @access    Private
router.delete(`/me`, auth, async (req, res) => {
  try {
    // TODO: remove user's items as well
    await User.findByIdAndDelete(req.user.id);
    res.json(req.user);
  } catch (e) {
    console.error(e.message);
    if (e.kind === `ObjectId`) {
      return res.status(400).json({ msg: `User cannot be found!` });
    }
    console.error(e.message);
    res.status(500).send(`Server error!`);
  }
});

module.exports = router;
