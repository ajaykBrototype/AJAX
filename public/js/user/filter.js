function toggleSidebar(open) {
    lucide.createIcons();
      document.body.classList.toggle('sidebar-open', open);
      if (open) {
        document.body.style.overflow = 'hidden';
      } else {
        document.body.style.overflow = '';
      }
    }