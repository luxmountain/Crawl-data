// Chuyển domain ảnh của web crawl lên cloundinary hoặc imgur củả mình

const axios = require("axios");
const FormData = require("form-data");

// 1. Lấy toàn bộ posts
async function fetchPosts() {
  const res = await axios.get("http://localhost:3000/api/pins");
  return res.data;
}

// 2. Tải ảnh từ image_url về buffer
async function downloadImage(imageUrl) {
  const response = await axios.get(imageUrl, { responseType: "arraybuffer" });
  return response.data;
}

// ✅ 3. Gửi ảnh lên Cloudinary qua API upload (đúng định dạng API bạn viết)
async function uploadImageToCloudinary(imageBuffer, filename) {
  const form = new FormData();
  form.append("image", imageBuffer, { filename }); // 👈 phải là "image", không phải "file"

  const res = await axios.post(
    "http://localhost:3000/api/upload",
    form,
    {
      headers: {
        ...form.getHeaders(),
      },
    }
  );

  return res.data.link; // 👈 vì API trả về { link: result.secure_url }
}

// 4. Cập nhật image_url mới cho post
async function updatePostImageUrl(pid, newImageUrl) {
  const res = await axios.put("http://localhost:3000/api/pins/update-image", {
    pid,
    image_url: newImageUrl,
  });
  return res.data;
}

// Main chạy tuần tự
async function main() {
  try {
    const posts = await fetchPosts();
    for (const post of posts) {
      if (!post.image_url) continue;

      if (!post.image_url.startsWith("https://i.pinimg.com/")) {
        console.log(`Bỏ qua post pid=${post.pid} vì không phải ảnh từ cdn.promptden.com`);
        continue;
      }

      console.log(`Xử lý post pid=${post.pid}`);

      try {
        const imageBuffer = await downloadImage(post.image_url);
        const filename = `post_${post.pid}.jpg`;

        const cloudinaryUrl = await uploadImageToCloudinary(imageBuffer, filename);
        console.log("Ảnh upload cloudinary:", cloudinaryUrl);

        const updateRes = await updatePostImageUrl(post.pid, cloudinaryUrl);
        console.log("Cập nhật thành công:", updateRes.message);
      } catch (e) {
        console.error("Lỗi xử lý post pid=", post.pid, e.message);
      }
    }
  } catch (error) {
    console.error("Lỗi lấy posts:", error.message);
  }
}

main();
