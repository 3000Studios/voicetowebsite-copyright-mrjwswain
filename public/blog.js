const qs = (sel, root = document) => root.querySelector(sel);
const qsa = (sel, root = document) => Array.from(root.querySelectorAll(sel));

const escapeHtml = (value) =>
  String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

const formatDate = (value) => {
  try {
    const date = new Date(value);
    return date.toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch (_) {
    return value || "";
  }
};

const renderPosts = (posts, grid) => {
  if (!grid) return;
  grid.innerHTML = posts
    .map((post) => {
      const tags = Array.isArray(post.tags) ? post.tags : [];
      return `
        <article class="feature-card blog-card" id="${escapeHtml(post.id)}">
          <div class="blog-meta">
            <span>${escapeHtml(formatDate(post.date))}</span>
            <span>${escapeHtml(post.readTime || "")}</span>
          </div>
          <h3>${escapeHtml(post.title)}</h3>
          <p>${escapeHtml(post.excerpt)}</p>
          <div class="blog-tags">
            ${tags.map((t) => `<span class="blog-tag">${escapeHtml(t)}</span>`).join("")}
          </div>
        </article>
      `;
    })
    .join("");
};

const loadPosts = async () => {
  const status = qs("#blogAutoStatus");
  try {
    const res = await fetch("/config/blog.json", { cache: "no-store" });
    if (!res.ok) throw new Error("Blog feed unavailable.");
    const data = await res.json();
    const posts = Array.isArray(data?.posts) ? data.posts : [];
    renderPosts(posts, qs("#blogAutoGrid"));
    if (status) status.textContent = posts.length ? "" : "No posts yet.";
  } catch (err) {
    if (status) status.textContent = "Latest posts are loading.";
  }
};

const commentListEl = qs("#blogCommentList");
const commentStatusEl = qs("#blogCommentStatus");
const commentForm = qs("#blogCommentForm");

const getPostId = () =>
  String(commentListEl?.dataset?.postId || "general").trim() || "general";

const renderComments = (comments) => {
  if (!commentListEl) return;
  if (!comments.length) {
    commentListEl.innerHTML =
      "<div class='muted'>No comments yet. Be the first.</div>";
    return;
  }
  commentListEl.innerHTML = comments
    .map(
      (c) => `
      <div class="comment-card">
        <div class="comment-head">
          <strong>${escapeHtml(c.name || "Anonymous")}</strong>
          <span>${escapeHtml(formatDate(c.ts))}</span>
        </div>
        <p>${escapeHtml(c.message || "")}</p>
      </div>
    `
    )
    .join("");
};

const loadComments = async () => {
  if (!commentListEl) return;
  const postId = getPostId();
  try {
    const res = await fetch(`/api/blog/comments?post=${encodeURIComponent(postId)}`);
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data?.error || "Failed to load comments.");
    renderComments(Array.isArray(data?.comments) ? data.comments : []);
  } catch (_) {
    renderComments([]);
  }
};

const submitComment = async (payload) => {
  const res = await fetch("/api/blog/comments", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.error || "Unable to post comment.");
  return data;
};

if (commentForm) {
  commentForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (!commentStatusEl) return;
    commentStatusEl.textContent = "Posting...";
    try {
      const formData = new FormData(commentForm);
      const payload = {
        post: getPostId(),
        name: formData.get("name"),
        message: formData.get("message"),
      };
      await submitComment(payload);
      commentForm.reset();
      commentStatusEl.textContent = "Comment posted.";
      await loadComments();
    } catch (err) {
      commentStatusEl.textContent =
        err?.message || "Unable to post comment right now.";
    }
  });
}

void loadPosts();
void loadComments();
