const express = require("express");
const cors = require("cors");
const bcrypt = require("bcrypt");
const pool = require("./db");
const crypto = require("crypto");
const sendEmail = require("./utils/sendEmail");

require("dotenv").config();

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("Backend server is running");
});

app.get("/test-mail", async (req, res) => {
  try {
    await sendEmail(
      "네가받을이메일@gmail.com",
      "테스트 메일",
      "<h1>메일 정상 작동</h1>"
    );

    res.send("메일 전송 성공");
  } catch (err) {
    console.error(err);
    res.status(500).send("메일 전송 실패");
  }
});

// 회원가입 API
app.post("/signup", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        error: "이름, 이메일, 비밀번호를 모두 입력해주세요.",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const verificationToken = crypto.randomBytes(32).toString("hex");
    const expires = new Date(Date.now() + 1000 * 60 * 30);

    await pool.query(
      `INSERT INTO users
       (name, email, password_hash, is_verified, verification_token, verification_token_expires)
       VALUES ($1, $2, $3, false, $4, $5)`,
      [name, email, hashedPassword, verificationToken, expires]
    );

    const verifyLink = `${process.env.BACKEND_URL}/verify-email?token=${verificationToken}`;

    await sendEmail(
      email,
      "이메일 인증을 완료해주세요",
      `
      <h2>이메일 인증</h2>
      <p>아래 링크를 클릭해서 회원가입을 완료해주세요.</p>
      <a href="${verifyLink}">이메일 인증하기</a>
      <p>이 링크는 30분 후 만료됩니다.</p>
      `
    );

    res.status(201).json({
      message: "회원가입 성공. 이메일 인증을 진행해주세요.",
    });
  } catch (err) {
    console.error(err);

    if (err.code === "23505") {
      return res.status(409).json({
        error: "이미 가입된 이메일입니다.",
      });
    }

    res.status(500).json({
      error: "서버 오류가 발생했습니다.",
    });
  }
});

// 이메일 인증 API
app.get("/verify-email", async (req, res) => {
  try {
    const { token } = req.query;

    if (!token) {
      return res.status(400).send("인증 토큰이 없습니다.");
    }

    const result = await pool.query(
      `SELECT * FROM users
       WHERE verification_token = $1
       AND verification_token_expires > NOW()`,
      [token]
    );

    if (result.rows.length === 0) {
      return res.status(400).send("인증 링크가 유효하지 않거나 만료되었습니다.");
    }

    await pool.query(
      `UPDATE users
       SET is_verified = true,
           verification_token = null,
           verification_token_expires = null
       WHERE verification_token = $1`,
      [token]
    );

    res.send(`
      <h2>이메일 인증 완료</h2>
      <p>이제 로그인할 수 있습니다.</p>
      <a href="${process.env.FRONTEND_URL}/login">로그인하러 가기</a>
    `);
  } catch (err) {
    console.error(err);
    res.status(500).send("이메일 인증 중 오류가 발생했습니다.");
  }
});

// 로그인 API
app.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        error: "이메일과 비밀번호를 입력해주세요.",
      });
    }

    const result = await pool.query(
      "SELECT * FROM users WHERE email = $1",
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({
        error: "이메일 또는 비밀번호가 틀렸습니다.",
      });
    }

    const user = result.rows[0];

    const isMatch = await bcrypt.compare(password, user.password_hash);

    if (!isMatch) {
      return res.status(401).json({
        error: "이메일 또는 비밀번호가 틀렸습니다.",
      });
    }

    if (!user.is_verified) {
      return res.status(403).json({
        error: "이메일 인증 후 로그인할 수 있습니다.",
      });
    }

    res.json({
      message: "로그인 성공",
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      error: "서버 오류가 발생했습니다.",
    });
  }
});

app.listen(process.env.PORT || 5000, () => {
  console.log(`Server running on port ${process.env.PORT || 5000}`);
});