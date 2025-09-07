const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../db'); // knex instance

const JWT_SECRET = process.env.JWT_SECRET || 'supersecretkey';

// helper to generate random OTP
function generateOtp() {
  return Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit
}

exports.register = async (req, res) => {
  try {
    const {
      first_name,
      last_name,
      email,
      gender,
      dob,
      password,
      profile_image,
      nid,
      passport_no,
    } = req.body;

    // check existing user
    const existing = await db('users').where({ email }).first();
    if (existing) return res.status(400).json({ message: 'Email already registered' });

    const hashedPassword = await bcrypt.hash(password, 10);
    const otp = generateOtp();
    const otpValidTime = new Date(Date.now() + 10 * 60 * 1000); // valid for 10 minutes

    const [user] = await db('users')
      .insert({
        first_name,
        last_name,
        email,
        gender,
        dob,
        password: hashedPassword,
        profile_image,
        nid,
        passport_no,
        otp,
        otp_valid_time: otpValidTime,
      })
      .returning(['id', 'first_name', 'last_name', 'email', 'is_verified']);

    // here you’d send OTP via email or SMS (not implemented)
    console.log(`Generated OTP for ${email}: ${otp}`);

    res.status(201).json({ message: 'User registered, OTP sent', user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;

    const user = await db('users').where({ email }).first();
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (user.is_verified) return res.json({ message: 'User already verified' });

    if (user.otp !== otp) return res.status(400).json({ message: 'Invalid OTP' });

    if (new Date() > new Date(user.otp_valid_time)) {
      return res.status(400).json({ message: 'OTP expired' });
    }

    await db('users').where({ email }).update({
      is_verified: true,
      otp: null,
      otp_valid_time: null,
    });

    res.json({ message: 'User verified successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await db('users').where({ email }).first();
    if (!user) return res.status(400).json({ message: 'Invalid email or password' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: 'Invalid email or password' });

    if (!user.is_verified) {
      return res.status(401).json({ message: 'User not verified. Please verify OTP first.' });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email },
      JWT_SECRET,
      { expiresIn: '1h' }
    );

    res.json({
      token,
      user: {
        id: user.id,
        first_name: user.first_name,
        last_name: user.last_name,
        email: user.email,
        is_verified: user.is_verified,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};
