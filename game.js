/* === DOM ELEMENTS ===================================== */
const flatScene  = document.getElementById('flatScene');
const climbScene = document.getElementById('climbScene');
const topScene   = document.getElementById('topScene');

/* flat‑scene sprites */
const flatPair  = document.getElementById('flatPair');
const flatMan   = document.getElementById('flatMan');
const flatRock  = document.getElementById('flatRock');

/* climb‑scene sprites */
const wrapper   = document.getElementById('characterWrapper');
const pushMan   = document.getElementById('sisyphus');
const pushRock  = document.getElementById('rock');

/* top sprite (static hold) */
const topMan    = document.querySelector('#sisyphusTop img');

/* dialog */
const narrBox   = document.getElementById('narrBox');
const zeusLine  = document.getElementById('zeusLine');

/* === CONFIG =========================================== */
const MAX_LOOPS       = 4;
const CLIMB_END_X     = 1600;
const LEFT_QUIT_MARK  = CLIMB_END_X * 0.2;      // 20 % of slope
const GROUND_H_PX     = () => innerHeight * 0.40; // 40 vh (matches CSS)

/* === STATE ============================================ */
let stage   = 'flat';                    // flat | climb | top | end
let loops   = 0;

/* flat */ 
let flatX   = innerWidth * 0.65;
let flatRot = 0;

/* climb */
let progX   = 0;
let rotDeg  = 0;
let holding = false;
let falling = false;

/* fall QTE */
let tapTimes    = [];
let lastKey     = 'up';
let fallTimerID = null;

/* story milestones (one‑shot each loop) */
const STORY_TEMPLATE = [
  {x:200, text:"He tricked death.\nTwice."},
  {x:600, text:"He trusted his own cleverness."},
  {x:900, text:"The gods trusted punishment."},
  {x:1200,text:"They gave him eternity."}
];
let story = structuredClone(STORY_TEMPLATE);

/* Zeus lines */
const Z = {
  left:["You dare turn back?","Coward.","Going somewhere?"],
  greet:["Forward.  There is no escape."],
  taunt:["You call that effort?","Halfway? You'll fall again.","Still going? I'm impressed… not.","Don't celebrate yet."],
  fall:["Weak.","Pathetic.","Even the rock resists you."],
  laugh:["HAHAHAHAHAHA!","This is the best part."],
  loop:["Again.","Back so soon?","Try harder, fool."],
  end:["You think this is bad?\nHe does it forever…"]
};

/* === DIALOG HELPERS =================================== */
let narrActive = false;
const narrQueue = [];

function showNarr(text, dur=2800){
  if(narrActive){ narrQueue.push([text,dur]); return; }
  narrActive = true;
  narrBox.textContent = '';
  narrBox.classList.remove('hidden');
  let i=0, t=setInterval(()=>{ narrBox.textContent += text[i++] || ''; if(i>text.length) clearInterval(t); },25);
  setTimeout(()=>{ narrBox.classList.add('hidden'); narrActive=false; flushNarr(); }, dur);
}
function flushNarr(){ if(!narrActive && narrQueue.length){ const [tx,d]=narrQueue.shift(); showNarr(tx,d); } }

function showZeus(text, shake=false, dur=2000){
  zeusLine.textContent = text;
  zeusLine.classList.remove('hidden');
  if(shake){ document.body.classList.add('shake'); setTimeout(()=>document.body.classList.remove('shake'),500); }
  setTimeout(()=> zeusLine.classList.add('hidden'), dur);
}

/* === SCENE HANDLING =================================== */
function setStage(s){
  stage=s;
  flatScene .classList.toggle('hidden', s!=='flat');
  climbScene.classList.toggle('hidden', s!=='climb');
  topScene  .classList.toggle('hidden', s!=='top');
}

function resetClimb(){
  progX=0; rotDeg=0; holding=false; falling=false;
  story = structuredClone(STORY_TEMPLATE);
  wrapper.style.left='5px';
  wrapper.style.top =`${innerHeight - 90}px`;
  pushMan.classList.add('paused');

  /* reset flat pair */
  flatX = innerWidth * 0.65;
  flatPair.style.left=`${flatX}px`;
  flatRot=0; flatRock.style.transform='rotate(0deg)';
}

/* === FLAT SCENE MOVEMENT ============================== */
document.addEventListener('keydown', e=>{
  if(stage!=='flat') return;
  if(e.key!=='ArrowRight' && e.key!=='ArrowLeft') return;

  const dir = e.key==='ArrowRight'? 1 : -1;
  flatX += dir*6;
  flatX = Math.max(innerWidth*0.1, Math.min(innerWidth*0.9, flatX));
  flatPair.style.left = `${flatX}px`;

  flatRot += dir*8;
  flatRock.style.transform = `rotate(${flatRot}deg)`;

  if(dir===1 && flatX < innerWidth*0.12) showZeus(Z.greet[0]);
  if(dir===-1) showZeus(Z.left[0], true);

  if(flatX >= innerWidth*0.9){
    setStage('climb');
    showZeus("Climb, mortal.");
  }
});

/* === CLIMB INPUT ====================================== */
document.addEventListener('keydown', e=>{
  if(stage!=='climb' || e.key!=='ArrowRight') return;
  if(!falling){ holding=true; pushMan.classList.remove('paused'); }
  else if(lastKey==='up'){ tapTimes.push(Date.now()); lastKey='down'; }
});
document.addEventListener('keyup', e=>{
  if(stage!=='climb' || e.key!=='ArrowRight') return;
  holding=false; pushMan.classList.add('paused');
  if(falling) lastKey='up';
});

/* === POSITION UPDATE ================================== */
function updateClimbPos(){
  const x = 5 + progX;
  const y = innerHeight - (0.5*progX) - 90;          
  wrapper.style.left = `${x}px`;
  wrapper.style.top  = `${y}px`;
  rotDeg += 5;
  pushRock.style.transform = `rotate(${rotDeg}deg)`;
}

/* === FALL MECHANIC ==================================== */
function startFall(){
  falling=true; wrapper.classList.add('shake');
  tapTimes=[]; lastKey='up';
  showZeus("Rock slipping!", true, 1500);

  const start=Date.now();
  fallTimerID=setInterval(()=>{
    const now=Date.now();
    tapTimes = tapTimes.filter(t=> now-t<=1000);
    if(tapTimes.length>=3) stopFall(true);
    if(now-start>1500)      stopFall(false);
  },50);
}
function stopFall(success){
  clearInterval(fallTimerID); fallTimerID=null;
  falling=false; wrapper.classList.remove('shake');

  if(success){
    showZeus("Still clinging?", false, 1200);
  }else{
    showZeus(Z.fall[0], true);
    progX = Math.max(0, progX - Math.floor(progX/5));
    updateClimbPos();
  }
}

/* === MAIN LOOP ======================================== */
setStage('flat');
showZeus("Welcome back, mortal.");
resetClimb();

setInterval(()=>{
  if(stage==='climb'){

    /* Story triggers */
    story.forEach(s=>{
      if(!s.used && progX>=s.x){
        s.used=true; showNarr(s.text);
      }
    });

    /* Movement / fall (blocked during narrator) */
    if(holding && !falling && !narrActive){
      progX += 2;
      updateClimbPos();
      if(Math.random()<0.01)  startFall();
      if(Math.random()<0.002) showZeus(rand(Z.taunt));
    }

    /* Summit */
    if(progX >= CLIMB_END_X){
      setStage('top');
      summitSequence();
    }
  }
},50);

/* === TOP / LOOP / END  ================================ */
function summitSequence(){
  showZeus(rand(Z.laugh), true, 2400);

  setTimeout(()=>{
    const roll=setInterval(()=>{
      progX -= 40; updateClimbPos();
      if(progX<=0){
        clearInterval(roll);
        loops++;
        if(loops >= MAX_LOOPS){
          showNarr(Z.end[0], 4000);
          setTimeout(()=>document.body.classList.add('fade-out'), 4200);
        }else{
          showZeus(rand(Z.loop), false, 2000);
          resetClimb(); setStage('flat');
        }
      }
    },25);
  },2400);
}

/* === UTILITIES ======================================== */
function rand(arr){ return arr[Math.floor(Math.random()*arr.length)]; }

addEventListener('resize', ()=>{
  wrapper.style.top = `${innerHeight - 90 - 0.5*progX}px`;
  flatPair.style.left = `${flatX}px`;
});
