const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');

const BASE_URL = 'https://promptden.com';

async function getPostLinks() {
  try {
    const { data: html } = await axios.get(BASE_URL);
    const $ = cheerio.load(html);
    const postLinks = new Set();

    $('a[href^="/post/"]').each((i, el) => {
      const href = $(el).attr('href');
      if (href) {
        postLinks.add(`${BASE_URL}${href}`);
      }
    });

    return Array.from(postLinks);
  } catch (err) {
    console.error('Lỗi khi lấy danh sách bài post:', err.message);
    return [];
  }
}

function capitalizeWords(str) {
  return str
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

async function crawlPostDetail(url) {
  try {
    const { data: html } = await axios.get(url);
    const $ = cheerio.load(html);

    const title = $('h1.text-2xl').first().text().trim();
    const description = $('p.mb-6').first().text().trim();
    const prompt_used = $('p.leading-7.whitespace-break-spaces').first().text().trim();
    const model = $('a[href^="/inspiration/"]').first().text().trim();

    // Tags
    const tags = [];
    $('a.tag').each((i, el) => {
      let tag = $(el).text().trim();
      tag = capitalizeWords(tag);
      if (tag) tags.push(tag);
    });

    // Image URL
    const image_url = $('img[alt="' + title + '"]').first().attr('src') || '';

    return {
      url,
      title,
      description,
      prompt_used,
      model,
      tags,
      image_url
    };
  } catch (err) {
    console.error(`Lỗi khi crawl ${url}:`, err.message);
    return null;
  }
}

async function crawlAllPosts() {
  const postLinks = await getPostLinks();
  const results = [];

  for (const url of postLinks) {
    console.log(`Đang crawl: ${url}`);
    const data = await crawlPostDetail(url);
    if (data) results.push(data);
  }

  fs.writeFileSync('post.json', JSON.stringify(results, null, 2), 'utf-8');
  console.log('Đã lưu dữ liệu vào post.json');
}

crawlAllPosts();
