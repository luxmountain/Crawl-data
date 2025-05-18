const axios = require("axios");
const { faker } = require("@faker-js/faker");

// Hàm tạo username hợp lệ: không dấu cách, không ký tự đặc biệt
function generateSafeUsername(firstName, lastName, usedUsernames) {
  let rawUsername, username;
  do {
    rawUsername = faker.internet.username({ firstName, lastName });
    username = rawUsername
      .toLowerCase()
      .replace(/[^a-z0-9]/g, ""); // chỉ giữ a-z, 0-9
  } while (usedUsernames.has(username));
  usedUsernames.add(username);
  return username;
}

async function seedUsers(count = 50) {
  const usedEmails = new Set();
  const usedUsernames = new Set();

  for (let i = 0; i < count; i++) {
    // Tạo tên
    const first_name = faker.person.firstName();
    const last_name = faker.person.lastName();

    // Tạo email duy nhất
    let email;
    do {
      email = faker.internet.email({ firstName: first_name, lastName: last_name }).toLowerCase();
    } while (usedEmails.has(email));
    usedEmails.add(email);

    // Tạo username hợp lệ và duy nhất
    const username = generateSafeUsername(first_name, last_name, usedUsernames);

    // Tạo user object
    const user = {
      first_name,
      last_name,
      username,
      email,
      password: "123123123",
      bio: faker.lorem.sentence(8),
      avatar_image: `https://i.pravatar.cc/150?u=${email}`,
    };

    // Gửi request tạo user
    try {
      const res = await axios.post("http://localhost:3000/api/users", user);
      console.log(`✅ [${i + 1}/${count}] Created: ${res.data.username}`);
    } catch (err) {
      console.error(
        `❌ [${i + 1}/${count}] Failed to create ${username}:`,
        err.response?.data || err.message
      );
    }
  }
}

seedUsers(50);
