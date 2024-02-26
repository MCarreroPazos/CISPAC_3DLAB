console.log('Bienvenido a la página web del LARC!');

function toggleMenu() {
    var menu = document.querySelector('nav ul');
    if (menu.style.display === "block") {
        menu.style.display = "none";
    } else {
        menu.style.display = "block";
    }
}
