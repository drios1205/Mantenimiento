document.addEventListener("DOMContentLoaded", function () {
    const tarjetasValores = document.querySelectorAll(".value-card");
    const tarjetasEquipo = document.querySelectorAll(".team-card");

    tarjetasValores.forEach(function (tarjeta) {
        tarjeta.style.transition = "0.3s ease";
        tarjeta.style.borderColor = "transparent";

        tarjeta.addEventListener("mouseenter", function () {
            tarjeta.style.borderColor = "#ff4f8b";
            tarjeta.style.transform = "translateY(-6px)";
            tarjeta.style.boxShadow = "0 12px 28px rgba(255, 79, 139, 0.15)";
        });

        tarjeta.addEventListener("mouseleave", function () {
            tarjeta.style.borderColor = "transparent";
            tarjeta.style.transform = "translateY(0)";
            tarjeta.style.boxShadow = "none";
        });
    });

    tarjetasEquipo.forEach(function (tarjeta) {
        tarjeta.style.transition = "0.3s ease";
        tarjeta.style.borderColor = "transparent";
        tarjeta.style.boxShadow = "0 8px 24px rgba(16, 25, 66, 0.08)";

        tarjeta.addEventListener("mouseenter", function () {
            tarjeta.style.borderColor = "#ff4f8b";
            tarjeta.style.transform = "translateY(-6px)";
            tarjeta.style.boxShadow = "0 14px 32px rgba(255, 79, 139, 0.12)";
        });

        tarjeta.addEventListener("mouseleave", function () {
            tarjeta.style.borderColor = "transparent";
            tarjeta.style.transform = "translateY(0)";
            tarjeta.style.boxShadow = "0 8px 24px rgba(16, 25, 66, 0.08)";
        });
    });
});