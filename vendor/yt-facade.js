/* Click-to-load YouTube facade. Swaps the thumbnail for the real player iframe
   only on user click, so youtube.com's player never loads on initial page load. */
(function () {
  document.querySelectorAll('.yt-facade').forEach(function (el) {
    el.addEventListener('click', function () {
      var id = el.getAttribute('data-id');
      if (!id) return;
      var f = document.createElement('iframe');
      f.src = 'https://www.youtube.com/embed/' + id + '?autoplay=1&rel=0';
      f.title = el.getAttribute('data-title') || 'YouTube video';
      f.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture';
      f.setAttribute('allowfullscreen', '');
      el.replaceWith(f); // sits inside .vid-frame -> inherits .vid-frame iframe sizing
    }, { once: true });
  });
})();
