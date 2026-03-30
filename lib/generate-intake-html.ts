const API_BASE = "https://trainer-pro-phi.vercel.app";

export function generateIntakeHtml(token: string, label: string): string {
  return `<!DOCTYPE html>
<html lang="it">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1.0"/>
<title>Questionario Allenamento – TrainerPro</title>
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{background:#0A0A0A;color:#F5F0E8;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;min-height:100vh}
.hdr{background:rgba(10,10,10,.92);backdrop-filter:blur(12px);border-bottom:1px solid rgba(255,107,43,.15);padding:0 20px;height:56px;display:flex;align-items:center;gap:10px;position:sticky;top:0;z-index:10}
.logo{width:30px;height:30px;border-radius:9px;background:linear-gradient(135deg,#FF6B2B,#CC4A0A);display:flex;align-items:center;justify-content:center;font-size:15px}
.logo-txt{font-weight:700;background:linear-gradient(135deg,#FF6B2B,#FF9A6C);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text}
.badge{font-size:11px;padding:2px 10px;border-radius:20px;background:rgba(255,107,43,.1);color:#FF9A6C;border:1px solid rgba(255,107,43,.2);margin-left:4px}
.wrap{max-width:620px;margin:0 auto;padding:28px 20px 60px}
.prog-bg{height:5px;border-radius:3px;background:rgba(255,255,255,.08);margin-bottom:6px}
.prog-bar{height:5px;border-radius:3px;background:linear-gradient(90deg,#FF6B2B,#FF9A6C);transition:width .4s ease}
.prog-lbl{display:flex;justify-content:space-between;font-size:11px;color:rgba(245,240,232,.4);margin-bottom:24px}
.step{display:none}.step.active{display:block}
.step-title{font-size:19px;font-weight:700;color:#F5F0E8;margin-bottom:6px}
.step-sub{font-size:13px;color:rgba(245,240,232,.4);margin-bottom:22px}
.section-label{font-size:10px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:rgba(255,107,43,.7);margin:24px 0 14px;padding-bottom:6px;border-bottom:1px solid rgba(255,107,43,.1)}
.q{margin-bottom:16px}
.ql{display:block;font-size:13px;font-weight:500;color:#F5F0E8;margin-bottom:6px}
.qn{color:rgba(255,107,43,.7);font-size:11px;font-weight:600;margin-right:4px}
.req{color:#FF6B2B;margin-left:2px}
input[type=text],input[type=email],input[type=tel],input[type=number],input[type=date],select,textarea{
  width:100%;padding:10px 13px;border-radius:11px;border:1px solid rgba(255,107,43,.2);
  background:rgba(255,255,255,.05);color:#F5F0E8;font-size:13px;outline:none;font-family:inherit;transition:border-color .15s}
input:focus,select:focus,textarea:focus{border-color:rgba(255,107,43,.45)}
textarea{resize:vertical;min-height:76px;line-height:1.5}
select{background:#151515}
input::placeholder,textarea::placeholder{color:rgba(245,240,232,.25)}
.grid2{display:grid;grid-template-columns:1fr 1fr;gap:12px}
.radio-g{display:flex;flex-wrap:wrap;gap:7px}
.rb{padding:7px 14px;border-radius:10px;border:1px solid rgba(255,255,255,.08);background:rgba(255,255,255,.04);color:rgba(245,240,232,.6);font-size:13px;cursor:pointer;transition:all .15s;white-space:nowrap}
.rb.on{background:rgba(255,107,43,.12);border-color:rgba(255,107,43,.4);color:#FF9A6C;font-weight:600}
.hint{font-size:11px;color:rgba(245,240,232,.3);margin-top:4px}
.nav{display:flex;justify-content:space-between;align-items:center;margin-top:30px;padding-top:18px;border-top:1px solid rgba(255,107,43,.1)}
.btn-bk{padding:10px 20px;border-radius:11px;border:1px solid rgba(255,255,255,.1);background:transparent;color:rgba(245,240,232,.6);font-size:13px;cursor:pointer;font-family:inherit}
.btn-nx{padding:10px 24px;border-radius:11px;border:none;background:linear-gradient(135deg,#FF6B2B,#CC4A0A);color:#0A0A0A;font-size:13px;font-weight:700;cursor:pointer;font-family:inherit}
.btn-nx:disabled{opacity:.4;cursor:not-allowed}
.err{padding:11px;border-radius:11px;background:rgba(239,68,68,.08);border:1px solid rgba(239,68,68,.25);color:#f87171;font-size:13px;margin-bottom:12px;display:none}
.ok{text-align:center;padding:56px 20px;display:none}
.ok-ico{width:84px;height:84px;border-radius:50%;background:rgba(34,197,94,.1);border:2px solid rgba(34,197,94,.3);display:flex;align-items:center;justify-content:center;margin:0 auto 20px;font-size:40px}
</style>
</head>
<body>
<div class="hdr">
  <div class="logo">💪</div>
  <span class="logo-txt">TrainerPro</span>
  <span class="badge">Questionario programmazione</span>
</div>

<div class="wrap" id="formWrap">
  <div class="prog-bg"><div class="prog-bar" id="pbar" style="width:17%"></div></div>
  <div class="prog-lbl"><span id="pstep">Passo 1 di 6</span><span id="pname">Dati personali</span></div>

  <!-- ── STEP 0: Dati personali ── -->
  <div class="step active" id="s0">
    <div class="step-title">Dati personali</div>
    <div class="step-sub">Informazioni di base su di te</div>
    <div class="q"><label class="ql"><span class="qn">1.</span>Nome e Cognome<span class="req">*</span></label><input type="text" id="fullName" placeholder="Mario Rossi"/></div>
    <div class="q"><label class="ql"><span class="qn">2.</span>Età</label><input type="number" id="age" min="10" max="100" placeholder="es. 28"/></div>
    <div class="grid2">
      <div class="q"><label class="ql"><span class="qn">3a.</span>Altezza (cm)</label><input type="number" id="height" min="130" max="230" placeholder="es. 178"/></div>
      <div class="q"><label class="ql"><span class="qn">3b.</span>Peso attuale (kg)</label><input type="number" id="currentWeight" step="0.5" placeholder="es. 80"/></div>
    </div>
  </div>

  <!-- ── STEP 1: Obiettivi & Motivazione ── -->
  <div class="step" id="s1">
    <div class="step-title">Obiettivi &amp; Motivazione</div>
    <div class="step-sub">Capire cosa vuoi ottenere ci aiuta a costruire il programma giusto</div>
    <div class="q"><label class="ql"><span class="qn">4.</span>Qual è il tuo obiettivo principale?</label><textarea id="primaryGoal" placeholder="es. perdere peso, aumentare la massa muscolare, stare meglio..."></textarea></div>
    <div class="q"><label class="ql"><span class="qn">5.</span>Hai obiettivi secondari?</label><textarea id="secondaryGoals" placeholder="es. migliorare la postura, aumentare la resistenza..."></textarea></div>
    <div class="q"><label class="ql"><span class="qn">6.</span>Cosa ti spinge ad allenarti?</label><textarea id="motivation" placeholder="Racconta cosa ti motiva a iniziare o continuare..."></textarea></div>
  </div>

  <!-- ── STEP 2: Esperienza in palestra ── -->
  <div class="step" id="s2">
    <div class="step-title">Esperienza in palestra</div>
    <div class="step-sub">Ci serve per calibrare i carichi e la difficoltà del programma</div>
    <div class="q"><label class="ql"><span class="qn">7.</span>Hai esperienza in palestra?</label>
      <div class="radio-g" id="rg_gymExp"><div class="rb" data-v="Sì, molta">Sì, molta</div><div class="rb" data-v="Sì, un po'">Sì, un po'</div><div class="rb" data-v="Poca o nessuna">Poca o nessuna</div></div></div>
    <div class="q"><label class="ql"><span class="qn">8.</span>Da quanto tempo ti alleni?</label>
      <select id="trainingYears"><option value="">— Seleziona —</option><option>Mai iniziato/a</option><option>Meno di 6 mesi</option><option>6 mesi – 1 anno</option><option>1–2 anni</option><option>3–5 anni</option><option>Più di 5 anni</option></select></div>
    <div class="q"><label class="ql"><span class="qn">9.</span>Hai mai seguito una scheda o un programma strutturato?</label>
      <div class="radio-g" id="rg_prog"><div class="rb" data-v="Sì">Sì</div><div class="rb" data-v="No">No</div><div class="rb" data-v="Qualche volta">Qualche volta</div></div></div>
    <div class="q"><label class="ql"><span class="qn">10.</span>Quali esercizi conosci tecnicamente bene?</label><textarea id="knownExercises" placeholder="es. squat, panca piana, stacco, trazioni..."></textarea></div>
    <div class="q"><label class="ql"><span class="qn">11.</span>Quale/i muscolo/i senti lavorare maggiormente in palestra?</label><textarea id="musclesFelt" placeholder="es. sento molto il petto sulla panca, i quadricipiti sullo squat..."></textarea></div>
    <div class="q"><label class="ql"><span class="qn">12.</span>Quale/i muscolo/i non riesci a sentire bene?</label><textarea id="musclesNotFelt" placeholder="es. non sento mai lavorare i dorsali, il bicipite femorale..."></textarea></div>
    <div class="q"><label class="ql"><span class="qn">13.</span>Quali sono i tuoi esercizi preferiti?</label><textarea id="favoriteExercises" placeholder="es. squat, pull-up, dips..."></textarea></div>
    <div class="q"><label class="ql"><span class="qn">14.</span>Ci sono esercizi che non vuoi fare? Se sì, quali?</label><textarea id="unwantedExercises" placeholder="es. leg press, affondi... (indica anche il motivo se vuoi)"></textarea></div>
    <div class="q"><label class="ql"><span class="qn">15.</span>In quale/i esercizio/i ti senti più "forte"?</label><textarea id="strongExercises" placeholder="es. panca: riesco a fare 100 kg, squat: 120 kg..."></textarea></div>
    <div class="q"><label class="ql"><span class="qn">16.</span>In quale/i esercizio/i ti senti più "debole"?</label><textarea id="weakExercises" placeholder="es. trazioni: solo con elastico, stacco: tecnica da migliorare..."></textarea></div>
    <div class="q"><label class="ql"><span class="qn">17.</span>Sport praticati in passato (anche a livello agonistico)?</label><textarea id="pastSports" placeholder="es. calcio per 10 anni, nuoto a livello agonistico, nessuno..."></textarea></div>
    <div class="q"><label class="ql"><span class="qn">18.</span>Pratichi attualmente altri sport? Se sì, quali?</label><textarea id="currentSports" placeholder="es. calcetto il venerdì, crossfit 2 volte a settimana..."></textarea></div>
    <div class="q"><label class="ql"><span class="qn">19.</span>Valuta la tua resistenza/forza attuale</label><textarea id="fitnessAssessment" placeholder="es. riesco a fare 20 push-up, corsa 20 min prima di fermarmi, squat 60 kg per 10 rip..."></textarea></div>
    <div class="q"><label class="ql"><span class="qn">20.</span>Preferisci un tipo di allenamento in particolare?</label>
      <div class="radio-g" id="cg_trainType">
        <div class="rb" data-v="Bodybuilding">Bodybuilding</div>
        <div class="rb" data-v="Funzionale">Funzionale</div>
        <div class="rb" data-v="HIIT">HIIT</div>
        <div class="rb" data-v="Circuiti">Circuiti</div>
        <div class="rb" data-v="Aerobico">Aerobico</div>
        <div class="rb" data-v="Powerlifting">Powerlifting</div>
        <div class="rb" data-v="Nessuna preferenza">Nessuna preferenza</div>
      </div>
      <p class="hint">Puoi selezionarne più di uno</p>
    </div>
  </div>

  <!-- ── STEP 3: Disponibilità & Logistica ── -->
  <div class="step" id="s3">
    <div class="step-title">Disponibilità &amp; Logistica</div>
    <div class="step-sub">Come e quando riesci ad allenarti</div>
    <div class="q"><label class="ql"><span class="qn">21.</span>Quanto tempo puoi dedicare al massimo a un singolo allenamento?</label>
      <select id="sessionDuration"><option value="">— Seleziona —</option><option>30–45 minuti</option><option>45–60 minuti</option><option>60–75 minuti</option><option>75–90 minuti</option><option>Più di 90 minuti</option></select></div>
    <div class="q"><label class="ql"><span class="qn">22.</span>Quante volte a settimana puoi allenarti?</label>
      <select id="trainingDaysPerWeek"><option value="">— Seleziona —</option><option>1–2 volte</option><option>3 volte</option><option>4 volte</option><option>5 volte</option><option>6+ volte</option></select></div>
    <div class="q"><label class="ql"><span class="qn">23.</span>Puoi allenarti il fine settimana?</label>
      <div class="radio-g" id="rg_weekend"><div class="rb" data-v="Sì, entrambi i giorni">Sì, entrambi</div><div class="rb" data-v="Solo sabato">Solo sabato</div><div class="rb" data-v="Solo domenica">Solo domenica</div><div class="rb" data-v="No">No</div></div></div>
    <div class="q"><label class="ql"><span class="qn">24.</span>Hai la possibilità di allenarti in casa?</label>
      <div class="radio-g" id="rg_home"><div class="rb" data-v="Sì">Sì</div><div class="rb" data-v="No">No</div><div class="rb" data-v="A volte">A volte</div></div></div>
    <div class="q"><label class="ql"><span class="qn">25.</span>Hai attrezzatura per allenarti in casa? Se sì, cosa?</label><textarea id="homeEquipment" placeholder="es. manubri fino a 20 kg, tapis roulant, sbarra trazioni, nessuna..."></textarea></div>
    <div class="q"><label class="ql"><span class="qn">26.</span>Riesci ad andare in palestra sempre alla stessa ora o l'orario cambia?</label>
      <div class="radio-g" id="rg_schedule"><div class="rb" data-v="Sempre stessa ora">Sempre stessa ora</div><div class="rb" data-v="Orario variabile">Orario variabile</div></div></div>
    <div class="q"><label class="ql"><span class="qn">27.</span>Preferisci allenarti solo/a o con qualcuno?</label>
      <div class="radio-g" id="rg_partner"><div class="rb" data-v="Solo/a">Solo/a</div><div class="rb" data-v="Con qualcuno">Con qualcuno</div><div class="rb" data-v="Indifferente">Indifferente</div></div></div>
    <div class="q"><label class="ql"><span class="qn">28.</span>Ti alleni meglio la mattina, il pomeriggio o la sera?</label>
      <div class="radio-g" id="rg_timeofday"><div class="rb" data-v="Mattina">Mattina</div><div class="rb" data-v="Pomeriggio">Pomeriggio</div><div class="rb" data-v="Sera">Sera</div><div class="rb" data-v="Indifferente">Indifferente</div></div></div>
  </div>

  <!-- ── STEP 4: Salute & Infortuni ── -->
  <div class="step" id="s4">
    <div class="step-title">Salute &amp; Infortuni</div>
    <div class="step-sub">Fondamentale per evitare esercizi controindicati</div>
    <div class="q"><label class="ql"><span class="qn">29.</span>Hai problemi articolari o muscolari?</label><textarea id="jointProblems" placeholder="es. mal di schiena lombare, ginocchio instabile, spalla dolorante, nessuno..."></textarea></div>
    <div class="q"><label class="ql"><span class="qn">30.</span>Soffri di qualche patologia? Se sì, quale/i?</label><textarea id="pathologies" placeholder="es. ernia discale, ipertensione, diabete, nessuna..."></textarea></div>
    <div class="q"><label class="ql"><span class="qn">31.</span>Hai avuto infortuni? Se sì, quale/i?</label><textarea id="injuries" placeholder="es. distorsione caviglia (2022), strappo bicipite (risolto), nessuno..."></textarea></div>
    <div class="q"><label class="ql"><span class="qn">32.</span>Assumi farmaci regolarmente? Se sì, quale/i?</label><textarea id="medications" placeholder="es. antipertensivi, nessuno..."></textarea></div>
    <div class="q"><label class="ql"><span class="qn">33.</span>Utilizzi qualche integratore? Se sì, quale/i?</label><textarea id="supplements" placeholder="es. proteine whey, creatina, omega-3, nessuno..."></textarea></div>
    <div class="q"><label class="ql"><span class="qn">34.</span>Soffri di problemi digestivi/intestinali? Se sì, quali?</label><textarea id="digestiveIssues" placeholder="es. colon irritabile, reflusso, nessuno..."></textarea></div>
  </div>

  <!-- ── STEP 5: Stile di vita & Alimentazione ── -->
  <div class="step" id="s5">
    <div class="step-title">Stile di vita &amp; Alimentazione</div>
    <div class="step-sub">Ci aiuta a capire il tuo contesto quotidiano</div>

    <div class="section-label">Stile di vita</div>
    <div class="q"><label class="ql"><span class="qn">35.</span>Il tuo lavoro è molto impegnativo?</label>
      <div class="radio-g" id="rg_work"><div class="rb" data-v="Sì, molto">Sì, molto</div><div class="rb" data-v="Abbastanza">Abbastanza</div><div class="rb" data-v="No, poco stress">No, poco stress</div></div></div>
    <div class="q"><label class="ql"><span class="qn">36.</span>Quante volte lavori a settimana?</label>
      <select id="workDaysPerWeek"><option value="">— Seleziona —</option><option>3 giorni o meno</option><option>4 giorni</option><option>5 giorni</option><option>6 giorni</option><option>Tutti i giorni</option></select></div>
    <div class="q"><label class="ql"><span class="qn">37.</span>Sei spesso in movimento durante il giorno oppure tendi ad essere più sedentario/a?</label>
      <div class="radio-g" id="rg_activity"><div class="rb" data-v="Molto attivo/a">Molto attivo/a</div><div class="rb" data-v="Moderatamente attivo/a">Moderatamente attivo/a</div><div class="rb" data-v="Sedentario/a">Sedentario/a</div></div></div>
    <div class="q"><label class="ql"><span class="qn">38.</span>Quante ore dormi mediamente a notte?</label>
      <select id="sleepHours"><option value="">— Seleziona —</option><option>Meno di 5h</option><option>5–6h</option><option>6–7h</option><option>7–8h</option><option>Più di 8h</option></select></div>
    <div class="q"><label class="ql"><span class="qn">39.</span>Com'è la qualità del tuo sonno?</label>
      <div class="radio-g" id="rg_sleep"><div class="rb" data-v="Buona">Buona</div><div class="rb" data-v="Discreta">Discreta</div><div class="rb" data-v="Scarsa">Scarsa</div></div>
      <p class="hint">es. sonno profondo, risvegli frequenti, difficoltà ad addormentarsi…</p></div>

    <div class="section-label">Alimentazione</div>
    <div class="q"><label class="ql"><span class="qn">40.</span>Quante volte vai mediamente a mangiare fuori nel corso della settimana?</label>
      <select id="eatingOutFrequency"><option value="">— Seleziona —</option><option>Mai</option><option>1 volta</option><option>2–3 volte</option><option>4–5 volte</option><option>Quasi ogni giorno</option></select></div>
    <div class="q"><label class="ql"><span class="qn">41.</span>Cosa mangi di solito quando "sgarri"?</label><textarea id="cheatFoods" placeholder="es. pizza, gelato, fast food, dolci..."></textarea></div>
    <div class="q"><label class="ql"><span class="qn">42.</span>Sei vegetariano/vegano/pescetariano/ecc.?</label>
      <div class="radio-g" id="rg_diet"><div class="rb" data-v="Onnivoro/a">Onnivoro/a</div><div class="rb" data-v="Vegetariano/a">Vegetariano/a</div><div class="rb" data-v="Vegano/a">Vegano/a</div><div class="rb" data-v="Pescetariano/a">Pescetariano/a</div><div class="rb" data-v="Altro">Altro</div></div></div>
    <div class="q"><label class="ql"><span class="qn">43.</span>Soffri di intolleranze o allergie alimentari?</label><textarea id="foodAllergies" placeholder="es. lattosio, glutine, frutta secca, nessuna..."></textarea></div>
    <div class="q"><label class="ql"><span class="qn">44.</span>Quanti pasti fai al giorno?</label>
      <select id="mealsPerDay"><option value="">— Seleziona —</option><option>1–2</option><option>3</option><option>4</option><option>5+</option></select></div>
    <div class="q"><label class="ql"><span class="qn">45.</span>Come suddividi i pasti nel corso della giornata?</label><textarea id="mealDistribution" placeholder="es. colazione ore 8, pranzo ore 13, cena ore 20..."></textarea></div>
    <div class="q"><label class="ql"><span class="qn">46.</span>Hai la possibilità di prepararti i pasti da solo/a?</label>
      <div class="radio-g" id="rg_mealprep"><div class="rb" data-v="Sì, sempre">Sì, sempre</div><div class="rb" data-v="A volte">A volte</div><div class="rb" data-v="Raramente">Raramente</div></div></div>
    <div class="q"><label class="ql"><span class="qn">47.</span>Quanta acqua bevi in media al giorno?</label>
      <select id="waterIntake"><option value="">— Seleziona —</option><option>Meno di 1 litro</option><option>1–1.5 litri</option><option>1.5–2 litri</option><option>2–2.5 litri</option><option>Più di 2.5 litri</option></select></div>
    <div class="q"><label class="ql"><span class="qn">48.</span>Consumi alcolici? Indicare la frequenza</label>
      <div class="radio-g" id="rg_alcol"><div class="rb" data-v="No">No</div><div class="rb" data-v="Raramente">Raramente</div><div class="rb" data-v="1–2 volte/sett.">1–2 volte/sett.</div><div class="rb" data-v="Quasi ogni giorno">Quasi ogni giorno</div></div></div>
    <div class="q"><label class="ql"><span class="qn">49.</span>Elenca ciò che mangi in una giornata tipo</label><textarea id="typicalDayMeals" placeholder="Colazione: ...&#10;Spuntino: ...&#10;Pranzo: ...&#10;Spuntino: ...&#10;Cena: ..." style="min-height:110px"></textarea></div>

    <div class="err" id="submitErr"></div>
  </div>

  <div class="nav">
    <button class="btn-bk" id="btnBack" style="visibility:hidden" onclick="prevStep()">← Indietro</button>
    <button class="btn-nx" id="btnNext" onclick="nextStep()">Avanti →</button>
  </div>
</div>

<div class="ok" id="okBox">
  <div class="ok-ico">✅</div>
  <h2 style="font-size:21px;font-weight:700;color:#F5F0E8;margin-bottom:10px">Questionario inviato!</h2>
  <p id="okName" style="font-size:15px;color:rgba(245,240,232,.7);margin-bottom:8px"></p>
  <p style="font-size:13px;color:rgba(245,240,232,.4)">Il tuo personal trainer ha ricevuto tutte le risposte e si farà vivo presto.</p>
</div>

<script>
const API="${API_BASE}/api/intake/${token}";
const STEPS=["Dati personali","Obiettivi & Motivazione","Esperienza in palestra","Disponibilità & Logistica","Salute & Infortuni","Stile di vita & Alimentazione"];
let step=0;
// radio (single)
const radios={gymExp:"",prog:"",weekend:"",home:"",schedule:"",partner:"",timeofday:"",work:"",activity:"",sleep:"",diet:"",mealprep:"",alcol:""};
// checkbox (multi)
const checks={trainType:[]};

function setupRadio(id,key,multi){
  const el=document.getElementById("rg_"+id)||document.getElementById("cg_"+id);
  if(!el)return;
  el.querySelectorAll(".rb").forEach(b=>{
    b.addEventListener("click",()=>{
      if(multi){
        b.classList.toggle("on");
        const v=b.dataset.v;
        if(checks[key].includes(v))checks[key]=checks[key].filter(x=>x!==v);
        else checks[key]=[...checks[key],v];
      }else{
        el.querySelectorAll(".rb").forEach(x=>x.classList.remove("on"));
        b.classList.add("on");
        radios[key]=b.dataset.v;
      }
    });
  });
}
setupRadio("gymExp","gymExp");setupRadio("prog","prog");setupRadio("weekend","weekend");
setupRadio("home","home");setupRadio("schedule","schedule");setupRadio("partner","partner");
setupRadio("timeofday","timeofday");setupRadio("work","work");setupRadio("activity","activity");
setupRadio("sleep","sleep");setupRadio("diet","diet");setupRadio("mealprep","mealprep");
setupRadio("alcol","alcol");
setupRadio("trainType","trainType",true);

function g(id){return document.getElementById(id)?.value||undefined;}

function collect(){
  return{
    fullName:g("fullName"),age:g("age"),height:g("height"),currentWeight:g("currentWeight"),
    primaryGoal:g("primaryGoal"),secondaryGoals:g("secondaryGoals"),motivation:g("motivation"),
    gymExperience:radios.gymExp||undefined,trainingYears:g("trainingYears"),
    hasFollowedProgram:radios.prog||undefined,knownExercises:g("knownExercises"),
    musclesFelt:g("musclesFelt"),musclesNotFelt:g("musclesNotFelt"),
    favoriteExercises:g("favoriteExercises"),unwantedExercises:g("unwantedExercises"),
    strongExercises:g("strongExercises"),weakExercises:g("weakExercises"),
    pastSports:g("pastSports"),currentSports:g("currentSports"),fitnessAssessment:g("fitnessAssessment"),
    trainingTypePreference:checks.trainType.length?checks.trainType:undefined,
    sessionDuration:g("sessionDuration"),trainingDaysPerWeek:g("trainingDaysPerWeek"),
    canTrainWeekend:radios.weekend||undefined,canTrainHome:radios.home||undefined,
    homeEquipment:g("homeEquipment"),fixedSchedule:radios.schedule||undefined,
    trainingPartner:radios.partner||undefined,preferredTrainingTime:radios.timeofday||undefined,
    jointProblems:g("jointProblems"),pathologies:g("pathologies"),injuries:g("injuries"),
    medications:g("medications"),supplements:g("supplements"),digestiveIssues:g("digestiveIssues"),
    workDemanding:radios.work||undefined,workDaysPerWeek:g("workDaysPerWeek"),
    activityLevel:radios.activity||undefined,sleepHours:g("sleepHours"),
    sleepQuality:radios.sleep||undefined,eatingOutFrequency:g("eatingOutFrequency"),
    cheatFoods:g("cheatFoods"),dietType:radios.diet||undefined,foodAllergies:g("foodAllergies"),
    mealsPerDay:g("mealsPerDay"),mealDistribution:g("mealDistribution"),
    canPrepMeals:radios.mealprep||undefined,waterIntake:g("waterIntake"),
    alcoholConsumption:radios.alcol||undefined,typicalDayMeals:g("typicalDayMeals"),
  };
}

function ui(){
  document.querySelectorAll(".step").forEach((s,i)=>s.classList.toggle("active",i===step));
  document.getElementById("pbar").style.width=((step+1)/6*100)+"%";
  document.getElementById("pstep").textContent="Passo "+(step+1)+" di 6";
  document.getElementById("pname").textContent=STEPS[step];
  document.getElementById("btnBack").style.visibility=step>0?"visible":"hidden";
  document.getElementById("btnNext").textContent=step===5?"Invia questionario ✓":"Avanti →";
}

function canNext(){
  if(step===0){const n=g("fullName");return !!(n&&n.trim());}
  return true;
}

function nextStep(){
  if(!canNext()){alert("Il nome è obbligatorio per continuare.");return;}
  if(step<5){step++;ui();window.scrollTo(0,0);}else{submit();}
}
function prevStep(){if(step>0){step--;ui();window.scrollTo(0,0);}}

async function submit(){
  const btn=document.getElementById("btnNext");
  btn.disabled=true;btn.textContent="Invio in corso…";
  document.getElementById("submitErr").style.display="none";
  try{
    const r=await fetch(API,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(collect())});
    if(!r.ok)throw 0;
    document.getElementById("formWrap").style.display="none";
    const ok=document.getElementById("okBox");ok.style.display="block";
    const nm=g("fullName")||"";
    document.getElementById("okName").textContent=nm?"Grazie, "+nm+"!":"";
  }catch{
    const e=document.getElementById("submitErr");
    e.textContent="Si è verificato un errore. Controlla la connessione e riprova.";
    e.style.display="block";
    btn.disabled=false;btn.textContent="Invia questionario ✓";
  }
}
ui();
</script>
</body>
</html>`;
}
