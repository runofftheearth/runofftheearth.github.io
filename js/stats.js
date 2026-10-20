(() => {
  const activityGrid = document.querySelector("[data-activity-grid]");
  const githubCard = document.querySelector("[data-github-stats]");

  const renderActivity = () => {
    if (!activityGrid) return;
    const cells = activityGrid.querySelector(".heatmap-cells");
    const months = activityGrid.querySelector("[data-activity-months]");
    const weekdays = activityGrid.querySelector("[data-activity-days]");
    const summary = document.querySelector("[data-activity-summary]");
    if (!cells || !months || !weekdays || !summary) return;

    try {
      const postDates = JSON.parse(activityGrid.dataset.postDates || "[]");
      const counts = new Map();
      for (const date of postDates) counts.set(date, (counts.get(date) || 0) + 1);

      const today = new Date();
      const end = new Date(Date.UTC(today.getFullYear(), today.getMonth(), today.getDate()));
      const start = new Date(end);
      start.setUTCDate(start.getUTCDate() - 364);
      start.setUTCDate(start.getUTCDate() - (start.getUTCDay() + 6) % 7);
      const totalDays = Math.floor((end - start) / 86400000) + 1;
      const weekCount = Math.ceil(totalDays / 7);

      cells.replaceChildren();
      months.replaceChildren();
      activityGrid.style.setProperty("--week-count", weekCount);
      cells.style.gridTemplateColumns = `repeat(${weekCount}, 12px)`;
      months.style.gridTemplateColumns = `repeat(${weekCount}, 12px)`;
      weekdays.innerHTML = "<span></span><span>Mon</span><span></span><span>Wed</span><span></span><span>Fri</span><span></span>";

      let totalRecentPosts = 0;
      let previousMonth = -1;
      for (let offset = 0; offset < totalDays; offset += 1) {
        const date = new Date(start);
        date.setUTCDate(start.getUTCDate() + offset);
        const dateKey = date.toISOString().slice(0, 10);
        const count = counts.get(dateKey) || 0;
        const week = Math.floor(offset / 7);
        const weekday = (date.getUTCDay() + 6) % 7;

        if (date.getUTCMonth() !== previousMonth) {
          const isPartialFirstMonth = offset === 0 && date.getUTCDate() > 7;
          const label = document.createElement("span");
          label.textContent = date.toLocaleString("en", { month: "short", timeZone: "UTC" });
          label.style.gridColumn = `${week + 1}`;
          if (!isPartialFirstMonth) months.append(label);
          previousMonth = date.getUTCMonth();
        }

        const cell = document.createElement("span");
        const level = count === 0 ? 0 : count === 1 ? 1 : count <= 3 ? 2 : count <= 6 ? 3 : 4;
        cell.className = "heatmap-cell";
        cell.dataset.level = `${level}`;
        cell.style.gridColumn = `${week + 1}`;
        cell.style.gridRow = `${weekday + 1}`;
        cell.title = `${dateKey} · ${count} 篇文章`;
        cell.setAttribute("role", "gridcell");
        cell.setAttribute("aria-label", `${dateKey}，发布 ${count} 篇文章`);
        cells.append(cell);
        totalRecentPosts += count;
      }

      summary.textContent = `过去一年发布了 ${totalRecentPosts} 篇文章`;
    } catch (error) {
      console.error("无法生成文章发布热力图。", error);
      summary.textContent = "文章发布热力图暂时无法显示。";
    }
  };

  const renderBlogStatus = () => {
    const status = document.querySelector("[data-blog-start]");
    if (!status) return;
    const startValue = status.dataset.blogStart;
    const age = document.querySelector("[data-blog-age]");
    const progress = document.querySelector("[data-year-progress]");
    const ring = document.querySelector("[data-year-ring]");
    if (!startValue || !age || !progress || !ring) return;

    const start = new Date(`${startValue}T00:00:00`);
    const now = new Date();
    if (Number.isNaN(start.getTime()) || start > now) {
      age.textContent = "运行时间暂不可用";
      return;
    }

    let cursor = new Date(start);
    let years = 0;
    while (true) {
      const next = new Date(cursor);
      next.setFullYear(next.getFullYear() + 1);
      if (next > now) break;
      cursor = next;
      years += 1;
    }
    let months = 0;
    while (months < 11) {
      const next = new Date(cursor);
      next.setMonth(next.getMonth() + 1);
      if (next > now) break;
      cursor = next;
      months += 1;
    }
    const days = Math.floor((now - cursor) / 86400000);
    age.textContent = `博客已运行 ${years} 年 ${months} 个月 ${days} 天`;

    const yearStart = new Date(now.getFullYear(), 0, 1);
    const nextYear = new Date(now.getFullYear() + 1, 0, 1);
    const percent = Math.floor(((now - yearStart) / (nextYear - yearStart)) * 100);
    progress.textContent = `${percent}%`;
    ring.style.strokeDashoffset = `${270.18 * (1 - percent / 100)}`;
  };

  const renderGitHubStats = async () => {
    if (!githubCard) return;
    const status = githubCard.querySelector("[data-github-status]");
    const profile = githubCard.dataset.githubProfile;
    const username = profile ? new URL(profile).pathname.split("/").filter(Boolean)[0] : "";
    if (!username || !status) {
      if (status) status.textContent = "GitHub 主页链接无效，请直接访问个人主页。";
      return;
    }

    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 10000);
    const cacheKey = "gkblog-github-stats";
    const updateMetrics = (data) => {
      const repos = githubCard.querySelector("[data-github-repos]");
      const followers = githubCard.querySelector("[data-github-followers]");
      if (repos) repos.textContent = new Intl.NumberFormat().format(data.public_repos);
      if (followers) followers.textContent = new Intl.NumberFormat().format(data.followers);
    };
    let cachedData;
    try {
      cachedData = JSON.parse(sessionStorage.getItem(cacheKey) || "null");
      if (cachedData && Date.now() - cachedData.cachedAt < 3600000) {
        updateMetrics(cachedData);
        status.textContent = "显示最近缓存的 GitHub 数据，正在检查更新…";
      } else {
        cachedData = null;
      }
    } catch (error) {
      console.warn("无法读取 GitHub 数据缓存。", error);
      cachedData = null;
    }

    try {
      const headers = { Accept: "application/vnd.github+json" };
      const userResponse = await fetch(`https://api.github.com/users/${encodeURIComponent(username)}`, { headers, signal: controller.signal });
      if (!userResponse.ok) {
        throw new Error(`GitHub API returned ${userResponse.status}`);
      }
      const user = await userResponse.json();
      const data = { public_repos: user.public_repos, followers: user.followers, cachedAt: Date.now() };
      updateMetrics(data);
      try {
        sessionStorage.setItem(cacheKey, JSON.stringify(data));
      } catch (error) {
        console.warn("无法缓存 GitHub 公开数据。", error);
      }
      status.textContent = "数据来自 GitHub 公开 API";
    } catch (error) {
      console.error("无法加载 GitHub 公开数据。", error);
      status.textContent = cachedData
        ? "GitHub API 暂时不可用，当前显示最近缓存的数据。"
        : "GitHub 公开 API 暂时不可用，请访问主页查看最新信息。";
    } finally {
      window.clearTimeout(timeout);
    }
  };

  renderActivity();
  renderBlogStatus();
  renderGitHubStats();
})();
