import { User } from "../models/User.js";

const defaultAdmin = {
  email: "admin@pinoxx.in",
  username: "pinoxxgetaways.in",
  password: "pinoxx@getaways",
  name: "Pinoxx Admin",
  phone: "919999999999"
};

export function adminEmail() {
  return (process.env.ADMIN_EMAIL || defaultAdmin.email).toLowerCase().trim();
}

export function adminUsername() {
  return (process.env.ADMIN_USERNAME || defaultAdmin.username).toLowerCase().trim();
}

export function adminPassword() {
  return process.env.ADMIN_PASSWORD || defaultAdmin.password;
}

export async function ensureAdminUser() {
  if (process.env.USE_MEMORY_DB === "true") return null;

  const email = adminEmail();
  const username = adminUsername();
  const password = adminPassword();
  const name = process.env.ADMIN_NAME || defaultAdmin.name;
  const phone = process.env.ADMIN_PHONE || defaultAdmin.phone;

  let user = await User.findOne({
    $or: [
      { email },
      { username }
    ]
  }).select("+password");

  if (!user) {
    user = await User.create({
      name,
      email,
      username,
      phone,
      password,
      role: "admin"
    });
    console.log(`Admin user created: ${email}`);
    return user;
  }

  let changed = false;
  if (user.role !== "admin") {
    user.role = "admin";
    changed = true;
  }
  if (user.username !== username) {
    user.username = username;
    changed = true;
  }
  if (!user.password || process.env.ADMIN_RESET_PASSWORD !== "false") {
    user.password = password;
    user.authProvider = "password";
    changed = true;
  }
  if (changed) {
    await user.save();
    console.log(`Admin user updated: ${email}`);
  }

  return user;
}
