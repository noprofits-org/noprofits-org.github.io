document.addEventListener('DOMContentLoaded', () => {
    const hamburger = document.getElementById('hamburger');
    const navList = document.querySelector('.nav-list'); // More robust selector

    if (hamburger && navList) {
        hamburger.addEventListener('click', () => {
            navList.classList.toggle('show');
            hamburger.classList.toggle('active'); // Toggle active class on hamburger too
        });

        // Close the menu if a nav link is clicked (optional but recommended)
        navList.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => {
                navList.classList.remove('show');
                hamburger.classList.remove('active');
            });
        });

        // Close the menu if the user clicks outside of it (optional but recommended)
        document.addEventListener('click', (event) => {
            if (!navList.contains(event.target) && !hamburger.contains(event.target) && navList.classList.contains('show')) {
                navList.classList.remove('show');
                hamburger.classList.remove('active');
            }
        });
    } else {
        console.error("Hamburger or nav list element not found!");
    }
});