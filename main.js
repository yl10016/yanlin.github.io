const RACKS = ["planet","stream","listen","master","orange","friend","garden","castle","thread","rescue","linear","sector","marine","retail","danger","plates","finder","hearts","course","forest","credit","stolen","remain"];
const LETTERS = "eeeeeeeeeeeeaaaaaaaaaiiiiiiiiioooooooonnnnnnrrrrrrttttttllllssssuuuuddddgggbbccmmppffhhvvwwyykjxqz";
const $ = selector => document.querySelector(selector);
const ui = {board:$("#board"),trace:$("#trace-layer"),current:$("#current-word"),message:$("#message"),form:$("#word-form"),input:$("#word-input"),score:$("#score"),timer:$("#timer"),progress:$("#timer-progress"),found:$("#found"),count:$("#found-count"),start:$("#start"),hint:$("#hint"),shuffle:$("#shuffle"),end:$("#end"),gameName:$("#game-name"),gameRule:$("#game-rule")};
const state = {game:"anagrams",mode:"timed",words:[],common:new Set(),letters:[],answers:[],commonAnswers:[],found:new Set(),selected:[],score:0,seconds:60,duration:60,timerId:null,playing:false,timerStarted:false,roundOver:false,pointerDown:false};

function counts(value){const result=new Uint8Array(26);for(const letter of value)result[letter.charCodeAt(0)-97]++;return result}
function fits(word,available){const used=new Uint8Array(26);for(const letter of word){const index=letter.charCodeAt(0)-97;if(++used[index]>available[index])return false}return true}
function anagramAnswers(letters){const available=counts(letters);return state.words.filter(word=>word.length<=6&&fits(word,available))}

function tracePath(word,board){
  function search(position,offset,visited,path){
    if(board[position]!==word[offset])return null;
    const nextPath=[...path,position];
    if(offset===word.length-1)return nextPath;
    const row=Math.floor(position/4),column=position%4,nextVisited=visited|(1<<position);
    for(let dr=-1;dr<=1;dr++)for(let dc=-1;dc<=1;dc++){
      const nr=row+dr,nc=column+dc,next=nr*4+nc;
      if((dr||dc)&&nr>=0&&nr<4&&nc>=0&&nc<4&&!(nextVisited&(1<<next))){const result=search(next,offset+1,nextVisited,nextPath);if(result)return result}
    }
    return null;
  }
  for(let i=0;i<16;i++)if(board[i]===word[0]){const result=search(i,0,0,[]);if(result)return result}
  return null;
}

function huntAnswers(board){
  const available=counts(board);
  return state.words.filter(word=>word.length<=12&&fits(word,available)&&tracePath(word,board));
}

function makePuzzle(){
  if(state.game==="anagrams"){
    for(let attempt=0;attempt<20;attempt++){
      const rack=RACKS[Math.floor(Math.random()*RACKS.length)];state.letters=rack.split("").sort(()=>Math.random()-.5);state.answers=anagramAnswers(state.letters);state.commonAnswers=state.answers.filter(word=>word.length>=4&&state.common.has(word));
      if(state.commonAnswers.length>=8)break;
    }
  }else{
    for(let attempt=0;attempt<30;attempt++){
      state.letters=Array.from({length:16},()=>LETTERS[Math.floor(Math.random()*LETTERS.length)]);state.answers=huntAnswers(state.letters);state.commonAnswers=state.answers.filter(word=>word.length>=4&&state.common.has(word));
      if(state.answers.length>=80&&state.commonAnswers.length>=18)break;
    }
  }
  renderBoard();
}

function renderBoard(){
  ui.board.className=`board ${state.game==="anagrams"?"anagram-board":"wordhunt-board"}`;
  ui.board.replaceChildren(...state.letters.map((letter,index)=>{
    const tile=document.createElement("button");tile.type="button";tile.className="tile";tile.dataset.index=index;tile.textContent=letter.toUpperCase();tile.setAttribute("aria-label",`${letter}, tile ${index+1}`);return tile;
  }));
  clearSelection();
}

function newRound(){
  clearInterval(state.timerId);makePuzzle();state.found.clear();state.score=0;state.duration=state.game==="wordhunt"?80:60;state.seconds=state.duration;state.playing=true;state.timerStarted=false;state.roundOver=false;ui.start.textContent="New board";ui.hint.disabled=false;ui.end.disabled=false;ui.message.textContent="";ui.message.className="";
  renderStats();ui.input.value="";if(matchMedia("(pointer:fine)").matches)ui.input.focus();
}
function beginTimer(){
  if(!state.playing||state.timerStarted||state.mode==="untimed")return;
  state.timerStarted=true;state.timerId=setInterval(()=>{state.seconds--;renderTimer();if(state.seconds<=0)finishRound()},1000);
}

function finishRound(){
  clearInterval(state.timerId);state.playing=false;state.roundOver=true;ui.hint.disabled=true;ui.end.disabled=true;clearSelection();notify(`Round complete · ${state.score.toLocaleString()} points`,true);renderStats();
}

function points(word){if(state.game==="anagrams")return({3:100,4:400,5:800,6:1200})[word.length]||0;return word.length===3?100:word.length===4?400:word.length===5?800:word.length===6?1400:word.length===7?1800:2200+(word.length-8)*400}
function submit(raw){
  const word=raw.toLowerCase().replace(/[^a-z]/g,"");
  if(!state.playing)return notify("Choose New board for another round.",false);
  beginTimer();
  if(word.length<3)return notify("Words need at least 3 letters.",false);
  if(state.found.has(word))return notify("Already found.",false);
  const canForm=state.game==="anagrams"?fits(word,counts(state.letters)):Boolean(tracePath(word,state.letters));
  if(!canForm)return notify("Cannot be formed on this board.",false);
  if(!state.answers.includes(word))return notify("Not in the dictionary.",false);
  state.found.add(word);state.score+=points(word);notify(`+${points(word)}`,true);renderStats();
}
function notify(text,good){ui.message.textContent=text;ui.message.className=good?"good":"bad"}
function renderStats(){
  const found=[...state.found].sort((a,b)=>b.length-a.length||a.localeCompare(b));
  const missed=state.roundOver?state.answers.filter(word=>!state.found.has(word)).sort((a,b)=>b.length-a.length||a.localeCompare(b)):[];
  ui.score.textContent=state.score.toLocaleString();ui.count.textContent=state.roundOver?`${found.length} found · ${missed.length} missed`:`${found.length} word${found.length===1?"":"s"}`;
  ui.found.innerHTML=(found.length?found.map(word=>`<span class="word-chip">${word.toUpperCase()}</span>`).join(""):"")+(state.roundOver?`<p class="results-label">MISSED</p>${missed.map(word=>`<span class="word-chip missed">${word.toUpperCase()}</span>`).join("")}`:"");renderTimer();
}
function renderTimer(){if(state.mode==="untimed"){ui.timer.textContent="∞";ui.progress.style.width="100%";return}ui.timer.textContent=`${String(Math.floor(state.seconds/60)).padStart(2,"0")}:${String(Math.max(0,state.seconds%60)).padStart(2,"0")}`;ui.progress.style.width=`${state.seconds/state.duration*100}%`}

function adjacent(a,b){if(state.game==="anagrams")return true;return Math.abs(Math.floor(a/4)-Math.floor(b/4))<=1&&Math.abs(a%4-b%4)<=1}
function select(index){if(!state.playing||state.selected.includes(index))return;const previous=state.selected.at(-1);if(previous!==undefined&&!adjacent(previous,index))return;state.selected.push(index);ui.board.children[index].classList.add("selected");ui.current.textContent=state.selected.map(i=>state.letters[i]).join("").toUpperCase();drawLine()}
function clearSelection(){state.selected=[];ui.board.querySelectorAll(".selected").forEach(tile=>tile.classList.remove("selected"));ui.trace.innerHTML="";ui.current.textContent=""}
function submitSelection(){if(state.selected.length)submit(state.selected.map(i=>state.letters[i]).join(""));clearSelection()}
function drawLine(){const area=ui.board.getBoundingClientRect(),points=state.selected.map(index=>{const tile=ui.board.children[index].getBoundingClientRect();return`${tile.left+tile.width/2-area.left},${tile.top+tile.height/2-area.top}`});ui.trace.setAttribute("viewBox",`0 0 ${area.width} ${area.height}`);ui.trace.innerHTML=points.length>1?`<polyline points="${points.join(" ")}"/>`:""}
function pointerTile(event){const tile=document.elementFromPoint(event.clientX,event.clientY)?.closest(".tile");return tile&&ui.board.contains(tile)?Number(tile.dataset.index):null}

function showHint(){
  const preferred=state.commonAnswers.filter(word=>!state.found.has(word));
  const fallback=state.answers.filter(word=>word.length>=4&&!state.found.has(word));
  const choices=preferred.length?preferred:fallback;
  if(!state.playing)return notify("Choose New board for another round.",false);
  beginTimer();
  if(!choices.length)return notify("Every 4+ letter word is already found.",true);
  notify(`Try ${choices[Math.floor(Math.random()*choices.length)].toUpperCase()}`,true);
}

function switchGame(game){
  clearInterval(state.timerId);state.game=game;ui.shuffle.hidden=game==="wordhunt";ui.gameName.textContent=game==="anagrams"?"ANAGRAMS":"WORD HUNT";ui.gameRule.textContent=game==="anagrams"?"Use each letter once":"Connect adjacent letters";
  document.querySelectorAll(".tab").forEach(tab=>{const active=tab.dataset.game===game;tab.classList.toggle("active",active);tab.setAttribute("aria-selected",active)});newRound();
}

function switchMode(mode){
  clearInterval(state.timerId);state.mode=mode;state.timerStarted=false;state.seconds=state.duration;document.querySelectorAll(".mode").forEach(button=>{const active=button.dataset.mode===mode;button.classList.toggle("active",active);button.setAttribute("aria-pressed",active)});renderTimer();
}

ui.start.addEventListener("click",newRound);ui.hint.addEventListener("click",showHint);ui.shuffle.addEventListener("click",()=>{state.letters.sort(()=>Math.random()-.5);renderBoard();ui.message.textContent=""});ui.end.addEventListener("click",finishRound);
ui.form.addEventListener("submit",event=>{event.preventDefault();submit(ui.input.value);ui.input.value=""});document.querySelectorAll(".tab").forEach(tab=>tab.addEventListener("click",()=>switchGame(tab.dataset.game)));
ui.input.addEventListener("keydown",beginTimer);
document.querySelectorAll(".mode").forEach(button=>button.addEventListener("click",()=>switchMode(button.dataset.mode)));
ui.board.addEventListener("pointerdown",event=>{const index=pointerTile(event);if(index===null)return;event.preventDefault();beginTimer();state.pointerDown=true;ui.board.setPointerCapture(event.pointerId);clearSelection();select(index)});
ui.board.addEventListener("pointermove",event=>{if(!state.pointerDown)return;const index=pointerTile(event);if(index!==null)select(index)});ui.board.addEventListener("pointerup",()=>{if(state.pointerDown){state.pointerDown=false;submitSelection()}});ui.board.addEventListener("pointercancel",()=>{state.pointerDown=false;clearSelection()});

async function loadWords(){
  try{const [dictionary,common]=await Promise.all([fetch("./words.txt"),fetch("./common-words.txt")]);if(!dictionary.ok||!common.ok)throw new Error();state.words=(await dictionary.text()).trim().split(/\s+/);state.common=new Set((await common.text()).trim().split(/\s+/));ui.start.disabled=false;ui.start.textContent="New board";newRound()}
  catch{ui.start.textContent="Dictionary failed to load";ui.message.textContent="Reload the page to try again."}
}
renderTimer();loadWords();
