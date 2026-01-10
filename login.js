
import supabase from './config.js';

// Login


  const form = document.getElementById('loginForm')

  form.addEventListener('submit', async (e) => {
    e.preventDefault()

    const email = document.getElementById('email').value.trim()
    const password = document.getElementById('password').value

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      })

      if (error) throw error

      // Success
      await Swal.fire({
        icon: 'success',
        title: 'Login Successful!',
        text: 'Redirecting to your profile...',
        timer: 1500,
        showConfirmButton: false,
        customClass: {
          popup: 'dark-swal-popup'
        }
      })

      window.location.href = 'profile.html'  // or 'index.html' - your choice

    } catch (err) {
      Swal.fire({
        icon: 'error',
        title: 'Login Failed',
        text: err.message.includes('Invalid login credentials') 
          ? 'Incorrect email or password' 
          : err.message,
        customClass: {
          popup: 'dark-swal-popup'
        }
      })
    }
  })

