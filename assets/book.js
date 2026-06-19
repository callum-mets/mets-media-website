const layer = document.getElementById("confettiLayer");
const colors = ["#b8860b", "#151515", "#ffffff", "#d21d1d"];

for (let i = 0; i < 90; i += 1) {
  const piece = document.createElement("span");
  piece.className = "confetti";
  piece.style.left = `${Math.random() * 100}%`;
  piece.style.background = colors[i % colors.length];
  piece.style.animationDelay = `${Math.random() * 0.8}s`;
  piece.style.animationDuration = `${2.1 + Math.random() * 1.4}s`;
  piece.style.transform = `rotate(${Math.random() * 180}deg)`;
  layer.appendChild(piece);
}

window.setTimeout(() => {
  layer.remove();
}, 4200);
