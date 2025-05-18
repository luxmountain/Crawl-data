// Đẩy post crawl ở file json vào database

const fs = require("fs");
const path = require("path");
const fetch = require("node-fetch");
const FormData = require("form-data");

// Đường dẫn folder chứa ảnh tải về (bạn có thể đổi thành D:/project/Crawl data/image-post nếu muốn)
const IMAGE_FOLDER = path.resolve(__dirname, "image-post");
if (!fs.existsSync(IMAGE_FOLDER)) {
  fs.mkdirSync(IMAGE_FOLDER, { recursive: true });
}

// Đọc file JSON (giả sử là mảng các post)
const allData = JSON.parse(fs.readFileSync("post.json", "utf-8"));

// Hàm random UID theo yêu cầu
function getRandomUid() {
  const fixedUids = [10, 12, 13, 15];
  const rangeUids = Array.from({ length: 10 }, (_, i) => 26 + i).filter(uid => uid !== 28);
  const allUids = fixedUids.concat(rangeUids);
  const randomIndex = Math.floor(Math.random() * allUids.length);
  return allUids[randomIndex];
}

// Tải ảnh từ URL về file local
async function downloadImageToFile(imageUrl, filename) {
  const res = await fetch(imageUrl);
  if (!res.ok) throw new Error(`Failed to download image: ${res.status} ${res.statusText}`);

  const dest = fs.createWriteStream(filename);
  return new Promise((resolve, reject) => {
    res.body.pipe(dest);
    res.body.on("error", reject);
    dest.on("finish", () => resolve(filename));
    dest.on("error", reject);
  });
}

// Gửi ảnh file lên API Next.js /api/upload để upload lên Imgur
async function uploadImageFileToYourAPI(filepath) {
  const form = new FormData();
  form.append("image", fs.createReadStream(filepath));

  const res = await fetch("http://localhost:3000/api/upload", {
    method: "POST",
    body: form,
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || "Upload API failed");
  }
  return data.link;
}

async function createPostFromData(data) {
  try {
    if (!data.image_url || data.image_url.trim() === "") {
      console.log(`Bỏ qua post '${data.title}' do image_url trống hoặc không hợp lệ.`);
      return;
    }

    // Tạo tên file ảnh duy nhất
    const urlPath = new URL(data.image_url).pathname;
    const ext = path.extname(urlPath) || ".jpg";
    const filename = path.join(IMAGE_FOLDER, `${Date.now()}${ext}`);

    // Tải ảnh về local
    await downloadImageToFile(data.image_url, filename);
    console.log(`Ảnh đã tải về: ${filename}`);

    // Upload ảnh lên API của bạn (Next.js API /api/upload)
    const uploadedUrl = await uploadImageFileToYourAPI(filename);
    console.log(`Link Imgur nhận được từ API cho '${data.title}':`, uploadedUrl);

    // Xóa ảnh local sau khi upload
    fs.unlinkSync(filename);

    // Random uid
    const uid = getRandomUid();

    // Payload gửi API tạo post
    const payload = {
      title: data.title,
      description: data.description,
      prompt_used: data.prompt_used,
      image_url: uploadedUrl,
      model_name: data.model,
      tags: data.tags,
      uid,
    };

    // Gửi tạo post
    const response = await fetch("http://localhost:3000/api/crawl/promptden", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const postRes = await response.json();
    if (!response.ok) throw new Error(postRes.error || "Post creation failed");

    console.log(`Post '${data.title}' created successfully!`, postRes);
  } catch (err) {
    console.error(`Error xử lý post '${data.title}':`, err.message);
  }
}

async function main() {
  for (const postData of allData) {
    await createPostFromData(postData);
  }
}

main();
