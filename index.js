
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
import { supabase } from "./config.js";

const blogsContainer = document.getElementById("blogsContainer");
const authMenu = document.getElementById("authMenu");

/* ======================
   AUTH + NAVBAR
====================== */
async function checkAuthAndUpdateNav() {
  if (!authMenu) return;

  const { data: { session } } = await supabase.auth.getSession();

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

    document.getElementById("logoutBtn").addEventListener("click", async () => {
      await supabase.auth.signOut();
      location.reload();
    });
  } else {
    authMenu.innerHTML = `
      <li class="nav-item">
        <a class="nav-link" href="login.html">Login</a>
      </li>
      <li class="nav-item">
        <a class="nav-link" href="signup.html">Register</a>
      </li>
    `;
  }
}

/* ======================
   LOAD BLOGS
====================== */
async function loadBlogs() {
  if (!blogsContainer) return;

  blogsContainer.innerHTML = `
    <div class="text-center py-5">
      <div class="spinner-border"></div>
    </div>
  `;

  const { data, error } = await supabase
    .from("blogs")
    .select(`
      id,
      title,
      content,
      image_url,
      created_at,
      profiles!user_id(full_name)
    `)
    .order("created_at", { ascending: false });

  if (error) {
    console.error(error);
    blogsContainer.innerHTML =
      "<p class='text-danger text-center'>Blogs load nahi ho rahe</p>";
    return;
  }

  if (!data.length) {
    blogsContainer.innerHTML =
      "<p class='text-center text-muted'>Abhi koi blog nahi hai</p>";
    return;
  }

  blogsContainer.innerHTML = "";

  data.forEach(blog => {
    blogsContainer.innerHTML += `
      <div class="col-md-6 col-lg-4">
        <div class="card card-blog h-100 shadow-sm border-0">
          
          ${
            blog.image_url
              ? `<img src="${blog.image_url}" class="card-img-top blog-img">`
              : `<div class="bg-light d-flex align-items-center justify-content-center blog-img">
                   <i class="fa fa-image fa-2x text-muted"></i>
                 </div>`
          }

          <div class="card-body d-flex flex-column">
            <h5 class="card-title">${blog.title || "Untitled"}</h5>

            <p class="card-text text-muted">
              ${blog.content?.substring(0, 100) || ""}...
            </p>

            <small class="text-muted mt-auto">
              By ${blog.profiles?.full_name || "Anonymous"} •
              ${new Date(blog.created_at).toLocaleDateString()}
            </small>
          </div>
        </div>
      </div>
    `;
  });
}

/* ======================
   INIT
====================== */
async function init() {
  await checkAuthAndUpdateNav();
  await loadBlogs();
}

init();
