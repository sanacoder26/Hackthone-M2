

    import supabase from './config.js';

    // Same auth check as index page
    async function checkAuthAndUpdateNav() {
      const authMenu = document.getElementById('authMenu');
      if (!authMenu) return;

      const { data: { session } } = await supabase.auth.getSession();

      if (session) {
        authMenu.innerHTML = `
          <li class="nav-item"><a class="nav-link" href="profile.html">My Profile</a></li>
          <li class="nav-item"><button class="btn btn-outline-light btn-sm" id="logoutBtn">Logout</button></li>
        `;

        document.getElementById('logoutBtn')?.addEventListener('click', async () => {
          await supabase.auth.signOut();
          window.location.href = 'index.html';
        });
      } else {
        window.location.href = 'login.html'; // ← important: protect this page!
      }
    }

    // Image preview
    document.getElementById('imageInput')?.addEventListener('change', function(e) {
      const file = e.target.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = function(e) {
        const preview = document.getElementById('imagePreview');
        preview.src = e.target.result;
        preview.style.display = 'block';
      };
      reader.readAsDataURL(file);
    });

    // Create post
    document.getElementById('createPostForm')?.addEventListener('submit', async function(e) {
      e.preventDefault();
      
      const title = document.getElementById('title').value.trim();
      const content = document.getElementById('content').value.trim();
      const file = document.getElementById('imageInput').files[0];
      const publishBtn = document.getElementById('publishBtn');

      if (!title || !content) {
        alert('Title and content are required!');
        return;
      }

      publishBtn.disabled = true;
      publishBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span> Publishing...';

      try {
        let image_url = null;

        // Upload image if selected
        if (file) {
          const fileExt = file.name.split('.').pop();
          const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
          const filePath = `public/${fileName}`;

          const { error: uploadError } = await supabase.storage
            .from('blog-images')
            .upload(filePath, file);

          if (uploadError) throw uploadError;

          const { data: { publicUrl } } = supabase.storage
            .from('blog-images')
            .getPublicUrl(filePath);

          image_url = publicUrl;
        }

        // Insert blog post
        const { error } = await supabase
          .from('blogs')
          .insert({
            title,
            content,
            image_url,
            user_id: (await supabase.auth.getUser()).data.user?.id
          });

        if (error) throw error;

        alert('Post published successfully!');
        window.location.href = 'index.html';

      } catch (err) {
        console.error(err);
        alert('Error publishing post: ' + err.message);
      } finally {
        publishBtn.disabled = false;
        publishBtn.innerHTML = '<i class="fas fa-paper-plane me-2"></i> Publish Post';
      }
    });

    // Start
    checkAuthAndUpdateNav();
  