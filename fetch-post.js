const fs = require("fs");
const fetch = require("node-fetch");

// Đọc dữ liệu từ post.json
const allData = JSON.parse(fs.readFileSync("post.json", "utf-8"));

// Hàm random UID
function getRandomUid() {
  const fixedUids = [10, 12, 13, 15];
  const rangeUids = Array.from({ length: 10 }, (_, i) => 26 + i).filter(uid => uid !== 28);
  const allUids = fixedUids.concat(rangeUids);
  return allUids[Math.floor(Math.random() * allUids.length)];
}

async function createPostFromData(data) {
  try {
    if (!data.image_url?.trim()) {
      console.log(`⏭ Bỏ qua post '${data.title}' vì thiếu image_url.`);
      return;
    }

    const payload = {
      title: data.title,
      description: data.description,
      prompt_used: data.prompt_used,
      image_url: data.image_url,
      model_name: data.model,
      tags: data.tags,
      uid: getRandomUid(),
    };

    const response = await fetch("http://localhost:3000/api/crawl/promptden", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const result = await response.json();

    if (response.ok) {
      console.log(`✅ Tạo post thành công: '${data.title}'`);
      console.log("📦 Phản hồi từ server:", result);
    } else {
      console.error(`❌ Lỗi tạo post '${data.title}' – Status: ${response.status}`);
      console.error("📦 Phản hồi lỗi chi tiết:", result);
    }
  } catch (err) {
    console.error(`❌ Lỗi xử lý post '${data.title}': ${err.message}`);
  }
}

async function main() {
  for (const postData of allData) {
    await createPostFromData(postData);
    await new Promise(r => setTimeout(r, 300)); // delay nhẹ giữa các request
  }
}

main();
