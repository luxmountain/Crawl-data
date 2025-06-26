const axios = require('axios');
const fs = require('fs');

const API_URL = 'https://api.promptden.com/v1/prompts';
const DETAIL_URL = slug => `https://api.promptden.com/v1/prompts/${slug}`;
const BASE_POST_URL = 'https://promptden.com/post';

async function fetchPromptDetail(slug) {
  try {
    const { data } = await axios.get(DETAIL_URL(slug));
    const item = data?.data;

    if (!item) {
      console.warn(`⚠️ Không có dữ liệu chi tiết cho slug: ${slug}`);
      return { description: '', prompt_used: '' };
    }

    return {
      description: item.description || '',
      prompt_used: item.prompt?.step1 || ''
    };
  } catch (err) {
    console.error(`❌ Lỗi khi lấy chi tiết "${slug}":`, err.message);
    return { description: '', prompt_used: '' };
  }
}

async function fetchInspirationPosts() {
  let page = 1;
  const limit = 20;
  const results = [];

  while (true) {
    console.log(`📄 Đang lấy trang ${page}...`);
    try {
      const { data } = await axios.get(API_URL, {
        params: {
          limit,
          page,
          'filter[kind]': 'inspiration'
        }
      });

      const posts = data?.data;
      if (!posts || posts.length === 0) {
        console.log('✅ Không còn dữ liệu, kết thúc.');
        break;
      }

      for (const post of posts) {
        const slug = post.slug;
        console.log(`🔍 Lấy chi tiết: ${slug}`);
        const detail = await fetchPromptDetail(slug);

        const entry = {
          url: `${BASE_POST_URL}/${slug}`,
          title: post.title,
          description: detail.description,
          prompt_used: detail.prompt_used,
          model: post.type?.name || '',
          tags: post.tags || [],
          image_url: post.images?.[0]?.url || ''
        };

        results.push(entry);
      }

      // ✍️ Ghi file sau mỗi trang
      fs.writeFileSync('post.json', JSON.stringify(results, null, 2), 'utf-8');
      console.log(`💾 Đã ghi ${results.length} bài vào post.json sau trang ${page}`);

      page++;
    } catch (err) {
      console.error(`❌ Lỗi khi lấy trang ${page}:`, err.message);
      break;
    }
  }
}

fetchInspirationPosts();
