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

    // PDF resource viewer
    const resourceLinks = document.querySelectorAll('.resource-link');
    const pdfViewerContainer = document.getElementById('pdf-viewer-container');
    const pdfViewer = document.getElementById('pdf-viewer');
    const closePdfBtn = document.getElementById('close-pdf');
    let currentPdf = null;
    resourceLinks.forEach(link => {
        link.addEventListener('click', function (e) {
            e.preventDefault();
            const pdfPath = this.getAttribute('data-pdf');
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
    });
    if (closePdfBtn) {
        closePdfBtn.addEventListener('click', function () {
            pdfViewer.setAttribute('src', '');
            pdfViewerContainer.style.display = 'none';
            currentPdf = null;
        });
    }
});
