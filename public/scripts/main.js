

function toggleProfileDropdown() {
    const dropdown = document.getElementById('profileDropdown-v');
    dropdown.style.display = dropdown.style.display === 'block' ? 'none' : 'block';
}

// Close dropdown if clicking outside of profile
document.addEventListener('click', function(event) {
    const profile = document.querySelector('.profilev-v');
    const dropdown = document.getElementById('profileDropdown-v');
    if (!profile.contains(event.target)) {
        dropdown.style.display = 'none';
    }
});








