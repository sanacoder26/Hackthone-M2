
// script.js
import supabase from './config.js';



  const form = document.getElementById('signupForm')

  form.addEventListener('submit', async (e) => {
    e.preventDefault()
    
    const fullName = document.getElementById('name').value.trim()
    const email = document.getElementById('email').value.trim()
    const password = document.getElementById('password').value

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: fullName }
        }
      })

      if (error) throw error

      await Swal.fire({
        icon: 'success',
        title: 'Account Created!',
        text: 'You can now login.',
        customClass: { popup: 'dark-swal-popup' }
      })

      window.location.href = 'login.html'
    } catch (err) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: err.message,
        customClass: { popup: 'dark-swal-popup' }
      })
    }
  })

