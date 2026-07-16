const videoInput=document.getElementById('videoInput');
const videoPreview=document.getElementById('videoPreview');
const analyzeButton=document.getElementById('analyzeButton');
const report=document.getElementById('report');
const statusMessage=document.getElementById('statusMessage');

videoInput.addEventListener('change',()=>{
  const file=videoInput.files[0];
  if(!file){videoPreview.hidden=true;analyzeButton.disabled=true;return;}
  if(!file.type.startsWith('video/')){statusMessage.textContent='Please choose a valid video file.';analyzeButton.disabled=true;return;}
  videoPreview.src=URL.createObjectURL(file);
  videoPreview.hidden=false;
  analyzeButton.disabled=false;
  statusMessage.textContent=`${file.name} selected.`;
});

analyzeButton.addEventListener('click',()=>{
  const playerName=document.getElementById('playerName').value.trim()||'POWR Athlete';
  const clipType=document.getElementById('clipType').value;
  const goal=document.getElementById('goal').value;
  analyzeButton.disabled=true;
  statusMessage.textContent='Reviewing clip and building report...';
  setTimeout(()=>{
    document.getElementById('reportPlayer').textContent=playerName;
    document.getElementById('reportClipType').textContent=clipType;
    document.getElementById('nextFocus').textContent=`Prioritize ${goal.toLowerCase()} during the next skating session.`;
    report.hidden=false;
    report.scrollIntoView({behavior:'smooth'});
    statusMessage.textContent='Sample report generated.';
    analyzeButton.disabled=false;
  },1200);
});
