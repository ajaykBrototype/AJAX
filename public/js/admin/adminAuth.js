document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('adminLoginForm');
    const emailInput = document.getElementById('email');
    const passInput = document.getElementById('password');
    const submitBtn = document.getElementById('submit-btn');
    const eyeBtn = document.getElementById('eye-toggle');

    if (eyeBtn) {
        eyeBtn.addEventListener('click', () => {
            passInput.type = passInput.type === 'password' ? 'text' : 'password';
        });
    }

    const showError = (field, show, msg = "") => {
        const el = document.getElementById(field);
        const txt = document.getElementById('err-' + field);
        if (msg && txt) txt.innerText = msg;
        
        if (show) { 
            if (el) el.classList.add('error'); 
            if (txt) txt.classList.add('show'); 
        } else { 
            if (el) el.classList.remove('error'); 
            if (txt) txt.classList.remove('show'); 
        }
    }

    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            submitBtn.innerText = "AUTHENTICATING...";
            submitBtn.disabled = true;

            showError('email', false);
            showError('password', false);

            try {
                const res = await axios.post("/admin/login", {
                    email: emailInput.value,
                    password: passInput.value
                });
                if (res.data.redirect) {
                    ajaxToast('success', 'IDENTITY VERIFIED');
                    setTimeout(() => { window.location.href = res.data.redirect; }, 800);
                }
            } catch (err) {
                submitBtn.innerText = "VERIFY IDENTITY";
                submitBtn.disabled = false;

                const errors = err.response?.data?.errors;
                if (errors?.email) showError('email', true, errors.email[0]);
                if (errors?.password) showError('password', true, errors.password[0]);
                if (errors?.general) ajaxAlert('error', errors.general[0]);
            }
        });
    }
});
