const express = require(`express`);
const router = express.Router();
const auth = require(`../../middleware/auth`);
const gravatar = require(`gravatar`);
const bcrypt = require(`bcryptjs`);
const jwt = require(`jsonwebtoken`);
const config = require(`config`);
const { check, validationResult } = require(`express-validator`);
const User = require(`../../models/User`);

// @route     GET api/users/me
// @desc      Get current user's profile
// @access    Private
router.get(`/me`, auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select(`-password`);
    if (!user) {
      return res.status(400).json({ msg: `User cannot be found!` });
    }
    res.json(user);
  } catch (e) {
    console.error(e.message);
    res.status(500).send(`Server error!`);
  }
});

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
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, email, password } = req.body;

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
        password
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

module.exports = router;
