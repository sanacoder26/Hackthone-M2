
import supabase from './config.js';

  import { supabase } from './config.js';

const avatarEl       = document.getElementById('avatar');
const nameEl         = document.getElementById('fullName');
const blogsContainer = document.getElementById('myBlogs');
const blogForm       = document.getElementById('blogForm');
const editIdInput    = document.getElementById('editId');
const titleInput     = document.getElementById('title');
const contentInput   = document.getElementById('content');
const imageInput     = document.getElementById('image');
const imagePreview   = document.getElementById('imagePreview');
const submitBtn      = document.getElementById('submitBtn');

let currentUser = null;

// 1. Check authentication & redirect if not logged in
async function init() {
  const { data: { session } } = await supabase.auth.getSession();

  if (!session?.user) {
    Swal.fire({
      icon: 'warning',
      title: 'Access Denied',
      text: 'Please login first',
      timer: 2000
    }).then(() => window.location.href = 'login.html');
    return false;
  }

  currentUser = session.user;
  return true;
}

// 2. Load profile data
async function loadProfile() {
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('full_name, avatar_url')
    .eq('id', currentUser.id)
    .single();

  if (error || !profile) {
    nameEl.textContent = 'User';
    avatarEl.src = 'https://via.placeholder.com/160?text=U';
    return;
  }

  nameEl.textContent = profile.full_name || 'User';
  avatarEl.src = profile.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.full_name || 'User')}&size=160`;
}

// 3. Load user's blogs with image
async function loadMyBlogs() {
  blogsContainer.innerHTML = '<div class="col-12 text-center py-5"><div class="spinner-border text-primary" role="status"></div></div>';

  const { data, error } = await supabase
    .from('blogs')
    .select('id, title, content, image_url, created_at')
    .eq('user_id', currentUser.id)
    .order('created_at', { ascending: false });

  if (error) {
    blogsContainer.innerHTML = '<p class="text-danger text-center py-4">Error loading articles...</p>';
    console.error(error);
    return;
  }

  if (data.length === 0) {
    blogsContainer.innerHTML = `
      <div class="col-12 text-center py-5 text-muted">
        <h5>You haven't published any articles yet</h5>
        <p class="mt-2">Start sharing your thoughts now!</p>
      </div>
    `;
    return;
  }

  blogsContainer.innerHTML = '';

  data.forEach(blog => {
    const card = document.createElement('div');
    card.className = 'col-md-6 col-lg-4';
    card.innerHTML = `
      <div class="card shadow-sm h-100 border-0">
        ${blog.image_url ? `
          <img src="${blog.image_url}" class="card-img-top" alt="${blog.title}" style="height:180px; object-fit:cover;">
        ` : `
          <div class="bg-light d-flex align-items-center justify-content-center" style="height:180px;">
            <i class="fas fa-image fa-3x text-secondary"></i>
          </div>
        `}
        <div class="card-body d-flex flex-column">
          <h5 class="card-title">${blog.title}</h5>
          <p class="card-text text-muted flex-grow-1">
            ${blog.content.substring(0, 90)}${blog.content.length > 90 ? '...' : ''}
          </p>
          <div class="mt-auto d-flex gap-2">
            <button class="btn btn-sm btn-outline-primary edit-btn" data-id="${blog.id}">
              <i class="fas fa-edit"></i> Edit
            </button>
            <button class="btn btn-sm btn-outline-danger delete-btn" data-id="${blog.id}">
              <i class="fas fa-trash"></i> Delete
            </button>
          </div>
        </div>
      </div>
    `;
    blogsContainer.appendChild(card);
  });
}

// 4. Image preview when selecting file
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

// Start everything
(async () => {
  const authenticated = await init();
  if (!authenticated) return;

  await loadProfile();
  await loadMyBlogs();

  // Here you can add edit/delete modal handling logic
  // For now just showing data with images is fixed
})();