const { sendMessage } = require("../handles/sendMessage");
const axios = require("axios");

const activeSessions = new Map();
const lastSentCache = new Map();
const PH_TIMEZONE = "Asia/Manila";

function pad(n) {
  return n < 10 ? "0" + n : n;
}

function getPHTime() {
  return new Date(new Date().toLocaleString("en-US", { timeZone: PH_TIMEZONE }));
}

function getCountdown(target) {
  const now = getPHTime();
  const msLeft = target - now;
  if (msLeft <= 0) return "00h 00m 00s";
  const h = Math.floor(msLeft / 3.6e6);
  const m = Math.floor((msLeft % 3.6e6) / 6e4);
  const s = Math.floor((msLeft % 6e4) / 1000);
  return `${pad(h)}h ${pad(m)}m ${pad(s)}s`;
}

function getNextRestocks() {
  const now = getPHTime();
  const timers = {};

  const nextEgg = new Date(now);
  nextEgg.setMinutes(now.getMinutes() < 30 ? 30 : 0);
  if (now.getMinutes() >= 30) nextEgg.setHours(now.getHours() + 1);
  nextEgg.setSeconds(0, 0);
  timers.egg = getCountdown(nextEgg);

  const next5 = new Date(now);
  const nextM = Math.ceil((now.getMinutes() + (now.getSeconds() > 0 ? 1 : 0)) / 5) * 5;
  next5.setMinutes(nextM === 60 ? 0 : nextM, 0, 0);
  if (nextM === 60) next5.setHours(now.getHours() + 1);
  timers.gear = timers.seed = getCountdown(next5);

  const nextHour = new Date(now);
  nextHour.setHours(now.getHours() + 1, 0, 0, 0);
  timers.honey = getCountdown(nextHour);

  const next7 = new Date(now);
  const totalHours = now.getHours() + now.getMinutes() / 60 + now.getSeconds() / 3600;
  const next7h = Math.ceil(totalHours / 7) * 7;
  next7.setHours(next7h, 0, 0, 0);
  timers.cosmetics = getCountdown(next7);

  return timers;
}

function getNextScheduledTime(startTime = getPHTime()) {
  const base = new Date(startTime);
  const min = base.getMinutes();
  const next5 = Math.floor(min / 5) * 5 + 5;
  base.setMinutes(next5, 30, 0);
  if (base <= startTime) base.setMinutes(base.getMinutes() + 5);
  return base;
}

function formatValue(val) {
  if (val >= 1_000_000) return `x${(val / 1_000_000).toFixed(1)}M`;
  if (val >= 1_000) return `x${(val / 1_000).toFixed(1)}K`;
  return `x${val}`;
}

function addEmoji(name) {
  const emojis = {
    "Common Egg": "🥚",
    "Common Summer Egg": "🐣",
    "Uncommon Egg": "🐣",
    "Rare Egg": "🍳",
    "Paradise Egg": "�",
    "Legendary Egg": "🪺",
    "Mythical Egg": "🔮",
    "Bug Egg": "🪲",
    "Cleaning Spray": "🧴",
    "Friendship Pot": "💑",
    "Watering Can": "🚿",
    "Trowel": "🛠️",
    "Recall Wrench": "🔧",
    "Basic Sprinkler": "💧",
    "Advanced Sprinkler": "💦",
    "Godly Sprinkler": "⛲",
    "Lightning Rod": "⚡",
    "Master Sprinkler": "🌊",
    "Favorite Tool": "❤️",
    "Harvest Tool": "🌾",
    "Carrot": "🥕",
    "Strawberry": "🍓",
    "Blueberry": "🫐",
    "Orange Tulip": "🌷",
    "Tomato": "🍅",
    "Corn": "🌽",
    "Daffodil": "🌼",
    "Watermelon": "🍉",
    "Cauliflower": "🥦",
    "Avocado": "🥑",
    "Green Apple": "🍏",
    "Kiwi": "🥝",
    "Pineapple": "🍍",
    "Prickly Pear": "🌵",
    "Bell Pepper": "🫑",
    "Feijoa": "🍈",
    "Loquat": "🍋",
    "Sugar Apple": "🍏",
    "Banana": "🍌",
  };
  return `${emojis[name] || ""} ${name}`;
}

function normalizeStockData(stockData) {
  const transform = (arr) => arr.map(i => ({ name: i.name, value: i.value }));
  return {
    gearStock: transform(stockData.gearStock),
    seedsStock: transform(stockData.seedsStock),
    eggStock: transform(stockData.eggStock),
    honeyStock: transform(stockData.honeyStock),
    cosmeticsStock: transform(stockData.cosmeticsStock),
  };
}

async function fetchWithTimeout(url, options = {}, timeout = 5000) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  try {
    const response = await axios.get(url, { ...options, signal: controller.signal });
    clearTimeout(id);
    return response;
  } catch (error) {
    clearTimeout(id);
    throw error;
  }
}

module.exports = {
  name: "gagstock",
  author: 'Raniel',
  description: "Track Grow A Garden stock including cosmetics and restocks.",
  usage: "gagstock on | gagstock on Sunflower | Watering Can | gagstock off",
  category: "Tools ⚒️",

  async execute(senderId, args, pageAccessToken) {
    const action = args[0]?.toLowerCase();
    const filters = args.slice(1).join(" ").split("|").map(f => f.trim().toLowerCase()).filter(Boolean);

    if (action === "off") {
      const session = activeSessions.get(senderId);
      if (session) {
        clearTimeout(session.timeout);
        activeSessions.delete(senderId);
        lastSentCache.delete(senderId);
        return await sendMessage(senderId, { text: "🛑 Gagstock tracking stopped." }, pageAccessToken);
      } else {
        return await sendMessage(senderId, { text: "⚠️ You don't have an active gagstock session." }, pageAccessToken);
      }
    }

    if (action !== "on") {
      return await sendMessage(senderId, {
        text: "📌 Usage:\n• gagstock on\n• gagstock on Sunflower | Watering Can\n• gagstock off",
      }, pageAccessToken);
    }

    if (activeSessions.has(senderId)) {
      return await sendMessage(senderId, {
        text: "📡 You're already tracking Gagstock. Use gagstock off to stop.",
      }, pageAccessToken);
    }

    await sendMessage(senderId, { text: "✅ Gagstock tracking started! You'll be notified when stock or weather changes." }, pageAccessToken);

    async function fetchAndNotify(alwaysSend = false) {
      try {
        const [stockRes, weatherRes] = await Promise.all([
          fetchWithTimeout("https://gagstock.gleeze.com/grow-a-garden"),
          fetchWithTimeout("https://growagardenstock.com/api/stock/weather"),
        ]);

        const backup = stockRes.data.data;
        const stockData = {
          gearStock: backup.gear.items.map(i => ({ name: i.name, value: Number(i.quantity) })),
          seedsStock: backup.seed.items.map(i => ({ name: i.name, value: Number(i.quantity) })),
          eggStock: backup.egg.items.map(i => ({ name: i.name, value: Number(i.quantity) })),
          cosmeticsStock: backup.cosmetics.items.map(i => ({ name: i.name, value: Number(i.quantity) })),
          honeyStock: backup.honey.items.map(i => ({ name: i.name, value: Number(i.quantity) })),
        };

        const weather = {
          currentWeather: weatherRes.data.currentWeather || "Unknown",
          icon: weatherRes.data.icon || "🌤️",
          cropBonuses: weatherRes.data.cropBonuses || "None",
          updatedAt: weatherRes.data.updatedAt || new Date().toISOString(),
        };

        const restocks = getNextRestocks();

        const formatList = (arr) => arr.map(i => `- ${addEmoji(i.name)}: ${formatValue(i.value)}`).join("\n");

        const updatedAtPH = getPHTime().toLocaleString("en-PH", {
          hour: "numeric", minute: "numeric", second: "numeric",
          hour12: true, day: "2-digit", month: "short", year: "numeric"
        });

        let filteredContent = "";
        let matched = 0;

        const addSection = (label, items, restock) => {
          const filtered = filters.length ? items.filter(i => filters.some(f => i.name.toLowerCase().includes(f))) : items;
          if (label === "🛠️ 𝗚𝗲𝗮𝗿" || label === "🌱 𝗦𝗲𝗲𝗱𝘀") {
            if (filtered.length > 0) {
              matched += filtered.length;
              filteredContent += `${label}:\n${formatList(filtered)}\n⏳ Restock In: ${restock}\n\n`;
            }
          } else {
            filteredContent += `${label}:\n${formatList(items)}\n⏳ Restock In: ${restock}\n\n`;
          }
        };

        addSection("🛠️ 𝗚𝗲𝗮𝗿", stockData.gearStock, restocks.gear);
        addSection("🌱 𝗦𝗲𝗲𝗱𝘀", stockData.seedsStock, restocks.seed);
        addSection("🥚 𝗘𝗴𝗴𝘀", stockData.eggStock, restocks.egg);
        addSection("🎨 𝗖𝗼𝘀𝗺𝗲𝘁𝗶𝗰𝘀", stockData.cosmeticsStock, restocks.cosmetics);
        /*addSection("🍯 𝗛𝗼𝗻𝗲𝘆", stockData.honeyStock, restocks.honey);*/

        const currentKey = JSON.stringify({
          gearStock: stockData.gearStock,
          seedsStock: stockData.seedsStock,
        });

        const lastSent = lastSentCache.get(senderId);
        if (!alwaysSend && lastSent === currentKey) return false;
        lastSentCache.set(senderId, currentKey);

        if (matched === 0) return false;

        const message = `🌾 𝗚𝗿𝗼𝘄 𝗔 𝗚𝗮𝗿𝗱𝗲𝗻 — 𝗧𝗿𝗮𝗰𝗸𝗲𝗿\n\n${filteredContent}🌤️ 𝗪𝗲𝗮𝘁𝗵𝗲𝗿: ${weather.icon} ${weather.currentWeather}\n🌾 Crop Bonus: ${weather.cropBonuses}\n📅 Updated at (Philippines): ${updatedAtPH}`;

        await sendMessage(senderId, { text: message }, pageAccessToken);
        return true;
      } catch {
        return false;
      }
    }

    async function runSchedule() {
      const now = getPHTime();
      const nextTime = getNextScheduledTime(now);
      const wait = Math.max(nextTime - now, 1000);

      const timer = setTimeout(async function trigger() {
        const updated = await fetchAndNotify(false);
        if (updated) {
          runSchedule();
        } else {
          const retryTimer = setTimeout(trigger, 5000);
          activeSessions.set(senderId, { timeout: retryTimer });
        }
      }, wait);

      activeSessions.set(senderId, { timeout: timer });
    }

    await fetchAndNotify(true);
    runSchedule();
  }
};
1
