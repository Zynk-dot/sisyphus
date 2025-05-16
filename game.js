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
      { x:140,  text:"Alas, sisyphus had no choice but to get up and start pushing the rock once more. He had truly angered the gods, after all.",        dur:5200 },
      { x:420,  text:"Though he was a cunning and strategic ruler, Sisyphus was also recklessly egotistical, killing off visitors just to flaunt his power.",          dur:5800 },
      { x:740,  text:"As hospitality was a sacred and crucial aspect of Greek culture, Sisyphus's blatant violation of these traditions enraged Zeus.",    dur:5200 },
      { x:1020, text:"As punishment for his actions and attempted escapes of death, the gods had him punished eternally.",  dur:4800 }
    ]
  },
  {
    intro: "Loop 3: Hope fades with every push.",
    story: [
      { x:160,  text:"Sisyphus is no hero. He had no mentor to guide him, no return to his home in the living realm or chance to experience his old lifestyle once again.",dur:5400 },
      { x:320,  text:"Even so, his journey resembles that of a hero. He is taken out of the comfort of his kingdom, faces countless trials of gods attempting to end him, and ends up with a new life at the end of it all.",dur:6000 },
      { x:650,  text:"First, Zeus sends out death itself, Thanatos, to chain Sisyphus in the underworld. Using his craftiness, Sisyphus tricks Thanatos and chains him instead.",dur:5200 },
      { x:800, text:"When Sisyphus is caught, he tells his wife to throw him into the river, eventually washing up in the Styx. In the underworld, he tells Persephone that he his wife disrespected him, and that he should be allowed revenge.", dur:6400 },
      { x:1050, text:"Persephone agrees to let him back into the living world as long as he returns after punishing his wife. He breaks his promise and does not return. Zeus is maddened by his continuous escape from death.",dur:6100}
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
const CLIMB_END_X   = 1080;   // horizontal goal on slope
const CLIMB_BASE_Y  = 60;    // lower = lower character on slope
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
  tapTimes=[];  lastKey='up'; showZeus("Rock slipping! (quickly tap arrow key!)",true,1500);
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
