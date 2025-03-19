 // Toggle mobile menu
 document.querySelector(".mobile-nav-toggle").addEventListener("click", function() {
    document.querySelector(".nav-links").classList.toggle("active");
});
 // JavaScript for Accordion
 document.querySelectorAll(".accordion-header").forEach(button => {
    button.addEventListener("click", function () {
        const content = this.nextElementSibling;
        this.classList.toggle("active");
        if (content.style.maxHeight) {
            content.style.maxHeight = null;
        } else {
            content.style.maxHeight = content.scrollHeight + "px";
        }
    });
});
document.addEventListener("DOMContentLoaded", function () {
    const questions = document.querySelectorAll(".question");
  
    questions.forEach((question) => {
        question.addEventListener("click", function () {
            const answer = this.nextElementSibling;
            const icon = this.querySelector(".toggle-icon");
  
            if (answer.style.display === "block") {
                answer.style.display = "none";
                icon.textContent = "+";
            } else {
                answer.style.display = "block";
                icon.textContent = "−";
            }
        });
    });
  });
  document.addEventListener("DOMContentLoaded", function () {
    // Preloader
    let preloader = document.getElementById("preloader");
    window.onload = function () {
        preloader.classList.add("hidden");
    };

    // Back to Top Button
    let backToTop = document.querySelector(".back-to-top");

    window.addEventListener("scroll", function () {
        if (window.scrollY > 300) {
            backToTop.style.display = "block";
        } else {
            backToTop.style.display = "none";
        }
    });

    // Smooth scroll to top
    backToTop.addEventListener("click", function (e) {
        e.preventDefault();
        window.scrollTo({
            top: 0,
            behavior: "smooth",
        });
    });
});
