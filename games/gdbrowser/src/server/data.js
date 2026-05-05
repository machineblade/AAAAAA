const WORKER_URL = "https://e.machine-blade2991.workers.dev/proxy";

// ── Low-level proxy call ────────────────────────────────────────────────────

export async function gdRequest(endpoint, params = {}) {
  const body = new URLSearchParams({
    endpoint,
    secret: "Wmfd2893gb7",
    gameVersion: 22,
    binaryVersion: 35,
    ...params,
  });

  const response = await fetch(WORKER_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });

  if (response.status === 429 || response.status === 503) {
    throw new Error("too many requests");
  }

  if (!response.ok) {
    throw new Error(`Worker error: ${response.status}`);
  }

  const text = await response.text();
  if (text === "-1") throw new Error("too many requests");
  return text;
}

// ── Parsers ─────────────────────────────────────────────────────────────────

function parseKeyValue(str) {
  const parts = str.split(":");
  const result = {};
  for (let i = 0; i + 1 < parts.length; i += 2) {
    result[parts[i]] = parts[i + 1];
  }
  return result;
}

function decodeBase64(str) {
  if (!str) return "";
  try {
    return atob(str.replace(/-/g, "+").replace(/_/g, "/"));
  } catch {
    return str;
  }
}

function parseLevel(level) {
  return {
    id:              level["1"],
    name:            level["2"],
    description:     decodeBase64(level["3"]),
    version:         Number(level["5"]),
    authorUserId:    level["6"],
    difficultyDenominator: Number(level["8"]),
    difficultyNumerator:   Number(level["9"]),
    downloads:       Number(level["10"]),
    officialSong:    Number(level["12"]),
    gameVersion:     Number(level["13"]),
    likes:           Number(level["14"]),
    length:          Number(level["15"]),
    isDemon:         level["17"] === "1",
    stars:           Number(level["18"]),
    featureScore:    Number(level["19"]),
    isAuto:          level["25"] === "1",
    password:        level["27"] || null,
    uploadDate:      level["28"] || null,
    updateDate:      level["29"] || null,
    copiedID:        level["30"] || null,
    twoPlayer:       level["31"] === "1",
    customSongId:    level["35"] || null,
    extraString:     level["36"] || null,
    coins:           Number(level["37"]),
    verifiedCoins:   level["38"] === "1",
    starsRequested:  Number(level["39"]),
    epic:            Number(level["42"]),
    demonDifficulty: Number(level["43"]),
    isGauntlet:      level["44"] === "1",
    objects:         Number(level["45"]),
    editorTime:      Number(level["46"]),
    editorTimeCopies: Number(level["47"]),
    songIDs:         level["52"] ? level["52"].split(",") : [],
    sfxIDs:          level["53"] ? level["53"].split(",") : [],
    verificationTime: Number(level["57"]),
    _raw:            level,
  };
}

function parseUser(user) {
  return {
    username:      user["1"],
    userId:        user["2"],
    stars:         Number(user["3"]),
    demons:        Number(user["4"]),
    creatorPoints: Number(user["8"]),
    accountId:     user["16"],
    _raw:          user,
  };
}

// ── Public API ───────────────────────────────────────────────────────────────

export async function getLevelById(levelId) {
  const raw = await gdRequest("getGJLevels21.php", { type: 0, str: levelId });
  const sections = raw.split("#");
  const level = parseKeyValue(sections[0]);
  return parseLevel(level);
}

export async function getLevelDetails(levelId) {
  const raw = await gdRequest("downloadGJLevel22.php", { levelID: levelId });
  const sections = raw.split("#");
  console.log("RAW LEVEL STRING:", sections[0]); // add this
  const level = parseKeyValue(sections[0]);
  console.log("PARSED KEYS:", level); // and this
  return parseLevel(level);
}
export async function getLevelByName(query) {
  const raw = await gdRequest("getGJLevels21.php", { type: 0, str: query });
  const sections = raw.split("#");
  const levels = sections[0].split("|");
  return levels.map(levelStr => parseLevel(parseKeyValue(levelStr)));
}

export async function getUserById(accountId) {
  const raw = await gdRequest("getGJUserInfo20.php", { targetAccountID: accountId });
  const user = parseKeyValue(raw);
  return parseUser(user);
}

export async function getUserByPlayerId(playerId) {
  const raw = await gdRequest("getGJUsers20.php", { str: playerId });
  const sections = raw.split("#");
  const user = parseKeyValue(sections[0]);
  return parseUser(user);
}