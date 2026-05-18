import supabase from './config.js';

// DOM Elements
const blogsContainer = document.getElementById('blogsContainer');
const authMenu = document.getElementById('authMenu');
const heroActions = document.getElementById('heroActions');
const searchInput = document.getElementById('searchInput');
const postCount = document.getElementById('postCount');

// Edit Modal Elements
const feedEditModalEl = document.getElementById('feedEditModal');
const feedEditForm = document.getElementById('feedEditForm');
const editBlogId = document.getElementById('editBlogId');
const editTitle = document.getElementById('editTitle');
const editContent = document.getElementById('editContent');
const editImageInput = document.getElementById('editImageInput');
const editImagePreview = document.getElementById('editImagePreview');
const existingImageUrl = document.getElementById('existingImageUrl');
const saveEditBtn = document.getElementById('saveEditBtn');

// State variables
let allBlogs = [];
let currentUser = null;
let bootstrapEditModal = null;
let isDemoMode = false;

// Curated Premium Mock Data for fallback if Supabase is paused/offline
const mockBlogs = [
  {
    id: 'mock-1',
    title: 'The Art of Minimalist Web Design',
    content: 'In a world filled with digital noise, minimalism is a breath of fresh air. Clean lines, generous white space, and a focused color palette can elevate any user experience from chaotic to premium. Learn how to pare down your interfaces to the absolute essentials without sacrificing utility or visual delight.',
    image_url: 'https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?auto=format&fit=crop&w=600&q=80',
    created_at: new Date(Date.now() - 3600000 * 24).toISOString(),
    user_id: 'mock-author-1',
    profiles1: {
      full_name: 'Sarah Connor',
      avatar_url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80'
    }
  },
  {
    id: 'mock-2',
    title: 'Mastering Asynchronous JavaScript',
    content: 'Promises, async/await, and generators—JavaScript’s asynchronous landscape can be intimidating for beginners. But once you understand the event loop and how call stacks handle concurrent executions, writing clean, non-blocking asynchronous code becomes second nature. Let’s demystify async JS step-by-step.',
    image_url: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=600&q=80',
    created_at: new Date(Date.now() - 3600000 * 48).toISOString(),
    user_id: 'mock-author-2',
    profiles1: {
      full_name: 'Alex Rivera',
      avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80'
    }
  },
  {
    id: 'mock-3',
    title: 'Exploring the Wonders of HSL Color Space',
    content: 'Why do premium websites have such harmonious color schemes? The secret lies in HSL (Hue, Saturation, Lightness). Unlike RGB or Hex, HSL makes it intuitive to generate lighter tints, darker shades, and complementary colors dynamically. Here is a developer’s complete guide to mastering colors in CSS.',
    image_url: 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?auto=format&fit=crop&w=600&q=80',
    created_at: new Date(Date.now() - 3600000 * 72).toISOString(),
    user_id: 'mock-author-3',
    profiles1: {
      full_name: 'Elena Rostova',
      avatar_url: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=150&q=80'
    }
  }
];

/* ==========================================================
   1. AUTHENTICATION & NAVBAR INITIALIZATION
   ========================================================== */
async function checkAuthAndUpdateNav() {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    currentUser = session?.user || null;
  } catch (e) {
    console.warn('Auth session check failed, running in guest mode.', e);
    currentUser = null;
  }

  if (currentUser) {
    // Populate navigation for logged-in user
    if (authMenu) {
      authMenu.innerHTML = `
        <li class="nav-item">
          <a class="nav-link nav-link-premium" href="profile.html"><i class="far fa-user-circle me-1"></i>My Profile</a>
        </li>
        <li class="nav-item">
          <a class="btn btn-premium btn-sm ms-2" href="creat.html"><i class="fas fa-plus me-1"></i>Write a Post</a>
        </li>
        <li class="nav-item">
          <button class="btn btn-premium-outline btn-sm ms-2" id="logoutBtn"><i class="fas fa-sign-out-alt me-1"></i>Logout</button>
        </li>
      `;

      document.getElementById('logoutBtn')?.addEventListener('click', async () => {
        const result = await Swal.fire({
          title: 'Are you sure?',
          text: 'You will be logged out of your session.',
          icon: 'question',
          showCancelButton: true,
          confirmButtonColor: '#4f46e5',
          cancelButtonColor: '#94a3b8',
          confirmButtonText: 'Yes, logout'
        });

        if (result.isConfirmed) {
          await supabase.auth.signOut();
          Swal.fire({
            title: 'Logged Out',
            text: 'You have been successfully logged out.',
            icon: 'success',
            timer: 1500,
            showConfirmButton: false
          }).then(() => {
            location.reload();
          });
        }
      });
    }

    // Populate Hero Actions
    if (heroActions) {
      heroActions.innerHTML = `
        <a href="creat.html" class="btn btn-premium btn-lg px-4"><i class="fas fa-feather-alt me-2"></i>Create New Post</a>
        <a href="profile.html" class="btn btn-premium-outline btn-lg px-4"><i class="fas fa-user me-2"></i>Manage My Profile</a>
      `;
    }
  } else {
    // Populate navigation for guest user
    if (authMenu) {
      authMenu.innerHTML = `
        <li class="nav-item">
          <a class="nav-link nav-link-premium" href="login.html">Login</a>
        </li>
        <li class="nav-item">
          <a class="btn btn-premium btn-sm ms-2" href="signup.html">Get Started</a>
        </li>
      `;
    }

    // Populate Hero Actions
    if (heroActions) {
      heroActions.innerHTML = `
        <a href="login.html" class="btn btn-premium btn-lg px-4"><i class="fas fa-sign-in-alt me-2"></i>Write a Story</a>
        <a href="signup.html" class="btn btn-premium-outline btn-lg px-4">Register Now</a>
      `;
    }
  }
}

/* ==========================================================
   2. LOAD & RENDER BLOG FEED
   ========================================================== */
async function loadBlogs() {
  if (!blogsContainer) return;

  blogsContainer.innerHTML = `
    <div class="col-12 text-center py-5">
      <div class="spinner-border text-primary" role="status" style="width: 3rem; height: 3rem;">
        <span class="visually-hidden">Loading...</span>
      </div>
      <p class="text-muted mt-3">Fetching fresh articles...</p>
    </div>
  `;

  try {
    // Fetch blogs along with profile info
    const { data, error } = await supabase
      .from('blogs')
      .select(`
        id,
        title,
        content,
        image_url,
        created_at,
        user_id,
        profiles1!user_id (full_name, avatar_url)
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;
    
    allBlogs = data || [];
    isDemoMode = false;
  } catch (error) {
    console.error('Error fetching blogs from Supabase, loading fallback mock data:', error);
    allBlogs = mockBlogs;
    isDemoMode = true;
  }

  renderBlogs(allBlogs);
}

function renderBlogs(blogs) {
  if (!blogsContainer) return;

  if (postCount) {
    postCount.textContent = `${blogs.length} ${blogs.length === 1 ? 'Article' : 'Articles'}`;
  }

  blogsContainer.innerHTML = '';

  // If in demo mode, prepend a beautiful, glassmorphic notice explaining why mock data is shown
  if (isDemoMode && blogs.length > 0) {
    const noticeDiv = document.createElement('div');
    noticeDiv.className = 'col-12 mb-4';
    noticeDiv.innerHTML = `
      <div class="card border-0 shadow-sm rounded-4" style="background: linear-gradient(135deg, rgba(239, 68, 68, 0.05), rgba(79, 70, 229, 0.05)); border: 1px solid rgba(79, 70, 229, 0.1) !important;">
        <div class="card-body p-4 d-flex align-items-start gap-3">
          <div class="bg-indigo-light p-2 rounded-circle text-primary" style="background: rgba(79, 70, 229, 0.1); width: 44px; height: 44px; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
            <i class="fas fa-plug fa-lg"></i>
          </div>
          <div>
            <h6 class="fw-bold text-dark mb-1">Supabase Database Connection Note</h6>
            <p class="small text-muted mb-0">
              Your Supabase project backend is currently paused or inactive (free tier standard). 
              <strong>Restoring your project</strong> in the Supabase Dashboard will instantly load live database articles. 
              Showing premium demonstration articles in the meantime so you can explore the design!
            </p>
          </div>
        </div>
      </div>
    `;
    blogsContainer.appendChild(noticeDiv);
  }

  if (blogs.length === 0) {
    blogsContainer.innerHTML = `
      <div class="col-12 text-center py-5 text-muted">
        <i class="far fa-newspaper fa-4x mb-3 text-secondary"></i>
        <h5 class="fw-bold">No articles match your search</h5>
        <p class="small">Be the first to share your thoughts!</p>
        ${currentUser ? '<a href="creat.html" class="btn btn-premium btn-sm mt-2">Write a Post</a>' : '<a href="login.html" class="btn btn-premium btn-sm mt-2">Login to post</a>'}
      </div>
    `;
    return;
  }

  blogs.forEach(blog => {
    // In demo mode, let the current user (if logged in) or the first author represent their cards
    const isOwner = currentUser && (currentUser.id === blog.user_id || isDemoMode);
    const authorName = blog.profiles1?.full_name || 'Anonymous';
    
    // Generates high-quality avatar fallback if null
    const avatarUrl = blog.profiles1?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(authorName)}&background=random&color=fff&size=100`;
    
    // Nice gradient overlay image fallback if image is missing
    const hasImage = !!blog.image_url;
    const coverImageHtml = hasImage 
      ? `<img src="${blog.image_url}" class="blog-img" alt="${blog.title}" loading="lazy">` 
      : `<div class="blog-img d-flex flex-column align-items-center justify-content-center text-white" style="height: 100%; background: linear-gradient(135deg, #a5b4fc, #818cf8);">
           <i class="fas fa-feather-alt fa-3x mb-2 opacity-75"></i>
           <span class="small font-monospace opacity-75">No Cover Image</span>
         </div>`;

    // Only owners can edit or delete
    const ownerActionsHtml = isOwner ? `
      <div class="blog-actions-overlay">
        <button class="btn-action-overlay btn-edit-overlay" onclick="openEditPost('${blog.id}')" title="Edit Post">
          <i class="fas fa-pen-nib"></i>
        </button>
        <button class="btn-action-overlay btn-delete-overlay" onclick="deletePost('${blog.id}')" title="Delete Post">
          <i class="fas fa-trash-alt"></i>
        </button>
      </div>
    ` : '';

    const blogCard = document.createElement('div');
    blogCard.className = 'col-md-6 col-lg-4';
    blogCard.innerHTML = `
      <div class="card card-blog-premium h-100">
        <div class="blog-img-container">
          <span class="blog-badge"><i class="fas fa-journal-whills me-1"></i>Story</span>
          ${ownerActionsHtml}
          ${coverImageHtml}
        </div>
        <div class="card-body card-body-premium">
          <h5 class="blog-card-title">
            <a href="#" class="blog-title-link" onclick="viewFullPost('${blog.id}')">${blog.title || 'Untitled'}</a>
          </h5>
          <p class="blog-card-text">
            ${blog.content ? (blog.content.substring(0, 110) + (blog.content.length > 110 ? '...' : '')) : 'No content available.'}
          </p>
          <div class="author-meta">
            <img src="${avatarUrl}" class="author-avatar" alt="${authorName}">
            <div class="author-info">
              <span class="author-name">${authorName}</span>
              <span class="blog-date"><i class="far fa-clock me-1"></i>${new Date(blog.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
            </div>
          </div>
        </div>
      </div>
    `;
    blogsContainer.appendChild(blogCard);
  });
}

/* ==========================================================
   3. INLINE SEARCH FILTERING
   ========================================================== */
if (searchInput) {
  searchInput.addEventListener('input', (e) => {
    const term = e.target.value.toLowerCase().trim();
    if (!term) {
      renderBlogs(allBlogs);
      return;
    }

    const filtered = allBlogs.filter(blog => {
      const title = (blog.title || '').toLowerCase();
      const content = (blog.content || '').toLowerCase();
      const author = (blog.profiles1?.full_name || '').toLowerCase();
      return title.includes(term) || content.includes(term) || author.includes(term);
    });

    renderBlogs(filtered);
  });
}

/* ==========================================================
   4. INLINE POST DELETION (OWNER ONLY)
   ========================================================== */
window.deletePost = async function(id) {
  // If in demo mode, do a local mock delete to show off responsiveness!
  if (isDemoMode) {
    const result = await Swal.fire({
      title: '[Demo Mode] Delete this post?',
      text: "This will perform a simulation delete of this mock post locally.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#94a3b8',
      confirmButtonText: 'Yes, delete it simulated!',
      customClass: { popup: 'dark-swal-popup' }
    });

    if (result.isConfirmed) {
      allBlogs = allBlogs.filter(b => b.id !== id);
      renderBlogs(allBlogs);
      Swal.fire({
        icon: 'success',
        title: 'Deleted (Simulated)',
        text: 'The article was deleted from your simulated browser session.',
        timer: 1500,
        showConfirmButton: false,
        customClass: { popup: 'dark-swal-popup' }
      });
    }
    return;
  }

  const result = await Swal.fire({
    title: 'Are you sure?',
    text: "This action will permanently delete your blog post. It cannot be recovered!",
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#ef4444',
    cancelButtonColor: '#94a3b8',
    confirmButtonText: '<i class="fas fa-trash-alt me-1"></i> Yes, delete it!',
    cancelButtonText: 'Cancel',
    customClass: {
      popup: 'dark-swal-popup'
    }
  });

  if (!result.isConfirmed) return;

  try {
    const { error } = await supabase
      .from('blogs')
      .delete()
      .eq('id', id)
      .eq('user_id', currentUser.id); // Guarded by logged-in user id

    if (error) throw error;

    await Swal.fire({
      icon: 'success',
      title: 'Deleted!',
      text: 'Your article has been successfully deleted.',
      timer: 1500,
      showConfirmButton: false,
      customClass: {
        popup: 'dark-swal-popup'
      }
    });

    // Reload the feed
    await loadBlogs();
  } catch (err) {
    console.error('Error deleting blog:', err);
    Swal.fire({
      icon: 'error',
      title: 'Deletion Failed',
      text: err.message,
      customClass: {
        popup: 'dark-swal-popup'
      }
    });
  }
};

/* ==========================================================
   5. INLINE POST EDITING (OWNER ONLY)
   ========================================================== */
window.openEditPost = function(id) {
  const blog = allBlogs.find(b => b.id === id);
  if (!blog) return;

  // Initialize Bootstrap Modal if not already done
  if (!bootstrapEditModal && feedEditModalEl) {
    bootstrapEditModal = new bootstrap.Modal(feedEditModalEl);
  }

  // Populate Modal Fields
  editBlogId.value = blog.id;
  editTitle.value = blog.title || '';
  editContent.value = blog.content || '';
  existingImageUrl.value = blog.image_url || '';
  
  if (blog.image_url) {
    editImagePreview.src = blog.image_url;
    editImagePreview.style.display = 'block';
  } else {
    editImagePreview.src = '';
    editImagePreview.style.display = 'none';
  }

  // Reset file input
  if (editImageInput) editImageInput.value = '';

  // Show Modal
  bootstrapEditModal.show();
};

// Edit Modal File Input Preview
if (editImageInput) {
  editImageInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      editImagePreview.src = ev.target.result;
      editImagePreview.style.display = 'block';
    };
    reader.readAsDataURL(file);
  });
}

// Edit Form Submit Handler
if (feedEditForm) {
  feedEditForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const id = editBlogId.value;
    const title = editTitle.value.trim();
    const content = editContent.value.trim();
    const file = editImageInput.files[0];

    if (!title || !content) {
      Swal.fire('Required Fields', 'Title and content are required.', 'warning');
      return;
    }

    saveEditBtn.disabled = true;
    saveEditBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-1"></span> Saving...';

    // If in demo mode, do a local mock update!
    if (isDemoMode) {
      const blogIdx = allBlogs.findIndex(b => b.id === id);
      if (blogIdx !== -1) {
        allBlogs[blogIdx].title = title;
        allBlogs[blogIdx].content = content;
        if (file) {
          allBlogs[blogIdx].image_url = editImagePreview.src;
        }
        renderBlogs(allBlogs);
      }
      if (bootstrapEditModal) bootstrapEditModal.hide();
      Swal.fire({
        icon: 'success',
        title: 'Story Updated (Simulated)',
        text: 'The article was updated in your simulated browser session.',
        timer: 1500,
        showConfirmButton: false,
        customClass: { popup: 'dark-swal-popup' }
      });
      saveEditBtn.disabled = false;
      saveEditBtn.innerHTML = '<i class="fas fa-check-circle me-1"></i> Save Changes';
      return;
    }

    try {
      let image_url = existingImageUrl.value;

      // Upload new image if selected
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

      // Update blog in Supabase
      const { error } = await supabase
        .from('blogs')
        .update({
          title,
          content,
          image_url
        })
        .eq('id', id)
        .eq('user_id', currentUser.id); // Guarded by logged-in user id

      if (error) throw error;

      // Close modal
      if (bootstrapEditModal) {
        bootstrapEditModal.hide();
      }

      await Swal.fire({
        icon: 'success',
        title: 'Story Updated!',
        text: 'Your article has been successfully updated.',
        timer: 1500,
        showConfirmButton: false,
        customClass: { popup: 'dark-swal-popup' }
      });

      // Reload feed
      await loadBlogs();

    } catch (err) {
      console.error('Error updating blog:', err);
      Swal.fire({
        icon: 'error',
        title: 'Update Failed',
        text: err.message,
        customClass: { popup: 'dark-swal-popup' }
      });
    } finally {
      saveEditBtn.disabled = false;
      saveEditBtn.innerHTML = '<i class="fas fa-check-circle me-1"></i> Save Changes';
    }
  });
}

/* ==========================================================
   6. VIEW FULL POST DIALOG
   ========================================================== */
window.viewFullPost = function(id) {
  const blog = allBlogs.find(b => b.id === id);
  if (!blog) return;

  const authorName = blog.profiles1?.full_name || 'Anonymous';
  const postDate = new Date(blog.created_at).toLocaleDateString(undefined, { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });

  Swal.fire({
    title: `<div class="text-start fs-3 fw-bold" style="font-family:'Outfit',sans-serif; color: #1e293b;">${blog.title}</div>`,
    html: `
      <div class="text-start mt-2 border-bottom pb-3 mb-3 d-flex align-items-center gap-2">
        <i class="far fa-user text-primary"></i> <strong>${authorName}</strong> 
        <span class="text-muted">•</span> 
        <span class="text-muted">${postDate}</span>
      </div>
      ${blog.image_url ? `
        <div class="my-3 text-center" style="max-height: 350px; overflow: hidden; border-radius: 12px;">
          <img src="${blog.image_url}" class="img-fluid w-100" style="object-fit: cover; max-height:350px;" alt="">
        </div>
      ` : ''}
      <div class="text-start fs-6 mt-3 leading-relaxed text-slate-700" style="white-space: pre-wrap; font-family:'Plus Jakarta Sans',sans-serif; line-height: 1.7; color: #475569;">
        ${blog.content}
      </div>
    `,
    width: '800px',
    confirmButtonText: 'Close',
    confirmButtonColor: '#4f46e5',
    customClass: {
      popup: 'rounded-4'
    }
  });
};

/* ==========================================================
   7. INITIALIZATION
   ========================================================== */
async function init() {
  await checkAuthAndUpdateNav();
  await loadBlogs();
}

init();
