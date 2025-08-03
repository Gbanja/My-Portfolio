document.addEventListener('DOMContentLoaded', () => {
  // Mobile nav toggle
  const nav = document.querySelector('nav');
  document.querySelector('.menu-toggle')
    .addEventListener('click', () => nav.classList.toggle('open'));

  // Slider setup (Projects page)
  let idx = 0;
  const slides = document.querySelectorAll('.slide');
  const total = slides.length;
  document.getElementById('next')?.addEventListener('click', () => {
    idx = (idx + 1) % total;
    document.querySelector('.slides').style.transform = `translateX(-${idx*100}%)`;
  });
  document.getElementById('prev')?.addEventListener('click', () => {
    idx = (idx - 1 + total) % total;
    document.querySelector('.slides').style.transform = `translateX(-${idx*100}%)`;
  });

  // Lightbox
  const overlay = document.createElement('div');
  overlay.className = 'lightbox-overlay';
  document.body.appendChild(overlay);
  document.querySelectorAll('.lightbox').forEach(img => {
    img.addEventListener('click', () => {
      overlay.innerHTML = `<img src="${img.src}" alt="">`;
      overlay.style.display = 'flex';
    });
  });
  overlay.addEventListener('click', () => overlay.style.display = 'none');

  // Contact form → mailto
  document.querySelector('form#contactForm')?.addEventListener('submit', e => {
    e.preventDefault();
    const { name, email, message } = e.target;
    const mailto = `mailto:gbanjahcampbell.com@gmail.com
?subject=Portfolio%20Inquiry%20from%20${encodeURIComponent(name.value)}
&body=${encodeURIComponent(message.value)}%0D%0A%0D%0AFrom:%20${encodeURIComponent(name.value)}%20(${encodeURIComponent(email.value)})`;
    window.location.href = mailto;
  });
});
