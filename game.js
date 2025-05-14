const rock = document.getElementById('rock');
const overlayText = document.getElementById('overlayText');
const hintText = document.getElementById('hintText');

let progressX = 0;
let holding = false;
let falling = false;
let showHint = true;
let tapsNeeded = 0;
let tapsDone = 0;
let rotation = 0;

function updateRockPosition() {
    const x = 5 + progressX;
    const y = window.innerHeight - (0.5 * progressX) - 90; 
  
    const wrapper = document.getElementById('characterWrapper');
    wrapper.style.left = `${x}px`;
    wrapper.style.top = `${y}px`;
  
    rotation += 5;
    rock.style.transform = `rotate(${rotation}deg)`;
  }  
  

function startFalling() {
  falling = true;
  tapsNeeded = Math.floor(Math.random() * 8) + 5;
  tapsDone = 0;
  overlayText.textContent = "Rock slipping!";
  overlayText.style.display = 'block';

  if (showHint) {
    hintText.style.display = 'block';
    showHint = false;
    setTimeout(() => hintText.style.display = 'none', 3000);
  }
}

function stopFalling() {
  falling = false;
  overlayText.style.display = 'none';
}

setInterval(() => {
  if (holding && !falling) {
    progressX += 2;
    updateRockPosition();

    if (Math.random() < 0.01) {
      startFalling();
    }
  }
}, 50);

document.addEventListener('keydown', (e) => {
  if (e.key === 'ArrowRight') {
    if (!falling) {
      holding = true;
      overlayText.style.display = 'none';
    } else {
      tapsDone++;
      if (tapsDone >= tapsNeeded) {
        stopFalling();
      }
    }
  }
});

document.addEventListener('keyup', (e) => {
  if (e.key === 'ArrowRight') {
    holding = false;
  }
});
