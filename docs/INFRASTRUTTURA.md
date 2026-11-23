# Hosting, database e conformita'

## Hosting: Vercel va bene, ma non sul piano gratuito

L'app Android del Play Store e' un contenitore che apre il sito: a Google
basta un sito HTTPS stabile. Vercel e' adatto e non serve migrare.

Da fare:
1. **Passare a Vercel Pro**. Il piano Hobby e' riservato a uso personale non
   commerciale: un servizio venduto ai trainer lo viola e il progetto puo'
   essere sospeso. Il piano Pro include anche l'accordo sul trattamento dei
   dati (DPA) necessario per il GDPR.
2. **Dominio proprio** (es. `app.tuodominio.it`) al posto di
   `trainer-pro-phi.vercel.app`. L'app Android e' legata al dominio: sceglilo
   prima di generare il pacchetto, poi aggiorna `android/twa-manifest.json`,
   `NEXT_PUBLIC_APP_URL` su Vercel e gli URL consentiti in Supabase
   (Authentication > URL Configuration).
3. **Funzioni in Europa**: `vercel.json` imposta gia' la regione `fra1`
   (Francoforte), cosi' i dati non vengono elaborati fuori dall'UE.

Alternative se un giorno Vercel non bastasse: Netlify o Cloudflare (stesso
modello), oppure un server europeo (Hetzner, OVH) con Coolify. Oggi non
danno vantaggi concreti e richiedono piu' manutenzione.

## Database: Supabase va bene

Supabase e' PostgreSQL gestito, lo stesso database usato in ambito
professionale; le regole di accesso per riga gia' presenti isolano i dati di
ogni trainer. Non serve cambiare prodotto, serve configurarlo da produzione:

1. **Piano Pro**. Il piano gratuito mette in pausa il progetto dopo una
   settimana senza attivita' e non garantisce backup: non e' adatto a dati di
   clienti reali. Il Pro ha backup giornalieri.
2. **Regione UE**. Controlla in Project Settings > General che la regione sia
   europea (es. Francoforte). La regione non si puo' cambiare: se il progetto
   e' negli Stati Uniti va creato un progetto nuovo in UE e migrati i dati.
3. **DPA**: firmalo da Organization > Legal Documents.
4. **Sicurezza account**: autenticazione a due fattori sull'account Supabase,
   conferma email attiva per le registrazioni, chiave `service_role` solo
   nelle variabili di Vercel.
5. Facoltativo quando i clienti crescono: Point-in-Time Recovery.

## Pulizia dati dopo la rimozione di foto e scanner AI

1. Esegui `supabase/migrations/025_remove_photos_and_ai_scan.sql` (cancella
   in modo definitivo foto, scansioni e analisi).
2. In Storage elimina i bucket `fitness-scans`, `progress-photos` e
   `Trainer Progress Bar`.
3. Su Vercel rimuovi la variabile `ANTHROPIC_API_KEY` e revoca la chiave
   dalla console del fornitore.
4. **Cambia la password dell'account di test** che era scritta in chiaro nel
   file `test-scheda-flow.mjs` (ora rimosso, ma resta nella cronologia Git).

## Attivare i piani demo / Premium

1. Esegui `supabase/migrations/026_plans_premium.sql` nell'SQL Editor. Non
   cancella e non modifica i dati esistenti: aggiunge lo stato Premium ai
   profili, impedisce al trainer di cambiarsi il piano da solo e limita la
   demo a un cliente.
2. Esegui anche la migrazione `028_admin_moderation.sql` (dopo la 027) e dai a te
   stesso il ruolo admin nell'SQL Editor, con l'email del tuo account:
   `insert into public.user_roles (user_id, role) select id, 'admin' from auth.users where email = 'TUA-EMAIL' on conflict do nothing;`
   Accedi all'app con quell'account e apri `/admin`. Nessuna variabile su Vercel
   da impostare (serve solo `SUPABASE_SERVICE_ROLE_KEY`, gia' usata dall'app).
3. Approva subito i trainer che stanno gia' lavorando: finche' non li approvi
   restano in demo, vedono tutti i loro dati ma non possono aggiungere clienti.
4. Quando hai i dati di pagamento, inseriscili nelle variabili elencate in
   `docs/PLAY_STORE.md`.

## Cosa resta da valutare con un consulente

- Informativa privacy (`/privacy`): e' un testo base, va completato con i
  dati del titolare e rivisto da un consulente privacy.
- Contratto con i trainer: nomina a responsabile del trattamento (art. 28
  GDPR), perche' i dati dei clienti sono del trainer e l'app li tratta per
  suo conto.
- Sezione diete: in Italia la dieta personalizzata e' riservata a
  professionisti abilitati. Il rischio e' del trainer che la usa; nell'app
  c'e' un avviso. Valuta se rinominarla o limitarla.
- Registro dei marchi: prima di pubblicare verifica il nome su TMview
  (tmdn.org) e UIBM nelle classi 9, 41 e 42.
