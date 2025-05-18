const fetch = require("node-fetch");
const FormData = require("form-data");

async function testUpload() {
  const imageUrl = "https://cdn.promptden.com/images/afd9788f-2dad-4370-9190-9107fdeb4005.jpg?class=standard";

  // Tải ảnh về buffer
  const resImg = await fetch(imageUrl);
  const buffer = await resImg.buffer();

  const form = new FormData();
  form.append("image", buffer.toString("base64"));
  form.append("type", "base64");

  const res = await fetch("https://api.imgur.com/3/image", {
    method: "POST",
    headers: {
      Authorization: "Client-ID 9e07424818a32d1",  // Thay bằng Client-ID thật của bạn
    },
    body: form,
  });

  const data = await res.json();
  console.log(data);
}

testUpload();
