(() => {
  const commentWidgets = [...document.querySelectorAll("[data-twikoo-comments]")];
  const recentList = document.querySelector("[data-twikoo-recent-list]");
  const recentStatus = document.querySelector("[data-twikoo-recent-status]");
  if (!commentWidgets.length && !recentList) return;

  const reportFailure = (message, error) => {
    console.error(`[Twikoo] ${message}`, error);
    document.querySelectorAll("[data-twikoo-status]").forEach((status) => {
      status.textContent = "评论暂时无法加载，请稍后再试。";
    });
    if (recentStatus) {
      recentStatus.textContent = "最新评论暂时无法加载。";
      recentStatus.hidden = false;
    }
  };

  const getArticleUrl = (comment, articlePaths) => {
    if (typeof comment.url !== "string" || !comment.url) return null;

    try {
      const target = new URL(comment.url, window.location.origin);
      if (target.protocol !== "https:" && target.protocol !== "http:") return null;
      const path = decodeURIComponent(target.pathname).replace(/\/+$/, "") || "/";
      return articlePaths[`${path}/`] || articlePaths[target.pathname] || null;
    } catch (error) {
      console.error("[Twikoo] Could not parse a recent comment URL.", error);
      return null;
    }
  };

  const renderRecentComments = (comments, articlePaths) => {
    recentList.replaceChildren();

    comments.forEach((comment, index) => {
      const item = document.createElement("li");
      const link = document.createElement("a");
      link.className = "archive-recent-comment";
      link.href = `${window.location.origin}${getArticleUrl(comment, articlePaths)}`;

      if (comment.avatar) {
        const avatar = document.createElement("img");
        avatar.src = comment.avatar;
        avatar.alt = "";
        avatar.loading = "lazy";
        avatar.onerror = () => avatar.remove();
        link.append(avatar);
      }

      const content = document.createElement("span");
      content.className = "archive-recent-comment-copy";
      const author = document.createElement("b");
      author.textContent = comment.nick || "访客";
      const text = document.createElement("span");
      text.textContent = comment.commentText || comment.comment || "";
      const date = document.createElement("time");
      const created = new Date(comment.created);
      if (Number.isFinite(created.getTime())) {
        date.textContent = created.toLocaleDateString("zh-CN", {
          month: "2-digit",
          day: "2-digit",
        });
      }
      content.append(author, text);
      link.append(content, date);
      item.append(link);
      recentList.append(item);

      if (index < comments.length - 1) {
        const divider = document.createElement("li");
        divider.className = "archive-recent-comment-divider";
        divider.setAttribute("aria-hidden", "true");
        recentList.append(divider);
      }
    });
  };

  const envNode = document.querySelector("[data-twikoo-env-id]");
  const envId = envNode?.dataset.twikooEnvId;
  if (!envId) {
    reportFailure("Missing Twikoo envId configuration.");
    return;
  }

  const script = document.createElement("script");
  script.src = "https://cdn.jsdmirror.com/npm/twikoo@1.6.44/dist/twikoo.min.js";
  script.async = true;
  script.crossOrigin = "anonymous";
  script.onload = () => {
    const twikoo = window.twikoo;
    if (!twikoo || typeof twikoo.init !== "function") {
      reportFailure("Twikoo script loaded without exposing its initialization API.");
      return;
    }

    commentWidgets.forEach((widget) => {
      const status = widget.parentElement.querySelector("[data-twikoo-status]");
      Promise.resolve()
        .then(() =>
          twikoo.init({
            envId,
            el: `#${widget.id}`,
            path: widget.dataset.pageKey,
            lang: "zh-CN",
          }),
        )
        .then(() => {
          if (status) status.hidden = true;
        })
        .catch((error) => reportFailure("Could not initialize the comments.", error));
    });

    if (recentList) {
      if (typeof twikoo.getRecentComments !== "function") {
        reportFailure("Twikoo recent-comments API is unavailable.");
        return;
      }

      let articlePaths;
      try {
        const pathNode = document.querySelector("[data-twikoo-article-paths]");
        if (!pathNode) throw new Error("Article comment paths are missing.");
        articlePaths = JSON.parse(pathNode.dataset.twikooArticlePaths);
      } catch (error) {
        reportFailure("Could not parse the article comment paths.", error);
        return;
      }

      let recentRequestPending = false;
      let hasRecentComments = false;
      const refreshRecentComments = () => {
        if (recentRequestPending || document.visibilityState === "hidden") return;
        recentRequestPending = true;

        Promise.resolve()
          .then(() =>
            twikoo.getRecentComments({
              envId,
              pageSize: 100,
              includeReply: false,
              el: "",
            }),
          )
          .then((comments) => {
            const articleComments = comments
              .filter((comment) => getArticleUrl(comment, articlePaths))
              .slice(0, 3);
            if (!articleComments.length) {
              recentList.replaceChildren();
              recentStatus.textContent = "暂无文章评论。";
              recentStatus.hidden = false;
              return;
            }

            renderRecentComments(articleComments, articlePaths);
            hasRecentComments = true;
            recentStatus.hidden = true;
          })
          .catch((error) => {
            console.error("[Twikoo] Could not load recent comments.", error);
            recentStatus.textContent = hasRecentComments
              ? "最新评论更新失败，显示上次加载的内容。"
              : "最新评论暂时无法加载。";
            recentStatus.hidden = false;
          })
          .finally(() => {
            recentRequestPending = false;
          });
      };

      refreshRecentComments();
      window.setInterval(refreshRecentComments, 30_000);
      document.addEventListener("visibilitychange", refreshRecentComments);
    }
  };
  script.onerror = (error) => reportFailure("Could not load the Twikoo script.", error);
  document.head.append(script);
})();
