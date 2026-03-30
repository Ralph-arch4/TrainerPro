const API_BASE = "https://trainer-pro-phi.vercel.app";

export function generateIntakeHtml(token: string, label: string): string {
  return `<!DOCTYPE html>
<html lang="it">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1.0"/>
<title>Questionario Cliente – TrainerPro</title>
<style>
  *{box-sizing:border-box;margin:0;padding:0}
  body{background:#0A0A0A;color:#F5F0E8;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;min-height:100vh}
  .header{background:rgba(10,10,10,0.9);backdrop-filter:blur(12px);border-bottom:1px solid rgba(255,107,43,0.15);padding:0 20px;height:56px;display:flex;align-items:center;gap:10px;position:sticky;top:0;z-index:10}
  .logo{width:32px;height:32px;border-radius:10px;background:linear-gradient(135deg,#FF6B2B,#CC4A0A);display:flex;align-items:center;justify-content:center;font-size:16px}
  .logo-text{font-weight:700;background:linear-gradient(135deg,#FF6B2B,#FF9A6C);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text}
  .badge{font-size:11px;padding:2px 10px;border-radius:20px;background:rgba(255,107,43,0.1);color:#FF9A6C;border:1px solid rgba(255,107,43,0.2)}
  .wrap{max-width:580px;margin:0 auto;padding:32px 20px 60px}
  .progress-bar-bg{height:6px;border-radius:3px;background:rgba(255,255,255,0.08);margin-bottom:8px}
  .progress-bar{height:6px;border-radius:3px;background:linear-gradient(90deg,#FF6B2B,#FF9A6C);transition:width .4s ease}
  .progress-label{display:flex;justify-content:space-between;font-size:12px;color:rgba(245,240,232,0.4);margin-bottom:28px}
  .step-title{font-size:20px;font-weight:700;color:#F5F0E8;margin-bottom:24px}
  .step{display:none}.step.active{display:block}
  .field{margin-bottom:18px}
  label{display:block;font-size:13px;font-weight:500;color:#F5F0E8;margin-bottom:6px}
  label .req{color:#FF6B2B}
  input[type=text],input[type=email],input[type=tel],input[type=number],input[type=date],select,textarea{
    width:100%;padding:10px 14px;border-radius:12px;border:1px solid rgba(255,107,43,0.2);
    background:rgba(255,255,255,0.05);color:#F5F0E8;font-size:13px;outline:none;font-family:inherit}
  textarea{resize:vertical;min-height:80px}
  select{background:#1A1A1A}
  input::placeholder,textarea::placeholder{color:rgba(245,240,232,0.3)}
  .grid2{display:grid;grid-template-columns:1fr 1fr;gap:12px}
  .radio-group{display:grid;grid-template-columns:1fr 1fr;gap:8px}
  .radio-group.cols3{grid-template-columns:1fr 1fr 1fr}
  .radio-btn{padding:10px 14px;border-radius:12px;border:1px solid rgba(255,255,255,0.08);
    background:rgba(255,255,255,0.04);color:rgba(245,240,232,0.65);font-size:13px;cursor:pointer;text-align:left;transition:all .15s}
  .radio-btn.active{background:rgba(255,107,43,0.12);border-color:rgba(255,107,43,0.4);color:#FF9A6C;font-weight:600}
  .check-group{display:flex;flex-wrap:wrap;gap:8px}
  .check-btn{padding:6px 14px;border-radius:10px;border:1px solid rgba(255,255,255,0.08);
    background:rgba(255,255,255,0.04);color:rgba(245,240,232,0.6);font-size:13px;cursor:pointer;transition:all .15s}
  .check-btn.active{background:rgba(255,107,43,0.12);border-color:rgba(255,107,43,0.4);color:#FF9A6C;font-weight:600}
  .stress-row{display:flex;gap:8px}
  .stress-btn{flex:1;height:40px;border-radius:10px;border:1px solid rgba(255,255,255,0.08);
    background:rgba(255,255,255,0.04);color:rgba(245,240,232,0.5);font-size:14px;font-weight:700;cursor:pointer;transition:all .15s}
  .stress-btn.active{background:rgba(255,107,43,0.2);border-color:rgba(255,107,43,0.5);color:#FF9A6C}
  .stress-label{text-align:center;font-size:11px;color:#FF9A6C;margin-top:6px;min-height:16px}
  .nav{display:flex;justify-content:space-between;align-items:center;margin-top:32px;padding-top:20px;border-top:1px solid rgba(255,107,43,0.1)}
  .btn-back{padding:10px 20px;border-radius:12px;border:1px solid rgba(255,255,255,0.1);
    background:transparent;color:rgba(245,240,232,0.6);font-size:13px;cursor:pointer}
  .btn-next{padding:10px 24px;border-radius:12px;border:none;
    background:linear-gradient(135deg,#FF6B2B,#CC4A0A);color:#0A0A0A;font-size:13px;font-weight:700;cursor:pointer;display:flex;align-items:center;gap:6px}
  .btn-next:disabled{opacity:0.4;cursor:not-allowed}
  .btn-submit{padding:12px 32px;border-radius:12px;border:none;
    background:linear-gradient(135deg,#FF6B2B,#CC4A0A);color:#0A0A0A;font-size:14px;font-weight:700;cursor:pointer}
  .err{padding:12px;border-radius:12px;background:rgba(239,68,68,0.08);border:1px solid rgba(239,68,68,0.25);color:#f87171;font-size:13px;margin-bottom:12px;display:none}
  .success{text-align:center;padding:48px 20px;display:none}
  .success-icon{width:80px;height:80px;border-radius:50%;background:rgba(34,197,94,0.1);border:2px solid rgba(34,197,94,0.3);
    display:flex;align-items:center;justify-content:center;margin:0 auto 20px;font-size:36px}
  .hint{font-size:11px;color:rgba(245,240,232,0.3);margin-top:5px}
</style>
</head>
<body>
<div class="header">
  <div class="logo">💪</div>
  <span class="logo-text">TrainerPro</span>
  <span class="badge">Questionario cliente</span>
</div>

<div class="wrap" id="formWrap">
  <div class="progress-bar-bg"><div class="progress-bar" id="pbar" style="width:25%"></div></div>
  <div class="progress-label"><span id="pstep">Passo 1 di 4</span><span id="pname">Dati personali</span></div>

  <!-- Step 0 -->
  <div class="step active" id="s0">
    <div class="step-title">Chi sei?</div>
    <div class="field"><label>Nome e cognome <span class="req">*</span></label><input type="text" id="fullName" placeholder="Mario Rossi"/></div>
    <div class="field"><label>Email <span class="req">*</span></label><input type="email" id="email" placeholder="mario@email.com"/></div>
    <div class="field"><label>Numero di telefono</label><input type="tel" id="phone" placeholder="+39 333 000 0000"/></div>
    <div class="grid2">
      <div class="field"><label>Data di nascita</label><input type="date" id="birthDate"/></div>
      <div class="field"><label>Sesso</label>
        <select id="gender"><option value="">— Seleziona —</option><option value="M">Maschio</option><option value="F">Femmina</option><option value="altro">Non specificato</option></select>
      </div>
    </div>
  </div>

  <!-- Step 1 -->
  <div class="step" id="s1">
    <div class="step-title">Il tuo corpo &amp; obiettivi</div>
    <div class="grid2">
      <div class="field"><label>Altezza (cm)</label><input type="number" id="height" min="100" max="230" placeholder="175"/></div>
      <div class="field"><label>Peso attuale (kg)</label><input type="number" id="currentWeight" step="0.5" placeholder="75"/></div>
      <div class="field"><label>Peso obiettivo (kg)</label><input type="number" id="targetWeight" step="0.5" placeholder="70"/></div>
      <div class="field"><label>% Grasso (se conosci)</label><input type="number" id="bodyFatPercent" step="0.5" min="3" max="60" placeholder="18"/></div>
    </div>
    <div class="field"><label>Obiettivo principale</label>
      <div class="radio-group" id="rg_goal">
        <button class="radio-btn" data-val="dimagrimento">Perdita peso</button>
        <button class="radio-btn" data-val="massa">Massa muscolare</button>
        <button class="radio-btn" data-val="tonificazione">Tonificazione</button>
        <button class="radio-btn" data-val="performance">Performance</button>
        <button class="radio-btn" data-val="salute">Salute generale</button>
        <button class="radio-btn" data-val="ricomposizione">Ricomposizione</button>
      </div>
    </div>
    <div class="field"><label>Entro quando vuoi raggiungerlo?</label>
      <div class="radio-group" id="rg_timeline">
        <button class="radio-btn" data-val="1m">1 mese</button>
        <button class="radio-btn" data-val="3m">3 mesi</button>
        <button class="radio-btn" data-val="6m">6 mesi</button>
        <button class="radio-btn" data-val="1y">1 anno</button>
        <button class="radio-btn" data-val="nessuna_fretta">Senza fretta</button>
      </div>
    </div>
    <div class="field"><label>Cosa ti motiva?</label><textarea id="motivation" placeholder="Racconta liberamente..."></textarea></div>
  </div>

  <!-- Step 2 -->
  <div class="step" id="s2">
    <div class="step-title">Come ti alleni?</div>
    <div class="field"><label>Livello di esperienza</label>
      <div class="radio-group cols3" id="rg_level">
        <button class="radio-btn" data-val="principiante">Principiante</button>
        <button class="radio-btn" data-val="intermedio">Intermedio</button>
        <button class="radio-btn" data-val="avanzato">Avanzato</button>
      </div>
    </div>
    <div class="grid2">
      <div class="field"><label>Anni di allenamento</label>
        <select id="trainingYears"><option value="">— Seleziona —</option><option value="0">Mai allenato/a</option><option value="&lt;1">Meno di 1 anno</option><option value="1-2">1–2 anni</option><option value="3-5">3–5 anni</option><option value="5+">Più di 5 anni</option></select>
      </div>
      <div class="field"><label>Frequenza attuale</label>
        <select id="currentTrainingDays"><option value="">— Seleziona —</option><option value="0">Non mi alleno</option><option value="1-2">1–2 volte/sett.</option><option value="3-4">3–4 volte/sett.</option><option value="5+">5+ volte/sett.</option></select>
      </div>
    </div>
    <div class="field"><label>Giorni disponibili</label>
      <div class="check-group" id="cg_days">
        <button class="check-btn" data-val="lun">Lunedì</button>
        <button class="check-btn" data-val="mar">Martedì</button>
        <button class="check-btn" data-val="mer">Mercoledì</button>
        <button class="check-btn" data-val="gio">Giovedì</button>
        <button class="check-btn" data-val="ven">Venerdì</button>
        <button class="check-btn" data-val="sab">Sabato</button>
        <button class="check-btn" data-val="dom">Domenica</button>
      </div>
    </div>
    <div class="field"><label>Durata sessione preferita</label>
      <div class="radio-group" id="rg_duration">
        <button class="radio-btn" data-val="30-45">30–45 min</button>
        <button class="radio-btn" data-val="45-60">45–60 min</button>
        <button class="radio-btn" data-val="60-90">60–90 min</button>
        <button class="radio-btn" data-val="90+">90+ min</button>
      </div>
    </div>
    <div class="field"><label>Dove ti alleni?</label>
      <div class="check-group" id="cg_location">
        <button class="check-btn" data-val="Palestra">Palestra</button>
        <button class="check-btn" data-val="Casa">Casa</button>
        <button class="check-btn" data-val="Outdoor">Outdoor</button>
      </div>
    </div>
    <div class="field"><label>Attrezzatura disponibile</label><textarea id="equipment" placeholder="es. manubri, bilanciere, cavi..."></textarea></div>
    <div class="field"><label>Infortuni o limitazioni fisiche</label><textarea id="injuriesOrLimitations" placeholder="es. mal di schiena, nessuno..."></textarea></div>
  </div>

  <!-- Step 3 -->
  <div class="step" id="s3">
    <div class="step-title">Alimentazione &amp; stile di vita</div>
    <div class="field"><label>Tipo di alimentazione</label>
      <div class="radio-group" id="rg_diet">
        <button class="radio-btn" data-val="Onnivoro">Onnivoro</button>
        <button class="radio-btn" data-val="Vegetariano">Vegetariano</button>
        <button class="radio-btn" data-val="Vegano">Vegano</button>
        <button class="radio-btn" data-val="Keto">Keto</button>
        <button class="radio-btn" data-val="Paleo">Paleo</button>
        <button class="radio-btn" data-val="Altro">Altro</button>
      </div>
    </div>
    <div class="field"><label>Allergie o intolleranze</label><textarea id="foodAllergies" placeholder="es. lattosio, glutine, nessuna..."></textarea></div>
    <div class="grid2">
      <div class="field"><label>Pasti al giorno</label>
        <select id="mealsPerDay"><option value="">— Seleziona —</option><option value="1-2">1–2</option><option value="3">3</option><option value="4-5">4–5</option><option value="6+">6+</option></select>
      </div>
      <div class="field"><label>Consumo di alcol</label>
        <select id="alcoholConsumption"><option value="">— Seleziona —</option><option value="No">No</option><option value="Occasionale">Occasionale</option><option value="Regolare">Regolare</option></select>
      </div>
    </div>
    <div class="field"><label>Integratori che usi</label><textarea id="supplements" placeholder="es. proteine, creatina, nessuno..."></textarea></div>
    <div class="field"><label>Tipo di lavoro</label>
      <div class="radio-group cols3" id="rg_work">
        <button class="radio-btn" data-val="Sedentario (ufficio)">Sedentario</button>
        <button class="radio-btn" data-val="In piedi">In piedi</button>
        <button class="radio-btn" data-val="Fisico">Fisico</button>
      </div>
    </div>
    <div class="grid2">
      <div class="field"><label>Ore di sonno per notte</label>
        <select id="sleepHours"><option value="">— Seleziona —</option><option value="Meno di 5h">Meno di 5h</option><option value="5-6h">5–6h</option><option value="7-8h">7–8h</option><option value="Più di 8h">Più di 8h</option></select>
      </div>
      <div class="field"><label>Livello di stress (1–5)</label>
        <div class="stress-row" id="stress_row">
          <button class="stress-btn" data-val="1">1</button>
          <button class="stress-btn" data-val="2">2</button>
          <button class="stress-btn" data-val="3">3</button>
          <button class="stress-btn" data-val="4">4</button>
          <button class="stress-btn" data-val="5">5</button>
        </div>
        <div class="stress-label" id="stress_label"></div>
      </div>
    </div>
    <div class="field"><label>Altre attività fisiche</label><textarea id="otherActivities" placeholder="es. cammino 30 min/giorno..."></textarea></div>
    <div class="field"><label>Note aggiuntive</label><textarea id="additionalNotes" placeholder="Qualsiasi altra informazione utile..."></textarea></div>
    <div class="err" id="submitErr"></div>
  </div>

  <div class="nav">
    <button class="btn-back" id="btnBack" style="visibility:hidden" onclick="prevStep()">← Indietro</button>
    <button class="btn-next" id="btnNext" onclick="nextStep()">Avanti →</button>
  </div>
</div>

<div class="success" id="successBox">
  <div class="success-icon">✅</div>
  <h2 style="font-size:22px;font-weight:700;color:#F5F0E8;margin-bottom:10px">Questionario inviato!</h2>
  <p id="successName" style="font-size:15px;color:rgba(245,240,232,0.7);margin-bottom:8px"></p>
  <p style="font-size:13px;color:rgba(245,240,232,0.45)">Il tuo personal trainer ha ricevuto le tue risposte e si metterà presto in contatto con te.</p>
</div>

<script>
const API = "${API_BASE}/api/intake/${token}";
const STEPS = ["Dati personali","Corpo & Obiettivi","Allenamento","Alimentazione & stile di vita"];
const STRESS_LABELS = {1:"Basso",2:"Normale",3:"Moderato",4:"Alto",5:"Molto alto"};
let step = 0;
let radioVals = {goal:"",timeline:"",level:"",duration:"",diet:"",work:""};
let checkVals = {days:[],location:[]};
let stressVal = 0;

// Radio groups
document.querySelectorAll('[id^="rg_"]').forEach(rg=>{
  const key = rg.id.replace("rg_","");
  const keyMap={goal:"goal",timeline:"timeline",level:"level",duration:"sessionDuration",diet:"dietType",work:"workType"};
  rg.querySelectorAll(".radio-btn").forEach(btn=>{
    btn.addEventListener("click",()=>{
      rg.querySelectorAll(".radio-btn").forEach(b=>b.classList.remove("active"));
      btn.classList.add("active");
      radioVals[key]=btn.dataset.val;
    });
  });
});

// Checkbox groups
document.querySelectorAll('[id^="cg_"]').forEach(cg=>{
  const key = cg.id.replace("cg_","");
  cg.querySelectorAll(".check-btn").forEach(btn=>{
    btn.addEventListener("click",()=>{
      btn.classList.toggle("active");
      const arr = checkVals[key];
      const v = btn.dataset.val;
      if(arr.includes(v)) checkVals[key]=arr.filter(x=>x!==v);
      else checkVals[key]=[...arr,v];
    });
  });
});

// Stress
document.querySelectorAll("#stress_row .stress-btn").forEach(btn=>{
  btn.addEventListener("click",()=>{
    document.querySelectorAll("#stress_row .stress-btn").forEach(b=>b.classList.remove("active"));
    btn.classList.add("active");
    stressVal=parseInt(btn.dataset.val);
    document.getElementById("stress_label").textContent=STRESS_LABELS[stressVal]||"";
  });
});

function updateUI(){
  document.querySelectorAll(".step").forEach((s,i)=>s.classList.toggle("active",i===step));
  document.getElementById("pbar").style.width=((step+1)/4*100)+"%";
  document.getElementById("pstep").textContent="Passo "+(step+1)+" di 4";
  document.getElementById("pname").textContent=STEPS[step];
  document.getElementById("btnBack").style.visibility=step>0?"visible":"hidden";
  const btn=document.getElementById("btnNext");
  if(step===3){btn.textContent="Invia questionario ✓";}
  else{btn.innerHTML="Avanti →";}
}

function canProceed(){
  if(step===0){
    const name=document.getElementById("fullName").value.trim();
    const email=document.getElementById("email").value.trim();
    return !!(name && email);
  }
  return true;
}

function nextStep(){
  if(!canProceed()){
    alert("Compila almeno nome e email per continuare.");
    return;
  }
  if(step<3){step++;updateUI();}
  else{submitForm();}
}
function prevStep(){if(step>0){step--;updateUI();}}

function collectData(){
  const g=id=>document.getElementById(id)?.value||undefined;
  return {
    fullName:g("fullName"),email:g("email"),phone:g("phone")||undefined,
    birthDate:g("birthDate")||undefined,gender:g("gender")||undefined,
    height:g("height")?Number(g("height")):undefined,
    currentWeight:g("currentWeight")?Number(g("currentWeight")):undefined,
    targetWeight:g("targetWeight")?Number(g("targetWeight")):undefined,
    bodyFatPercent:g("bodyFatPercent")?Number(g("bodyFatPercent")):undefined,
    primaryGoal:radioVals.goal||undefined,
    goalTimeline:radioVals.timeline||undefined,
    motivation:g("motivation")||undefined,
    level:radioVals.level||undefined,
    trainingYears:g("trainingYears")||undefined,
    currentTrainingDays:g("currentTrainingDays")||undefined,
    availableDays:checkVals.days.length?checkVals.days:undefined,
    sessionDuration:radioVals.duration||undefined,
    trainingLocation:checkVals.location.length?checkVals.location:undefined,
    equipment:g("equipment")||undefined,
    injuriesOrLimitations:g("injuriesOrLimitations")||undefined,
    dietType:radioVals.diet||undefined,
    foodAllergies:g("foodAllergies")||undefined,
    mealsPerDay:g("mealsPerDay")||undefined,
    alcoholConsumption:g("alcoholConsumption")||undefined,
    supplements:g("supplements")||undefined,
    workType:radioVals.work||undefined,
    sleepHours:g("sleepHours")||undefined,
    stressLevel:stressVal||undefined,
    otherActivities:g("otherActivities")||undefined,
    additionalNotes:g("additionalNotes")||undefined,
  };
}

async function submitForm(){
  const btn=document.getElementById("btnNext");
  btn.disabled=true;
  btn.textContent="Invio in corso…";
  document.getElementById("submitErr").style.display="none";
  try{
    const res=await fetch(API,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(collectData())});
    if(!res.ok)throw new Error("err");
    document.getElementById("formWrap").style.display="none";
    const box=document.getElementById("successBox");
    box.style.display="block";
    const name=document.getElementById("fullName")?.value||"";
    document.getElementById("successName").textContent=name?"Grazie, "+name+"!":"";
  }catch{
    const err=document.getElementById("submitErr");
    err.textContent="Si è verificato un errore. Controlla la connessione e riprova.";
    err.style.display="block";
    btn.disabled=false;
    btn.textContent="Invia questionario ✓";
  }
}

updateUI();
</script>
</body>
</html>`;
}
