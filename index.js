const express = require("express");
const { createClient } = require("@supabase/supabase-js");

const app = express();
app.use(express.json());

// ТВОИ ДАННЫЕ SUPABASE
const supabase = createClient(
  "https://xmjyxcwmynyfpvbjchrg.supabase.co",
  "sb_publishable_TS5C2IWNulVlkKtVTRHmJw_2qCzaLg3"
);

// Проверка работы сервера
app.get("/", (req, res) => {
  res.send("Backend работает 🚀");
});


// ==========================
// ЛОГИН
// ==========================
app.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;

    // ищем пользователя
    const { data: user, error } = await supabase
      .from("users")
      .select("*")
      .eq("username", username)
      .single();

    if (error || !user) {
      return res.status(400).json({ error: "Пользователь не найден" });
    }

    // проверка одобрения менеджером
    if (!user.approved) {
      return res.status(403).json({ error: "Доступ ещё не одобрен менеджером" });
    }

    // проверка пароля
    if (user.password !== password) {
      return res.status(400).json({ error: "Неверный пароль" });
    }

    res.json({ message: "Вход успешен ✅" });

  } catch (err) {
    res.status(500).json({ error: "Ошибка сервера" });
  }
});


// ==========================
// ЗАЯВКА НА ДОСТУП (без регистрации)
// ==========================
app.post("/r
