const User = require("../models/user.model");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const { sendVerificationEmail } = require("../utils/sendEmail");
const posthog = require("../utils/posthog");
const { signupSchema, loginSchema } = require("../middleware/validate.middleware");

// SIGNUP
exports.signup = async (req, res) => {
    try {
        const parsed = signupSchema.parse(req.body);

        const existingUser = await User.findOne({ email: parsed.email });
        if (existingUser)
            return res.status(400).json({ message: "User already exists" });

        const hashedPassword = await bcrypt.hash(parsed.password, 10);
        const token = crypto.randomBytes(32).toString("hex");

        const user = await User.create({
            ...parsed,
            password: hashedPassword,
            verificationToken: token
        });

        try {
            await sendVerificationEmail(user.email, token);
        } catch (err) {
            console.log("Email error:", err.message);
        }

        posthog.capture({
            distinctId: user._id.toString(),
            event: 'user_signed_up'
        });

        res.status(201).json({ message: "User created. Please verify email." });

    } catch (err) {
        res.status(400).json({ error: err.message });
    }
};

// VERIFY EMAIL
exports.verifyEmail = async (req, res) => {
    const { token } = req.params;

    const user = await User.findOne({ verificationToken: token });
    if (!user) return res.status(400).json({ message: "Invalid token" });

    user.isVerified = true;
    user.verificationToken = null;
    await user.save();

    res.json({ message: "Email verified successfully" });
};

// LOGIN
exports.login = async (req, res) => {
    try {
        const parsed = loginSchema.parse(req.body);

        // 🔍 1️⃣ Check if user exists
        const user = await User.findOne({ email: parsed.email });

        if (!user) {
            return res.status(404).json({
                message: "User does not exist"
            });
        }

        // 🔐 2️⃣ Check email verification
        if (!user.isVerified) {
            return res.status(401).json({
                message: "Please verify your email first"
            });
        }

        // 🔑 3️⃣ Compare password
        const isMatch = await bcrypt.compare(parsed.password, user.password);

        if (!isMatch) {
            return res.status(401).json({
                message: "Incorrect password"
            });
        }

        // 🎟 4️⃣ Generate JWT
        const token = jwt.sign(
            { id: user._id },
            process.env.JWT_SECRET,
            { expiresIn: "24h" }
        );

        return res.status(200).json({
            message: "Login successful",
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email
            }
        });

    } catch (err) {
        return res.status(400).json({
            error: err.message
        });
    }
};