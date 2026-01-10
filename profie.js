
import supabase from './config.js';

  const avatarEl = document.getElementById('avatar')
  const nameEl = document.getElementById('fullName')
  const blogsContainer = document.getElementById('myBlogs')
  const form = document.getElementById('blogForm')

  let currentUser = null

  // 1. First check auth state and redirect if needed
  async function initPage() {
    const { data: { session }, error } = await supabase.auth.getSession()

    if (error || !session?.user) {
      Swal.fire({
        icon: 'warning',
        title: 'Not Logged In',
        text: 'Please login to access your profile',
        timer: 2500
      }).then(() => {
        window.location.href = 'login.html'
      })
      return false
    }

    currentUser = session.user
    return true
  }

  // 2. Load user profile info
  async function loadProfile() {
    if (!currentUser) return

    const { data: profile, error } = await supabase
      .from('profiles')
      .select('full_name, avatar_url')
      .eq('id', currentUser.id)
      .single()

    if (error || !profile) {
      nameEl.textContent = 'User'
      avatarEl.src = 'https://via.placeholder.com/140?text=User'
      return
    }

    nameEl.textContent = profile.full_name || 'User'
    avatarEl.src = profile.avatar_url || 'https://via.placeholder.com/140?text=' + (profile.full_name?.[0] || 'U')
  }

  // 3. Load user's blogs - now safe
  async function loadMyBlogs() {
    if (!currentUser?.id) {
      console.warn("Cannot load blogs: no user id")
      return
    }

    const { data, error } = await supabase
      .from('blogs')
      .select('id, title, content, image_url, created_at')
      .eq('user_id', currentUser.id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error("Blogs load error:", error)
      blogsContainer.innerHTML = '<p class="text-danger">Error loading your blogs...</p>'
      return
    }

    blogsContainer.innerHTML = data.length === 0 
      ? '<p class="text-center text-muted py-4">You haven\'t written any articles yet...</p>'
      : ''

    data.forEach(blog => {
      const card = `
        <div class="col-md-6 col-lg-4">
          <div class="card shadow-sm h-100">
            ${blog.image_url ? `<img src="${blog.image_url}" class="card-img-top" style="height:180px;object-fit:cover">` : ''}
            <div class="card-body">
              <h5 class="card-title">${blog.title}</h5>
              <p class="card-text text-muted">${blog.content.substring(0,90)}${blog.content.length > 90 ? '...' : ''}</p>
              <div class="d-flex gap-2 mt-3">
                <button class="btn btn-sm btn-outline-primary edit-btn" data-id="${blog.id}">
                  <i class="fas fa-edit"></i> Edit
                </button>
                <button class="btn btn-sm btn-outline-danger delete-btn" data-id="${blog.id}">
                  <i class="fas fa-trash"></i> Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      `
      blogsContainer.innerHTML += card
    })
  }

  // Run startup sequence
  (async () => {
    const isAuthenticated = await initPage()
    if (!isAuthenticated) return

    await loadProfile()
    await loadMyBlogs()
  })()

  // Rest of your code (form submit, edit/delete listeners) remains the same...
  // Just make sure all functions that use currentUser check if it exists

  // Example: protect delete/edit too
  blogsContainer.addEventListener('click', async e => {
    if (!currentUser?.id) return

    // ... your existing edit/delete logic ...
  })


// const avatarEl = document.getElementById('avatar')
//   const nameEl = document.getElementById('fullName')
//   const blogsContainer = document.getElementById('myBlogs')
//   const form = document.getElementById('blogForm')

//   let currentUser = null

//   async function loadProfile() {
//     const { data: { session } } = await supabase.auth.getSession()
//     if (!session) {
//       window.location.href = 'login.html'
//       return
//     }

//     currentUser = session.user

//     const { data: profile } = await supabase
//       .from('profiles')
//       .select('full_name, avatar_url')
//       .eq('id', currentUser.id)
//       .single()

//     nameEl.textContent = profile?.full_name || 'User'
//     avatarEl.src = profile?.avatar_url || 'https://via.placeholder.com/140'
//   }

//   async function loadMyBlogs() {
//     const { data, error } = await supabase
//       .from('blogs')
//       .select('id, title, content, image_url, created_at')
//       .eq('user_id', currentUser.id)
//       .order('created_at', { ascending: false })

//     if (error) return

//     blogsContainer.innerHTML = ''

//     data.forEach(b => {
//       const card = `
//         <div class="col-md-6 col-lg-4">
//           <div class="card shadow-sm h-100">
//             ${b.image_url ? `<img src="${b.image_url}" class="card-img-top" style="height:180px;object-fit:cover">` : ''}
//             <div class="card-body">
//               <h5>${b.title}</h5>
//               <p class="text-muted">${b.content.substring(0,90)}...</p>
//               <div class="d-flex gap-2 mt-3">
//                 <button class="btn btn-sm btn-outline-primary edit-btn" data-id="${b.id}">
//                   <i class="fas fa-edit"></i> Edit
//                 </button>
//                 <button class="btn btn-sm btn-outline-danger delete-btn" data-id="${b.id}">
//                   <i class="fas fa-trash"></i> Delete
//                 </button>
//               </div>
//             </div>
//           </div>
//         </div>
//       `
//       blogsContainer.innerHTML += card
//     })
//   }

//   // Create / Update blog
//   form.addEventListener('submit', async e => {
//     e.preventDefault()

//     const id = document.getElementById('editId').value
//     const title = document.getElementById('title').value
//     const content = document.getElementById('content').value
//     const file = document.getElementById('image').files[0]

//     let image_url = null

//     if (file) {
//       const fileName = `${Date.now()}_${file.name}`
//       const { error: uploadErr } = await supabase.storage
//         .from('blog-images')
//         .upload(fileName, file)

//       if (!uploadErr) {
//         const { data } = supabase.storage.from('blog-images').getPublicUrl(fileName)
//         image_url = data.publicUrl
//       }
//     }

//     const payload = { title, content, image_url, user_id: currentUser.id }

//     let result
//     if (id) {
//       result = await supabase.from('blogs').update(payload).eq('id', id)
//     } else {
//       result = await supabase.from('blogs').insert([payload])
//     }

//     if (result.error) {
//       Swal.fire({ icon:'error', title:'Error', text:result.error.message })
//       return
//     }

//     Swal.fire({
//       icon: 'success',
//       title: id ? 'Updated!' : 'Published!',
//       timer: 1500,
//       showConfirmButton: false
//     })

//     bootstrap.Modal.getInstance(document.getElementById('blogModal')).hide()
//     form.reset()
//     loadMyBlogs()
//   })

//   // Edit / Delete listeners (event delegation)
//   blogsContainer.addEventListener('click', async e => {
//     const btn = e.target.closest('button')
//     if (!btn) return

//     const id = btn.dataset.id

//     if (btn.classList.contains('delete-btn')) {
//       if (!confirm('Delete this article?')) return

//       const { error } = await supabase.from('blogs').delete().eq('id', id)
//       if (!error) {
//         Swal.fire({icon:'success', title:'Deleted', timer:1200})
//         loadMyBlogs()
//       }
//     }
//     else if (btn.classList.contains('edit-btn')) {
//       const { data } = await supabase.from('blogs').select('*').eq('id', id).single()
//       if (data) {
//         document.getElementById('editId').value = data.id
//         document.getElementById('title').value = data.title
//         document.getElementById('content').value = data.content
//         document.querySelector('.modal-title').textContent = 'Edit Article'
//         new bootstrap.Modal(document.getElementById('blogModal')).show()
//       }
//     }
//   })

//   // Modal reset when closed
//   document.getElementById('blogModal').addEventListener('hidden.bs.modal', () => {
//     form.reset()
//     document.getElementById('editId').value = ''
//     document.querySelector('.modal-title').textContent = 'New Article'
//   })

//   // Init
//   loadProfile()
//   loadMyBlogs()

//   // Navbar auth (same as index)
//   const authMenu = document.getElementById('authMenu')
//   supabase.auth.getSession().then(({ data }) => {
//     if (data.session) {
//       authMenu.innerHTML = `
//         <li class="nav-item"><a class="nav-link active" href="profile.html">My Profile</a></li>
//         <li class="nav-item"><button class="btn btn-outline-light btn-sm" id="logout">Logout</button></li>
//       `
//       document.getElementById('logout')?.addEventListener('click', async () => {
//         await supabase.auth.signOut()
//         location.href = 'index.html'
//       })
//     }
//   })