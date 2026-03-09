const { getEnvValue } = require("./env");
const { CONFIG } = require("./config");
const { getPool } = require("./database");

const SETTINGS_KEYS = {
  DRIVER_CONTACT_USERNAMES: "driver_contact_usernames",
  PRICING: "pricing",
};

function toPositiveInteger(value, fallback) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return fallback;
  }

  return Math.round(parsed);
}

function normalizeDriverContactUsernames(input) {
  const values = Array.isArray(input) ? input : String(input || "").split(/[\r\n,]+/);
  const unique = new Set();

  for (const value of values) {
    const trimmed = String(value || "").trim().replace(/\s+/g, "");
    if (!trimmed) {
      continue;
    }

    const normalized = trimmed.startsWith("@") ? trimmed : `@${trimmed}`;
    unique.add(normalized);
  }

  return Array.from(unique);
}

function formatDriverContactUsernames(usernames) {
  const normalized = normalizeDriverContactUsernames(usernames);
  return normalized.length > 0 ? normalized.join(", ") : "hubungi admin";
}

function getDefaultPricing() {
  return {
    baseFare: toPositiveInteger(CONFIG.PRICE_BASE_FARE, 7000),
    baseDistanceMeters: toPositiveInteger(CONFIG.PRICE_BASE_DISTANCE_METERS, 2000),
    stepFare: toPositiveInteger(CONFIG.PRICE_STEP_FARE, 1500),
    distanceStepMeters: toPositiveInteger(CONFIG.PRICE_DISTANCE_STEP_METERS, 500),
    rainSurcharge: toPositiveInteger(CONFIG.PRICE_RAIN_SURCHARGE, 5000),
    nightSurcharge: toPositiveInteger(CONFIG.PRICE_NIGHT_SURCHARGE, 5000),
  };
}

function getDefaultSettings() {
  const envUsernames = normalizeDriverContactUsernames(
    getEnvValue("DRIVER_CONTACT_USERNAME", CONFIG.DRIVER_CONTACT_USERNAME || "@youradmin")
  );

  return {
    driverContactUsernames: envUsernames.length > 0 ? envUsernames : ["@youradmin"],
    pricing: getDefaultPricing(),
  };
}

let runtimeSettings = getDefaultSettings();

function syncConfigFromSettings(settings) {
  CONFIG.DRIVER_CONTACT_USERNAMES = [...settings.driverContactUsernames];
  CONFIG.DRIVER_CONTACT_USERNAME = settings.driverContactUsernames[0] || "";
  CONFIG.PRICE_BASE_FARE = settings.pricing.baseFare;
  CONFIG.PRICE_BASE_DISTANCE_METERS = settings.pricing.baseDistanceMeters;
  CONFIG.PRICE_STEP_FARE = settings.pricing.stepFare;
  CONFIG.PRICE_DISTANCE_STEP_METERS = settings.pricing.distanceStepMeters;
  CONFIG.PRICE_RAIN_SURCHARGE = settings.pricing.rainSurcharge;
  CONFIG.PRICE_NIGHT_SURCHARGE = settings.pricing.nightSurcharge;
}

function getRuntimeSettings() {
  return {
    driverContactUsernames: [...runtimeSettings.driverContactUsernames],
    pricing: { ...runtimeSettings.pricing },
  };
}

function parseStoredValue(rawValue) {
  try {
    return JSON.parse(rawValue);
  } catch (_error) {
    return rawValue;
  }
}

function buildSettingsFromStoredRows(rows) {
  const defaults = getDefaultSettings();
  const nextSettings = {
    driverContactUsernames: [...defaults.driverContactUsernames],
    pricing: { ...defaults.pricing },
  };

  for (const row of rows) {
    const parsedValue = parseStoredValue(row.setting_value);

    if (row.setting_key === SETTINGS_KEYS.DRIVER_CONTACT_USERNAMES) {
      const usernames = normalizeDriverContactUsernames(parsedValue);
      if (usernames.length > 0) {
        nextSettings.driverContactUsernames = usernames;
      }
    }

    if (row.setting_key === SETTINGS_KEYS.PRICING && parsedValue && typeof parsedValue === "object") {
      const baseFare = toPositiveInteger(parsedValue.baseFare, defaults.pricing.baseFare);
      const legacyMultiplier = Number(parsedValue.rainMultiplier);
      const derivedLegacySurcharge = Number.isFinite(legacyMultiplier) && legacyMultiplier > 1
        ? Math.round(baseFare * (legacyMultiplier - 1))
        : defaults.pricing.rainSurcharge;

      nextSettings.pricing = {
        baseFare,
        baseDistanceMeters: toPositiveInteger(parsedValue.baseDistanceMeters, defaults.pricing.baseDistanceMeters),
        stepFare: toPositiveInteger(parsedValue.stepFare, defaults.pricing.stepFare),
        distanceStepMeters: toPositiveInteger(
          parsedValue.distanceStepMeters,
          defaults.pricing.distanceStepMeters
        ),
        rainSurcharge: toPositiveInteger(parsedValue.rainSurcharge, derivedLegacySurcharge),
        nightSurcharge: toPositiveInteger(parsedValue.nightSurcharge, defaults.pricing.nightSurcharge),
      };
    }
  }

  return nextSettings;
}

async function loadRuntimeSettings() {
  const db = getPool();
  const [rows] = await db.query(
    `SELECT setting_key, setting_value
     FROM system_settings
     WHERE setting_key IN (?, ?)`,
    [SETTINGS_KEYS.DRIVER_CONTACT_USERNAMES, SETTINGS_KEYS.PRICING]
  );

  runtimeSettings = buildSettingsFromStoredRows(rows);
  syncConfigFromSettings(runtimeSettings);

  return getRuntimeSettings();
}

function validateSettingsInput(input) {
  const current = getRuntimeSettings();
  const nextSettings = {
    driverContactUsernames: [...current.driverContactUsernames],
    pricing: { ...current.pricing },
  };
  const errors = [];

  if (Object.prototype.hasOwnProperty.call(input, "driverContactUsernames")) {
    const usernames = normalizeDriverContactUsernames(input.driverContactUsernames);
    if (usernames.length === 0) {
      errors.push("Minimal satu username admin driver wajib diisi.");
    } else {
      nextSettings.driverContactUsernames = usernames;
    }
  }

  if (Object.prototype.hasOwnProperty.call(input, "pricing")) {
    const pricing = input.pricing;

    if (!pricing || typeof pricing !== "object" || Array.isArray(pricing)) {
      errors.push("Format pricing tidak valid.");
    } else {
      const pricingFields = [
        ["baseFare", "Biaya dasar"],
        ["baseDistanceMeters", "Batas tarif dasar"],
        ["stepFare", "Biaya per langkah"],
        ["distanceStepMeters", "Jarak per langkah"],
        ["nightSurcharge", "Tambahan dini hari"],
      ];

      for (const [field, label] of pricingFields) {
        const parsed = Number(pricing[field]);
        if (!Number.isFinite(parsed) || parsed <= 0) {
          errors.push(`${label} harus lebih besar dari 0.`);
          continue;
        }

        nextSettings.pricing[field] = Math.round(parsed);
      }

      const rainSurchargeValue = Object.prototype.hasOwnProperty.call(pricing, "rainSurcharge")
        ? pricing.rainSurcharge
        : (
          Number.isFinite(Number(pricing.rainMultiplier)) &&
          Number(pricing.rainMultiplier) > 1
            ? nextSettings.pricing.baseFare * (Number(pricing.rainMultiplier) - 1)
            : undefined
        );
      const rainSurcharge = Number(rainSurchargeValue);

      if (!Number.isFinite(rainSurcharge) || rainSurcharge <= 0) {
        errors.push("Tambahan saat hujan harus lebih besar dari 0.");
      } else {
        nextSettings.pricing.rainSurcharge = Math.round(rainSurcharge);
      }
    }
  }

  return {
    ok: errors.length === 0,
    errors,
    value: nextSettings,
  };
}

async function saveRuntimeSettings(input) {
  const validation = validateSettingsInput(input);
  if (!validation.ok) {
    const error = new Error(validation.errors.join(" "));
    error.statusCode = 400;
    throw error;
  }

  const nextSettings = validation.value;
  const db = getPool();
  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    await connection.execute(
      `INSERT INTO system_settings (setting_key, setting_value)
       VALUES (?, ?)
       ON DUPLICATE KEY UPDATE
         setting_value = VALUES(setting_value),
         updated_at = CURRENT_TIMESTAMP`,
      [SETTINGS_KEYS.DRIVER_CONTACT_USERNAMES, JSON.stringify(nextSettings.driverContactUsernames)]
    );

    await connection.execute(
      `INSERT INTO system_settings (setting_key, setting_value)
       VALUES (?, ?)
       ON DUPLICATE KEY UPDATE
         setting_value = VALUES(setting_value),
         updated_at = CURRENT_TIMESTAMP`,
      [SETTINGS_KEYS.PRICING, JSON.stringify(nextSettings.pricing)]
    );

    await connection.commit();
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }

  runtimeSettings = nextSettings;
  syncConfigFromSettings(runtimeSettings);

  return getRuntimeSettings();
}

syncConfigFromSettings(runtimeSettings);

module.exports = {
  formatDriverContactUsernames,
  getRuntimeSettings,
  loadRuntimeSettings,
  normalizeDriverContactUsernames,
  saveRuntimeSettings,
  SETTINGS_KEYS,
  validateSettingsInput,
};
