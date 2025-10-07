// app.js (simplified)
const app = document.getElementById("app");

function showPage(page: string) {
  const app = document.getElementById("app"); 
  if (!app) return;
  if (page === "home") {
    app.innerHTML = "<h1>Home</h1>";
  } else if (page === "about") {
    app.innerHTML = "<h1>About</h1>";
  }
}

// Listen for navigation
window.onhashchange = () => showPage(location.hash.slice(1));

// Initial load
showPage(location.hash.slice(1) || "home");
