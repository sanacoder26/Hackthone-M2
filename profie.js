import supabase from './config.js';

// DOM Elements
const avatarEl = document.getElementById('avatar');
const nameEl = document.getElementById('fullName');
const blogsContainer = document.getElementById('myBlogs');
const blogForm = document.getElementById('blogForm');
const editIdInput = document.getElementById('editId');
const existingImageUrlInput = document.getElementById('existingImageUrl');
const titleInput = document.getElementById('title');
const contentInput = document.getElementById('content');
const imageInput = document.getElementById('image');
const imagePreview = document.getElementById('imagePreview');
const submitBtn = document.getElementById('submitBtn');
const newArticleBtn = document.getElementById('newArticleBtn');
const logoutBtn = document.getElementById('logoutBtn');
const blogModalEl = document.getElementById('blogModal');

let currentUser = null;
let bootstrapBlogModal = null;
let myBlogsList = [];

/* ==========================================================
   1. SESSION CHECK & INITIALIZATION
   ========================================================== */
async function init() {
  const { data: { session } } = await supabase.auth.getSession();

  if (!session?.user) {
    Swal.fire({
      icon: 'warning',
      title: 'Access Denied',
      text: 'Please login to access your Author Studio dashboard.',
      confirmButtonColor: '#4f46e5',
      customClass: { popup: 'dark-swal-popup' }
    }).then(() => {
      window.location.href = 'login.html';
    });
    return false;
  }

  currentUser = session.user;
  
  // Set up bootstrap modal reference
  if (blogModalEl) {
    bootstrapBlogModal = new bootstrap.Modal(blogModalEl);
  }
  
  return true;
}

/* ==========================================================
   2. LOAD PROFILE DETAILS
   ========================================================== */
async function loadProfile() {
  const { data: profile, error } = await supabase
    .from('profiles1')
    .select('full_name, avatar_url')
    .eq('id', currentUser.id)
    .single();

  const fallbackName = currentUser.email ? currentUser.email.split('@')[0] : 'Author';
  let displayName = fallbackName;
  let avatarUrl = '';

  if (!error && profile) {
    displayName = profile.full_name || fallbackName;
    avatarUrl = profile.avatar_url;
  }

  nameEl.textContent = displayName;
  avatarEl.src = avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&size=160&background=random&color=fff`;
}

/* ==========================================================
   3. LOAD AUTHOR'S PERSONAL ARTICLES
   ========================================================== */
async function loadMyBlogs() {
  if (!blogsContainer) return;

  blogsContainer.innerHTML = `
    <div class="col-12 text-center py-5">
      <div class="spinner-border text-primary" role="status" style="width: 2.5rem; height: 2.5rem;">
        <span class="visually-hidden">Loading...</span>
      </div>
      <p class="text-muted small mt-2">Opening your collection...</p>
    </div>
  `;

  const { data, error } = await supabase
    .from('blogs')
    .select('id, title, content, image_url, created_at')
    .eq('user_id', currentUser.id)
    .order('created_at', { ascending: false });

  if (error) {
    blogsContainer.innerHTML = `
      <div class="col-12 text-center py-5 text-danger">
        <i class="fas fa-exclamation-triangle fa-2x mb-2"></i>
        <h5>Error loading your articles</h5>
        <p class="small text-muted">${error.message}</p>
      </div>
    `;
    console.error(error);
    return;
  }

  myBlogsList = data || [];

  if (myBlogsList.length === 0) {
    blogsContainer.innerHTML = `
      <div class="col-12 text-center py-5 text-muted">
        <i class="far fa-folder-open fa-3x mb-3 text-secondary"></i>
        <h5 class="fw-bold">Your studio is empty</h5>
        <p class="small">You haven't published any articles yet. Start sharing your knowledge now!</p>
        <button class="btn btn-premium btn-sm mt-2" onclick="openCreateModal()">
          <i class="fas fa-plus-circle me-1"></i> Write Your First Post
        </button>
      </div>
    `;
    return;
  }

  blogsContainer.innerHTML = '';

  myBlogsList.forEach(blog => {
    const card = document.createElement('div');
    card.className = 'col-md-6 col-lg-4';
    
    // Generates cover HTML
    const coverHtml = blog.image_url 
      ? `<img src="${blog.image_url}" class="blog-img" alt="${blog.title}" loading="lazy">` 
      : `<div class="blog-img d-flex flex-column align-items-center justify-content-center text-white" style="height: 100%; background: linear-gradient(135deg, #a5b4fc, #818cf8);">
           <i class="fas fa-feather-alt fa-2x mb-1 opacity-75"></i>
           <span class="small font-monospace opacity-75" style="font-size: 0.75rem;">No Cover</span>
         </div>`;

    card.innerHTML = `
      <div class="card card-blog-premium h-100">
        <div class="blog-img-container">
          ${coverHtml}
        </div>
        <div class="card-body card-body-premium">
          <h5 class="blog-card-title">${blog.title || 'Untitled'}</h5>
          <p class="blog-card-text">
            ${blog.content ? (blog.content.substring(0, 90) + (blog.content.length > 90 ? '...' : '')) : 'No content available.'}
          </p>
          <div class="mt-auto d-flex justify-content-between align-items-center pt-2" style="border-top: 1px solid #f1f5f9;">
            <small class="text-muted"><i class="far fa-clock me-1"></i>${new Date(blog.created_at).toLocaleDateString()}</small>
            <div class="d-flex gap-2">
              <button class="btn btn-sm btn-outline-primary rounded-pill px-3 edit-article-btn" data-id="${blog.id}">
                <i class="fas fa-edit me-1"></i>Edit
              </button>
              <button class="btn btn-sm btn-outline-danger rounded-pill px-3 delete-article-btn" data-id="${blog.id}">
                <i class="fas fa-trash-alt me-1"></i>Delete
              </button>
            </div>
          </div>
        </div>
      </div>
    `;
    blogsContainer.appendChild(card);
  });
}

/* ==========================================================
   4. MODAL STATE & ACTIONS (CREATE VS EDIT)
   ========================================================== */
// File Upload Image Preview
if (imageInput) {
  imageInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      imagePreview.src = ev.target.result;
      imagePreview.style.display = 'block';
    };
    reader.readAsDataURL(file);
  });
}

// Reset form for creating new article
window.openCreateModal = function() {
  if (blogForm) blogForm.reset();
  editIdInput.value = '';
  existingImageUrlInput.value = '';
  imagePreview.src = '';
  imagePreview.style.display = 'none';
  
  document.getElementById('blogModalLabel').textContent = 'Write New Article';
  submitBtn.textContent = 'Publish Article';

  if (bootstrapBlogModal) {
    bootstrapBlogModal.show();
  }
};

// Hook the original New Article button
if (newArticleBtn) {
  newArticleBtn.addEventListener('click', (e) => {
    e.preventDefault();
    openCreateModal();
  });
}

// Open modal in edit mode
function openEditModal(id) {
  const blog = myBlogsList.find(b => b.id === id);
  if (!blog) return;

  if (blogForm) blogForm.reset();
  
  editIdInput.value = blog.id;
  titleInput.value = blog.title || '';
  contentInput.value = blog.content || '';
  existingImageUrlInput.value = blog.image_url || '';
  
  if (blog.image_url) {
    imagePreview.src = blog.image_url;
    imagePreview.style.display = 'block';
  } else {
    imagePreview.src = '';
    imagePreview.style.display = 'none';
  }

  document.getElementById('blogModalLabel').textContent = 'Edit Article';
  submitBtn.textContent = 'Save Changes';

  if (bootstrapBlogModal) {
    bootstrapBlogModal.show();
  }
}

// Handle Form Submission (Create or Edit)
if (blogForm) {
  blogForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const id = editIdInput.value;
    const title = titleInput.value.trim();
    const content = contentInput.value.trim();
    const file = imageInput.files[0];

    if (!title || !content) {
      Swal.fire('Required Fields', 'Title and content are required.', 'warning');
      return;
    }

    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-1"></span> Processing...';

    try {
      let image_url = existingImageUrlInput.value || null;

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

      if (id) {
        // Mode: Edit existing post
        const { error } = await supabase
          .from('blogs')
          .update({
            title,
            content,
            image_url
          })
          .eq('id', id)
          .eq('user_id', currentUser.id);

        if (error) throw error;

        await Swal.fire({
          icon: 'success',
          title: 'Article Updated',
          text: 'Your article was successfully updated in your collection.',
          timer: 1500,
          showConfirmButton: false,
          customClass: { popup: 'dark-swal-popup' }
        });
      } else {
        // Mode: Create new post
        const { error } = await supabase
          .from('blogs')
          .insert({
            title,
            content,
            image_url,
            user_id: currentUser.id
          });

        if (error) throw error;

        await Swal.fire({
          icon: 'success',
          title: 'Article Published!',
          text: 'Your new article has been published successfully.',
          timer: 1500,
          showConfirmButton: false,
          customClass: { popup: 'dark-swal-popup' }
        });
      }

      // Close modal
      if (bootstrapBlogModal) {
        bootstrapBlogModal.hide();
      }

      // Reload articles
      await loadMyBlogs();

    } catch (err) {
      console.error('Error saving article:', err);
      Swal.fire({
        icon: 'error',
        title: 'Operation Failed',
        text: err.message,
        customClass: { popup: 'dark-swal-popup' }
      });
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = id ? 'Save Changes' : 'Publish Article';
    }
  });
}

/* ==========================================================
   5. HANDLE EVENT DELEGATION FOR CARD ACTIONS
   ========================================================== */
if (blogsContainer) {
  blogsContainer.addEventListener('click', async (e) => {
    const editBtn = e.target.closest('.edit-article-btn');
    const deleteBtn = e.target.closest('.delete-article-btn');

    if (editBtn) {
      e.preventDefault();
      const id = editBtn.dataset.id;
      openEditModal(id);
    } else if (deleteBtn) {
      e.preventDefault();
      const id = deleteBtn.dataset.id;
      confirmDeleteArticle(id);
    }
  });
}

async function confirmDeleteArticle(id) {
  const result = await Swal.fire({
    title: 'Delete this article?',
    text: 'This action is irreversible and will permanently delete the post.',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#ef4444',
    cancelButtonColor: '#94a3b8',
    confirmButtonText: 'Yes, delete it!',
    cancelButtonText: 'Cancel',
    customClass: { popup: 'dark-swal-popup' }
  });

  if (!result.isConfirmed) return;

  try {
    const { error } = await supabase
      .from('blogs')
      .delete()
      .eq('id', id)
      .eq('user_id', currentUser.id);

    if (error) throw error;

    await Swal.fire({
      icon: 'success',
      title: 'Deleted!',
      text: 'The article has been removed from your dashboard.',
      timer: 1500,
      showConfirmButton: false,
      customClass: { popup: 'dark-swal-popup' }
    });

    await loadMyBlogs();
  } catch (err) {
    console.error('Error deleting article:', err);
    Swal.fire({
      icon: 'error',
      title: 'Deletion Failed',
      text: err.message,
      customClass: { popup: 'dark-swal-popup' }
    });
  }
}

/* ==========================================================
   6. LOGOUT ACTION
   ========================================================== */
if (logoutBtn) {
  logoutBtn.addEventListener('click', async (e) => {
    e.preventDefault();
    const result = await Swal.fire({
      title: 'Logout?',
      text: 'Are you sure you want to end your Author Session?',
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

/* ==========================================================
   7. INITIALIZATION START
   ========================================================== */
(async () => {
  const authenticated = await init();
  if (!authenticated) return;

  await loadProfile();
  await loadMyBlogs();
})();