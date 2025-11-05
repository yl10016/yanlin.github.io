// Smooth scrolling, nav highlight, and PDF viewer logic

document.addEventListener('DOMContentLoaded', function () {
    // Smooth scroll for nav links
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', function (e) {
            const targetId = this.getAttribute('href').slice(1);
            const target = document.getElementById(targetId);
            if (target) {
                e.preventDefault();
                window.scrollTo({
                    top: target.offsetTop - 90,
                    behavior: 'smooth'
                });
            }
        });
    });

    // Highlight nav on scroll
    const sections = document.querySelectorAll('main .section');
    const navLinks = document.querySelectorAll('.nav-link');
    window.addEventListener('scroll', function () {
        let current = '';
        sections.forEach(section => {
            const sectionTop = section.offsetTop - 100;
            if (window.scrollY >= sectionTop) {
                current = section.getAttribute('id');
            }
        });
        navLinks.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href').slice(1) === current) {
                link.classList.add('active');
            }
        });
    });

    // PDF resource viewer and dynamic resources
    const pdfViewerContainer = document.getElementById('pdf-viewer-container');
    const pdfViewer = document.getElementById('pdf-viewer');
    const closePdfBtn = document.getElementById('close-pdf');
    let currentPdf = null;

    // Event delegation for resource link clicks (dynamic + static)
    const resourcesContainer = document.getElementById('resources-container');
    document.addEventListener('click', function (e) {
        const target = e.target.closest && e.target.closest('.resource-link');
        if (!target) return;
        // Only handle links with data-pdf
        const pdfPath = target.getAttribute('data-pdf');
        if (!pdfPath) return;
        e.preventDefault();
        if (pdfViewerContainer.style.display === 'block' && currentPdf === pdfPath) {
            pdfViewer.setAttribute('src', '');
            pdfViewerContainer.style.display = 'none';
            currentPdf = null;
        } else {
            pdfViewer.setAttribute('src', pdfPath);
            pdfViewerContainer.style.display = 'block';
            currentPdf = pdfPath;
            setTimeout(() => {
                pdfViewer.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }, 200);
        }
    });
    if (closePdfBtn) {
        closePdfBtn.addEventListener('click', function () {
            pdfViewer.setAttribute('src', '');
            pdfViewerContainer.style.display = 'none';
            currentPdf = null;
        });
    }

    // Load resources manifest and render folders
    function renderResources(manifest) {
        const container = document.getElementById('resources-container');
        if (!container) return;
        container.innerHTML = '';

        // Optional: Render resume as a folder-style group if present in manifest
        if (manifest.resume) {
            const files = [{ name: 'Resume (PDF)', path: manifest.resume }];
            const groupDiv = document.createElement('div');
            groupDiv.className = 'resource-group';

            const header = document.createElement('button');
            header.type = 'button';
            header.className = 'folder-header';
            header.innerHTML = `<span class="folder-name">Resume</span> <span class="folder-count">(${files.length} files available)</span>`;
            header.addEventListener('click', function () {
                groupDiv.classList.toggle('open');
            });

            const contents = document.createElement('ul');
            contents.className = 'folder-contents';
            files.forEach(file => {
                const li = document.createElement('li');
                const a = document.createElement('a');
                a.href = file.path;
                a.className = 'resource-link';
                a.setAttribute('data-pdf', file.path);
                a.textContent = file.name;
                li.appendChild(a);
                contents.appendChild(li);
            });

            groupDiv.appendChild(header);
            groupDiv.appendChild(contents);
            container.appendChild(groupDiv);
        }

        const groups = manifest.groups || {};
        const groupNames = Object.keys(groups).sort();
        groupNames.forEach(groupName => {
            const files = groups[groupName];
            const groupDiv = document.createElement('div');
            groupDiv.className = 'resource-group';

            const header = document.createElement('button');
            header.type = 'button';
            header.className = 'folder-header';
            header.innerHTML = `<span class="folder-name">${groupName}</span> <span class="folder-count">(${files.length} files available)</span>`;
            header.addEventListener('click', function () {
                groupDiv.classList.toggle('open');
            });

            const contents = document.createElement('ul');
            contents.className = 'folder-contents';
            files.forEach(file => {
                const li = document.createElement('li');
                const a = document.createElement('a');
                a.href = file.path;
                a.className = 'resource-link';
                a.setAttribute('data-pdf', file.path);
                a.textContent = file.name;
                li.appendChild(a);
                contents.appendChild(li);
            });

            groupDiv.appendChild(header);
            groupDiv.appendChild(contents);
            container.appendChild(groupDiv);
        });
    }

    // Fetch and render resources.json if available
    fetch('./resources.json').then(resp => {
        if (!resp.ok) throw new Error('resources.json not found');
        return resp.json();
    }).then(manifest => {
        renderResources(manifest);
    }).catch(err => {
        // If manifest missing, don't break the page. Leave container empty.
        console.warn('Could not load resources.json:', err);
    });
});
