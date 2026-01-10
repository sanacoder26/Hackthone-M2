
// //   import { supabase } from './config.js'

// import supabase from './config.js';

// // Load blogs and manage auth state
//   const blogsContainer = document.getElementById('blogsContainer')
//   const authMenu = document.getElementById('authMenu')

// //   async function checkAuthAndUpdateNav() {
// //     const { data: { session } } = await supabase.auth.getSession()
// //     if (session) {
// //       authMenu.innerHTML = `
// //         <li class="nav-item"><a class="nav-link" href="profile.html">My Profile</a></li>
// //         <li class="nav-item"><button class="btn btn-outline-light btn-sm" id="logout">Logout</button></li>
// //       `
// async function checkAuthAndUpdateNav() {
//     const { data: { session } } = await supabase.auth.getSession()
    
//     if (session) {
//         authMenu.innerHTML = `
//             <li class="nav-item"><a class="nav-link" href="profile.html">My Profile</a></li>
//             <li class="nav-item"><button class="btn btn-outline-light btn-sm" id="logout">Logout</button></li>
//         `;
//     }
//     // else case bhi add kar sakte ho agar chaaho
// }   
// document.getElementById('logout')?.addEventListener('click', async () => {
//         await supabase.auth.signOut()
//         location.reload()
//       })
// //     } else {
// //       authMenu.innerHTML = `
// //         <li class="nav-item"><a class="nav-link" href="login.html">Login</a></li>
// //         <li class="nav-item"><a class="btn btn-primary btn-sm" href="signup.html">Sign Up</a></li>
// //       `
// //     }
// //   }
// async function checkAuthAndUpdateNav() {
//     const { data: { session } } = await supabase.auth.getSession();
    
//     if (session) {
//         authMenu.innerHTML = `
//             <li class="nav-item"><a class="nav-link" href="profile.html">My Profile</a></li>
//             <li class="nav-item"><button class="btn btn-outline-light btn-sm" id="logout">Logout</button></li>
//         `;
//     } else {
//         authMenu.innerHTML = `
//             <li class="nav-item"><a class="nav-link" href="login.html">Login</a></li>
//             <li class="nav-item"><a class="btn btn-primary btn-sm" href="signup.html">Sign Up</a></li>
//         `;
//     }
// }
//   async function loadBlogs() {
//     const { data, error } = await supabase
//       .from('blogs')
//       .select(`
//         id, title, content, image_url, created_at,
//         user_id,
//         profiles!user_id (full_name, avatar_url)
//       `)
//       .order('created_at', { ascending: false })
//       .limit(12)

//     if (error) return console.error(error)

//     blogsContainer.innerHTML = data.length === 0 
//       ? '<p class="col-12 text-center text-muted py-5">No posts yet...</p>'
//       : ''

//     data.forEach(b => {
//       const div = document.createElement('div')
//       div.className = 'col-md-6 col-lg-4'
//       div.innerHTML = `
//         <div class="card card-blog shadow-sm h-100">
//           ${b.image_url ? `<img src="${b.image_url}" class="card-img-top blog-img" alt="">` : ''}
//           <div class="card-body d-flex flex-column">
//             <h5 class="card-title">${b.title}</h5>
//             <p class="card-text text-muted flex-grow-1">
//               ${b.content.substring(0,120)}${b.content.length > 120 ? '...' : ''}
//             </p>
//             <div class="mt-auto d-flex justify-content-between align-items-center small text-muted">
//               <div>
//                 <i class="far fa-user"></i> ${b.profiles?.full_name || 'Anonymous'}
//               </div>
//               <div>
//                 ${new Date(b.created_at).toLocaleDateString()}
//               </div>
//             </div>
//           </div>
//         </div>
//       `
//       blogsContainer.appendChild(div)
//     })
//   }

//   // Run on load
//   checkAuthAndUpdateNav()
//   loadBlogs()
import supabase from './config.js';

const blogsContainer = document.getElementById('blogsContainer');
const authMenu = document.getElementById('authMenu');

// ── Auth & Navigation 
async function checkAuthAndUpdateNav() {
    // Safety check - element exists?
    if (!authMenu) {
        console.warn("authMenu element not found in DOM");
        return;
    }

    const { data: { session }, error } = await supabase.auth.getSession();

    if (error) {
        console.error("Error getting session:", error);
        return;
    }

    if (session) {
        authMenu.innerHTML = `
            <li class="nav-item">
                <a class="nav-link" href="profile.html">My Profile</a>
            </li>
            <li class="nav-item">
                <button class="btn btn-outline-light btn-sm" id="logoutBtn">
                    Logout
                </button>
            </li>
        `;

        // Add logout listener (only after we created the button)
        document.getElementById('logoutBtn')?.addEventListener('click', async () => {
            try {
                const { error } = await supabase.auth.signOut();
                if (error) throw error;
                
                // Optional: redirect to home/login
                window.location.href = "index.html"; 
                // or just: location.reload()
            } catch (err) {
                console.error("Logout failed:", err);
                alert("Logout failed. Please try again.");
            }
        });
    } 
    else {
        authMenu.innerHTML = `
            <li class="nav-item">
                <a class="nav-link" href="login.html">Login</a>
            </li>
            <li class="nav-item">
                <a class="btn btn-primary btn-sm" href="signup.html">Sign Up</a>
            </li>
        `;
    }
}

// ── Load Blogs 
async function loadBlogs() {
    if (!blogsContainer) {
        console.warn("blogsContainer element not found");
        return;
    }

    const { data, error } = await supabase
        .from('blogs')
        .select(`
            id, 
            title, 
            content, 
            image_url, 
            created_at,
            user_id,
            profiles!user_id (full_name, avatar_url)
        `)
        .order('created_at', { ascending: false })
        .limit(12);

    if (error) {
        console.error("Error loading blogs:", error);
        blogsContainer.innerHTML = `
            <div class="col-12 text-center text-danger py-5">
                Failed to load posts. Please try again later.
            </div>
        `;
        return;
    }

    if (!data?.length) {
        blogsContainer.innerHTML = `
            <p class="col-12 text-center text-muted py-5">
                No posts yet...
            </p>`;
        return;
    }

    blogsContainer.innerHTML = ''; // clear previous content

    data.forEach(blog => {
        const div = document.createElement('div');
        div.className = 'col-md-6 col-lg-4 mb-4';

        div.innerHTML = `
            <div class="card card-blog shadow-sm h-100">
                ${blog.image_url ? `
                    <img src="${blog.image_url}" 
                         class="card-img-top blog-img" 
                         alt="${blog.title}" 
                         loading="lazy">
                ` : ''}
                
                <div class="card-body d-flex flex-column">
                    <h5 class="card-title">${blog.title || 'Untitled'}</h5>
                    
                    <p class="card-text text-muted flex-grow-1">
                        ${blog.content?.substring(0, 120) || ''}${blog.content?.length > 120 ? '...' : ''}
                    </p>

                    <div class="mt-auto d-flex justify-content-between align-items-center small text-muted">
                        <div>
                            <i class="far fa-user"></i> 
                            ${blog.profiles?.full_name || 'Anonymous'}
                        </div>
                        <div>
                            ${new Date(blog.created_at).toLocaleDateString('en-GB')}
                        </div>
                    </div>
                </div>
            </div>
        `;

        blogsContainer.appendChild(div);
    });
}

// ── Start the app
async function init() {
    await checkAuthAndUpdateNav();
    await loadBlogs();
}

init().catch(err => {
    console.error("Initialization failed:", err);
});

// show destop 
await supabase
  .from('blogs')
  .insert({
    title,
    content,
    image_url,
    user_id: (await supabase.auth.getUser()).data.user?.id
  })