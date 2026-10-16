function makeResourceGroup(name, files) {
  const group = document.createElement("div");
  group.className = "resource-group";

  const summary = document.createElement("button");
  summary.type = "button";
  summary.className = "folder-header";
  const courseName = document.createElement("span");
  courseName.className = "folder-name";
  courseName.textContent = name;
  const count = document.createElement("span");
  count.className = "folder-count";
  count.textContent = `(${files.length} file${files.length === 1 ? "" : "s"} available)`;
  summary.append(courseName, count);
  summary.addEventListener("click", () => group.classList.toggle("open"));

  const links = document.createElement("ul");
  links.className = "folder-contents";
  const viewer = document.createElement("div");
  viewer.className = "inline-viewer";
  viewer.hidden = true;

  files.forEach(file => {
    const item = document.createElement("li");
    const link = document.createElement("a");
    link.className = "resource-link";
    link.href = file.path;
    link.textContent = file.name.replace(/\.pdf$/i, "");
    link.addEventListener("click", event => {
      event.preventDefault();
      const alreadyOpen = link.classList.contains("active");
      links.querySelectorAll(".active").forEach(item => item.classList.remove("active"));
      if (alreadyOpen) {
        viewer.hidden = true;
        viewer.replaceChildren();
        return;
      }

      link.classList.add("active");
      const bar = document.createElement("div");
      bar.className = "viewer-bar";
      const label = document.createElement("span");
      label.textContent = file.name;
      const close = document.createElement("button");
      close.type = "button";
      close.textContent = "Close";
      close.addEventListener("click", () => {
        link.classList.remove("active");
        viewer.hidden = true;
        viewer.replaceChildren();
      });
      bar.append(label, close);

      const frame = document.createElement("iframe");
      frame.src = file.path;
      frame.title = file.name;
      viewer.replaceChildren(bar, frame);
      viewer.hidden = false;
      viewer.scrollIntoView({ behavior: "smooth", block: "nearest" });
    });
    item.append(link);
    links.append(item);
  });

  group.append(summary, links, viewer);
  return group;
}

async function loadResources() {
  const container = document.querySelector("#resources-container");
  try {
    const response = await fetch("./resources.json");
    if (!response.ok) throw new Error("Resource list unavailable");
    const manifest = await response.json();
    const groups = Object.entries(manifest.groups || {});
    container.replaceChildren(...groups.map(([name, files]) => makeResourceGroup(name, files)));
  } catch (error) {
    container.innerHTML = '<p class="loading">The resource list could not be loaded. Reload the page to try again.</p>';
  }
}

loadResources();

document.querySelector("#practice-reveal")?.addEventListener("click", event => {
  event.preventDefault();
  const games = document.querySelector("#games");
  games.hidden = false;
  games.scrollIntoView({ behavior: "smooth", block: "start" });
});
