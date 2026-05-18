import supabase from './config.js';

// DOM Elements
const authMenu = document.getElementById('authMenu');
const imageInput = document.getElementById('imageInput');
const imagePreview = document.getElementById('imagePreview');
const createPostForm = document.getElementById('createPostForm');
const publishBtn = document.getElementById('publishBtn');

let currentUser = null;

/* ==========================================================
   1. AUTHENTICATION & ACCESS GUARD
   ========================================================== */
async function checkAuthAndUpdateNav() {
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session?.user) {
    // Save current path to query params so we can redirect back after login
    Swal.fire({
      icon: 'warning',
      title: 'Authentication Required',
      text: 'Please login to write a new story.',
      confirmButtonColor: '#4f46e5',
      customClass: { popup: 'dark-swal-popup' }
    }).then(() => {
      window.location.href = 'login.html';
    });
    return;
  }

  currentUser = session.user;

  // Render navigation elements
  if (authMenu) {
    authMenu.innerHTML = `
      <li class="nav-item">
        <a class="nav-link nav-link-premium" href="index.html">Home Feed</a>
      </li>
      <li class="nav-item">
        <a class="nav-link nav-link-premium" href="profile.html"><i class="far fa-user-circle me-1"></i>My Studio</a>
      </li>
      <li class="nav-item">
        <button class="btn btn-premium-outline btn-sm ms-3" id="logoutBtn"><i class="fas fa-sign-out-alt me-1"></i>Logout</button>
      </li>
    `;

    document.getElementById('logoutBtn')?.addEventListener('click', async () => {
      const result = await Swal.fire({
        title: 'Logout?',
        text: 'Are you sure you want to end your writing session?',
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: '#4f46e5',
        cancelButtonColor: '#94a3b8',
        confirmButtonText: 'Logout',
        cancelButtonText: 'Cancel',
        customClass: { popup: 'dark-swal-popup' }
      });

      if (result.isConfirmed) {
        await supabase.auth.signOut();
        window.location.href = 'index.html';
      }
    });
  }
}

/* ==========================================================
   2. COVER IMAGE UPLOAD PREVIEW
   ========================================================== */
if (imageInput) {
  imageInput.addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      Swal.fire({
        icon: 'error',
        title: 'File Too Large',
        text: 'Image size must be less than 5MB.',
        customClass: { popup: 'dark-swal-popup' }
      });
      imageInput.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = function(ev) {
      if (imagePreview) {
        imagePreview.src = ev.target.result;
        imagePreview.style.display = 'block';
      }
    };
    reader.readAsDataURL(file);
  });
}

/* ==========================================================
   3. WRITE / CREATE NEW POST ACTION
   ========================================================== */
if (createPostForm) {
  createPostForm.addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const title = document.getElementById('title').value.trim();
    const content = document.getElementById('content').value.trim();
    const file = imageInput.files[0];

    if (!title || !content) {
      Swal.fire({
        icon: 'warning',
        title: 'Validation Error',
        text: 'Title and content are required!',
        customClass: { popup: 'dark-swal-popup' }
      });
      return;
    }

    publishBtn.disabled = true;
    publishBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span> Publishing...';

    // Show loading popup
    Swal.fire({
      title: 'Publishing your story...',
      text: 'Please wait while we upload your content.',
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      },
      customClass: { popup: 'dark-swal-popup' }
    });

    try {
      let image_url = null;

      // Upload cover image to Supabase Storage if selected
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

      // Insert new blog post with logged-in user id
      const { error } = await supabase
        .from('blogs')
        .insert({
          title,
          content,
          image_url,
          user_id: currentUser.id
        });

      if (error) throw error;

      // Close loading popup and show success
      Swal.close();

      await Swal.fire({
        icon: 'success',
        title: 'Story Published!',
        text: 'Your article has been successfully published to the main feed.',
        timer: 2000,
        showConfirmButton: false,
        customClass: { popup: 'dark-swal-popup' }
      });

      // Redirect back to home feed
      window.location.href = 'index.html';

    } catch (err) {
      console.error('Error publishing article:', err);
      Swal.close();
      
      Swal.fire({
        icon: 'error',
        title: 'Publication Failed',
        text: err.message,
        confirmButtonColor: '#4f46e5',
        customClass: { popup: 'dark-swal-popup' }
      });

      publishBtn.disabled = false;
      publishBtn.innerHTML = '<i class="fas fa-paper-plane me-2"></i> Publish Story';
    }
  });
}

/* ==========================================================
   4. INITIATE
   ========================================================== */
checkAuthAndUpdateNav();