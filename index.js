require("dotenv").config();

const express = require("express");
const { createClient } = require("@supabase/supabase-js");

const app = express();
app.use(express.json());

// ===== SUPABASE =====
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

// ===== TELEGRAM =====
async function sendToTelegram(text, buttons = null) {
  await fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_TOKEN}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: process.env.TELEGRAM_CHAT_ID,
      text,
      reply_markup: buttons
        ? {
            inline_keyboard: buttons,
          }
        : undefined,
    }),
  });
}

// ===== ПРОВЕРКА =====
app.get("/", (req, res) => {
  res.send("Backend работает 🚀");
});


// =====================================================
// ЗАЯВКА НА ДОСТУП → СРАЗУ В TELEGRAM С КНОПКАМИ
// =====================================================
app.post("/request-access", async (req, res) => {
  try {
    const { username, password } = req.body;

    const { error } = await supabase
      .from("users")
      .insert([{ username, password, approved: false }]);

    if (error) {
      return res.status(400).json({ error: "Username уже занят" });
    }

    // кнопки в Telegram
    const buttons = [
      [
        { text: "✅ Одобрить", callback_data: `approve:${username}` },
        { text: "❌ Отклонить", callback_data: `reject:${username}` },
      ],
    ];

    await sendToTelegram(
      `🆕 Новая заявка\n\n👤 ${username}\n🔑 ${password}`,
      buttons
    );

    res.json({ message: "Заявка отправлена ⏳" });

  } catch {
    res.status(500).json({ error: "Ошибка сервера" });
  }
});


// =====================================================
// WEBHOOK ОТ TELEGRAM (нажатия кнопок)
// =====================================================
app.post("/telegram-webhook", async (req, res) => {
  const data = req.body;

  if (data.callback_query) {
    const action = data.callback_query.data;
    const username = action.split(":")[1];

    if (action.startsWith("approve")) {
      await supabase
        .from("users")
        .update({ approved: true })
        .eq("username", username);

      await sendToTelegram(`✅ Пользователь ${username} ОДОБРЕН`);
    }

    if (action.startsWith("reject")) {
      await supabase
        .from("users")
        .delete()
        .eq("username", username);

      await sendToTelegram(`❌ Пользователь ${username} ОТКЛОНЕН`);
    }
  }

  res.sendStatus(200);
});


// =====================================================
// ЛОГИН
// =====================================================
app.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;

    const { data: user } = await supabase
      .from("users")
      .select("*")
      .eq("username", username)
      .single();

    if (!user) return res.status(400).json({ error: "Нет пользователя" });
    if (!user.approved) return res.status(403).json({ error: "Нет доступа" });
    if (user.password !== password)
      return res.status(400).json({ error: "Пароль неверный" });

    res.json({ message: "Вход успешен ✅" });

  } catch {
    res.status(500).json({ error: "Ошибка сервера" });
  }
});


// ===== ЗАПУСК =====
app.listen(3000, () => {
  console.log("Server started on port 3000 🚀");
});



// ==========================
// ЗАЯВКА НА ДОСТУП (без регистрации)
// ==========================
app.post("/r
