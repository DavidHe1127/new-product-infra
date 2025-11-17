const text = document.getElementById('main-text');

text.addEventListener('mouseover', () => {
  text.style.transform = 'scale(1.1)';
});

text.addEventListener('mouseout', () => {
  text.style.transform = 'scale(1)';
});
