/* =========================================================
   Sisyphus Game – full script (latest, input‑lock fixed)
   ========================================================= */

/* === DOM LOOK‑UPS ===================================== */
const flatScene  = document.getElementById('flatScene');
const climbScene = document.getElementById('climbScene');
const topScene   = document.getElementById('topScene');
const endScene   = document.getElementById('endScene');

const flatPair  = document.getElementById('flatPair');
const flatMan   = document.getElementById('flatMan');
const flatRock  = document.getElementById('flatRock');
const rollAnim  = document.getElementById('rollAnim');

const wrapper   = document.getElementById('characterWrapper');
const pushMan   = document.getElementById('sisyphus');
const pushRock  = document.getElementById('rock');

const crushAnim = document.getElementById('crushAnim');

const narrBox   = document.getElementById('narrBox');
const zeusLine  = document.getElementById('zeusLine');

const endText   = document.getElementById('endText');
const proofImg  = document.getElementById('proofImg');   // optional proof picture

/* === PER‑LOOP NARRATIVES ============================== */
const LOOPS = [
  {
    intro: "Loop 1: The climb begins anew.",
    story: [
      { x:120,  text:"He once ruled Ephyra.",        dur:2600 },
      { x:400,  text:"He defied the gods.",          dur:2400 },
      { x:760,  text:"Punishment became legend.",    dur:2400 },
      { x:1050, text:"Now legend becomes routine.",  dur:2800 }
    ]
  },
  {
    intro: "Loop 2: Muscles ache… the gods smile.",
    story: [
      { x:140,  text:"Second ascent. Same rock.",    dur:2400 },
      { x:420,  text:"Hope is already thinning.",    dur:2400 },
      { x:780,  text:"Zeus watches, amused.",        dur:2400 },
      { x:1080, text:"The summit? A mirage.",        dur:2600 }
    ]
  },
  {
    intro: "Loop 3: Hope fades with every push.",
    story: [
      { x:160,  text:"His spine screams.",           dur:2400 },
      { x:450,  text:"Stones remember nothing.",     dur:2400 },
      { x:800,  text:"The gods remember everything.",dur:2400 },
      { x:1100, text:"Forever is a very long time…", dur:3000 }
    ]
  }
];
const MAX_LOOPS = LOOPS.length;

/* === ZEUS QUOTES ====================================== */
const Z = {
  left :["You dare turn back?","Coward.","Going somewhere?"],
  greet:["Forward.  There is no escape."],
  taunt:["You call that effort?","Halfway? You'll fall again.","Still going? I'm impressed… not.","Don't celebrate yet."],
  fall :["Weak.","Pathetic.","Even the rock resists you."],
  laugh:["HAHAHAHAHAHA!","This is the best part."],
  loop :["Again.","Back so soon?","Try harder, fool."],
  end  :["The lesson? Now you know how boring it is—and he must do it forever."]
};

/* === CONFIGURABLE CONSTANTS =========================== */
const CLIMB_END_X   = 1600;   // horizontal goal on slope
const CLIMB_BASE_Y  = 100;    // lower = lower character on slope
const SLIP_CHANCE   = 0.003;  // lower to reduce random slips

/* === CORE STATE ======================================= */
let stage       = 'flat';   // flat | climb | top | end
let loops       = 0;

let flatX       = innerWidth * 0.65;
let flatRot     = 0;

let progX       = 0;
let rotDeg      = 0;
let holding     = false;
let falling     = false;

let tapTimes    = [];
let lastKey     = 'up';
let fallTimerID = null;

/* HARD input‑lock so held keys cannot skip loops */
let allowInput  = true;

/* === DIALOG ENGINE ==================================== */
let narrActive  = false;
const narrQueue = [];

function showNarr(text,dur=2800){
  if(narrActive){ narrQueue.push([text,dur]); return; }
  narrActive = true;
  narrBox.textContent = ''; narrBox.classList.remove('hidden');
  let i=0, iv=setInterval(()=>{narrBox.textContent+=text[i++]||'';if(i>text.length)clearInterval(iv);},25);
  setTimeout(()=>{narrBox.classList.add('hidden'); narrActive=false; flushNarr();},dur);
}
function flushNarr(){ if(!narrActive&&narrQueue.length){ const [t,d]=narrQueue.shift(); showNarr(t,d);} }
function showZeus(text,shake=false,dur=2000){
  zeusLine.textContent=text; zeusLine.classList.remove('hidden');
  if(shake){document.body.classList.add('shake'); setTimeout(()=>document.body.classList.remove('shake'),500);}
  setTimeout(()=>zeusLine.classList.add('hidden'),dur);
}
const rand=a=>a[Math.floor(Math.random()*a.length)];

/* === STAGE HANDLER ==================================== */
function setStage(s){
  stage=s;
  flatScene .classList.toggle('hidden',s!=='flat');
  climbScene.classList.toggle('hidden',s!=='climb');
  topScene  .classList.toggle('hidden',s!=='top');
  endScene  .classList.toggle('hidden',s!=='end');
}

/* === RESET CLIMB ====================================== */
let story = [];
function resetClimb(){
  progX=rotDeg=0; holding=falling=false;
  const tmpl=LOOPS[Math.min(loops,LOOPS.length-1)];
  story = structuredClone(tmpl.story);

  wrapper.style.left='5px';
  wrapper.style.top =`${innerHeight-CLIMB_BASE_Y}px`;
  pushMan.classList.add('paused');

  flatX=innerWidth*0.65; flatPair.style.left=`${flatX}px`;
  flatRot=0; flatRock.style.transform='rotate(0deg)';

  flatMan.classList.remove('hidden'); flatRock.classList.remove('hidden');

  if(tmpl.intro) showNarr(tmpl.intro,3800);
  allowInput=true;       // re‑enable keys
}

/* === INTRO TEXT ======================================= */
setStage('flat');
resetClimb();
showNarr(
  "His punishment was permanent; Sisyphus could only keep pushing the rock up the hill, only to watch it roll down time and time again.\n" +
  "His task was futile and endless. Many think of Sisyphus's fate as aimless and miserable, as he is forced to repeat the same thing over and over again with no real results.\n\n" +
  "Albert Camus, the renowned philosopher behind The Myth of Sisyphus, argues otherwise. Camus compares Sisyphus's fate to that of human beings: constantly repeating the same mundane tasks every day, often without a true destination. Even so, Camus does not picture Sisyphus's fate as bleak. Instead, he imagines Sisyphus as content with repeating his eternal task, for Camus believes he can find meaning in his otherwise meaningless life by accepting the absurdities as his own.\n\n" +
  "After all, one must imagine Sisyphus happy.",6000);
setTimeout(()=>showZeus("Welcome back, mortal."),6500);

/* === KEY EVENTS ======================================= */
document.addEventListener('keydown',e=>{
  if(!allowInput) return;

  /* Flat‑scene walking */
  if(stage==='flat'&&(e.key==='ArrowRight'||e.key==='ArrowLeft')){
    const dir=e.key==='ArrowRight'?1:-1;
    flatX+=dir*6; flatX=Math.max(innerWidth*0.1,Math.min(innerWidth*0.9,flatX));
    flatPair.style.left=`${flatX}px`;
    flatRot+=dir*8; flatRock.style.transform=`rotate(${flatRot}deg)`;
    if(dir=== 1 && flatX<innerWidth*0.12) showZeus(Z.greet[0]);
    if(dir===-1)                          showZeus(Z.left[0],true);
    if(flatX>=innerWidth*0.9){setStage('climb'); showZeus("Climb, mortal.");}
  }

  /* Climb‑scene push */
  if(stage==='climb'&&e.key==='ArrowRight'){
    if(!falling){ holding=true; pushMan.classList.remove('paused'); }
    else if(lastKey==='up'){ tapTimes.push(Date.now()); lastKey='down'; }
  }
});
document.addEventListener('keyup',e=>{
  if(!allowInput) return;
  if(stage==='climb'&&e.key==='ArrowRight'){
    holding=false; pushMan.classList.add('paused');
    if(falling) lastKey='up';
  }
});

/* === POSITION UPDATE ================================== */
function updateClimbPos(){
  wrapper.style.left=`${5+progX}px`;
  wrapper.style.top =`${innerHeight-CLIMB_BASE_Y-0.5*progX}px`;
  rotDeg+=5; pushRock.style.transform=`rotate(${rotDeg}deg)`;
}

/* === FALL LOGIC ======================================= */
function startFall(){
  falling=true; wrapper.classList.add('shake');
  tapTimes=[];  lastKey='up'; showZeus("Rock slipping!",true,1500);
  const st=Date.now();
  fallTimerID=setInterval(()=>{
    const now=Date.now();
    tapTimes=tapTimes.filter(t=>now-t<=1000);
    if(tapTimes.length>=3) stopFall(true);
    if(now-st>1500)        stopFall(false);
  },50);
}
function stopFall(ok){
  clearInterval(fallTimerID); fallTimerID=null; falling=false; wrapper.classList.remove('shake');
  if(ok) showZeus("Still clinging?",false,1200);
  else{ showZeus(Z.fall[0],true); progX=Math.max(0,progX-Math.floor(progX/5)); updateClimbPos(); }
}

/* === MAIN LOOP ======================================== */
setInterval(()=>{
  if(stage==='climb'){
    story.forEach(s=>{ if(!s.used&&progX>=s.x){ s.used=true; showNarr(s.text,s.dur);} });
    if(holding&&!falling&&!narrActive){
      progX+=2; updateClimbPos();
      if(Math.random()<SLIP_CHANCE) startFall();
      if(Math.random()<0.002) showZeus(rand(Z.taunt));
    }
    if(progX>=CLIMB_END_X) summitSequence();
  }
},50);

/* === SUMMIT SEQUENCE ================================== */
function summitSequence(){
  setStage('top');
  allowInput=false;  // lock all keys
  holding=false;

  showZeus(rand(Z.laugh),true,2000);

  setTimeout(()=>{
    crushAnim.classList.remove('hidden');
    setTimeout(()=>{
      crushAnim.classList.add('hidden');
      setStage('flat');
      flatMan.classList.add('hidden'); flatRock.classList.add('hidden'); rollAnim.classList.remove('hidden');

      document.body.style.transition='background 0.3s';
      const oldBg=document.body.style.background;
      document.body.style.background='#000';
      setTimeout(()=>{
        document.body.style.background=oldBg;
        rollAnim.classList.add('hidden');
        flatMan.classList.remove('hidden'); flatRock.classList.remove('hidden');

        loops++;
        if(loops>=MAX_LOOPS){showEndScene(); return;}
        resetClimb();
        showZeus(rand(Z.loop),false,2200);
      },350);
    },1000);
  },2000);
}

/* === END SCENE ======================================== */
let twHandle=null;
function typeWriter(msg,spd=40){
  if(twHandle) clearInterval(twHandle);
  endText.textContent=''; let i=0;
  twHandle=setInterval(()=>{ if(i<msg.length){endText.textContent+=msg[i++];} else{clearInterval(twHandle); twHandle=null;} },spd);
}
function showEndScene(){
  setStage('end');
  typeWriter(
    "His punishment was permanent; Sisyphus could only keep pushing the rock up the hill, only to watch it roll down time and time again.\n" +
    "His task was futile and endless. Many think of Sisyphus's fate as aimless and miserable, as he is forced to repeat the same thing over and over again with no real results.\n\n" +
    "Albert Camus, the renowned philosopher behind The Myth of Sisyphus, argues otherwise. Camus compares Sisyphus's fate to that of human beings: constantly repeating the same mundane tasks every day, often without a true destination. Even so, Camus does not picture Sisyphus's fate as bleak. Instead, he imagines Sisyphus as content with repeating his eternal task, for Camus believes he can find meaning in his otherwise meaningless life by accepting the absurdities as his own.\n\n" +
    "After all, one must imagine Sisyphus happy.",45
  );
  /* proofImg.src="assets/proof.png"; proofImg.classList.remove('hidden'); */
  allowInput=false; // remain locked forever
}

/* === RESIZE HANDLER =================================== */
addEventListener('resize',()=>{
  wrapper.style.top=`${innerHeight-CLIMB_BASE_Y-0.5*progX}px`;
  flatPair.style.left=`${flatX}px`;
});
