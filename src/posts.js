const { CONFIG } = require("./config");
const {
  getPostById,
  getUserActivePosts,
  markPostClosed,
  updatePostContent,
  listExpiredPosts,
} = require("./database");

const CLOSED_MARKER = "#CLOSED";

function buildHeader(category, closed) {
  if (!category) {
    return closed ? CLOSED_MARKER : "";
  }

  const hasMarker = category.toUpperCase().includes(CLOSED_MARKER);

  if (closed) {
    return hasMarker ? category : `${category} ${CLOSED_MARKER}`;
  }

  return hasMarker ? category.replace(new RegExp(`\\s*${CLOSED_MARKER}\\b`, "i"), "").trim() : category;
}

function buildChannelPayload(post, content, closed) {
  const header = buildHeader(post.category, closed);
  const body = content ? content.trim() : "";

  const combined = body ? `${header}\n\n${body}` : header;
  return combined.trim();
}

async function applyChannelUpdate(bot, post, content, closed) {
  const text = buildChannelPayload(post, content, closed);

  if (post.type === "text") {
    await bot.editMessageText(text, {
      chat_id: CONFIG.CHANNEL_ID,
      message_id: post.messageId,
      disable_web_page_preview: true,
    });
  } else {
    await bot.editMessageCaption(text, {
      chat_id: CONFIG.CHANNEL_ID,
      message_id: post.messageId,
    });
  }
}

async function closePost(bot, postId, options = {}) {
  const post = typeof postId === "object" ? postId : await getPostById(postId);
  if (!post) {
    throw new Error("Post tidak ditemukan.");
  }
  if (post.isClosed) {
    return post;
  }

  const closedAt = options.closedAt || new Date();
  try {
    await applyChannelUpdate(bot, post, post.message, true);
  } catch (error) {
    console.error(`Failed to edit channel message for close (post ${post.id}):`, error.message);
    throw error;
  }

  await markPostClosed(post.id, closedAt);

  return {
    ...post,
    isClosed: true,
    closedAt,
  };
}

async function editPost(bot, postId, newContent) {
  const post = await getPostById(postId);
  if (!post) {
    throw new Error("Post tidak ditemukan.");
  }
  if (post.isClosed) {
    throw new Error("Post sudah ditutup dan tidak dapat diedit.");
  }

  const content = (newContent || "").trim();

  try {
    await applyChannelUpdate(bot, post, content, false);
  } catch (error) {
    console.error(`Failed to edit channel message for edit (post ${post.id}):`, error.message);
    throw error;
  }

  await updatePostContent(post.id, content);

  return {
    ...post,
    message: content,
  };
}

async function getUserClosablePosts(userId) {
  return getUserActivePosts(userId);
}

async function closeExpiredPosts(bot, referenceDate = new Date()) {
  const expiredPosts = await listExpiredPosts(referenceDate);
  const results = [];

  for (const post of expiredPosts) {
    try {
      const closed = await closePost(bot, post, { closedAt: referenceDate, silent: true });
      results.push(closed);
    } catch (error) {
      console.error(`Failed to auto-close post ${post.id}:`, error.message);
    }
  }

  return results;
}

module.exports = {
  closePost,
  editPost,
  getUserClosablePosts,
  closeExpiredPosts,
};
